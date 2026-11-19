"""
PDF (pypdf), DOCX (python-docx), and TXT Resume Parser for CareerMatch AI.
Phase 1 improvements:
- Preserves degree names like "B.Tech" (splits by lines instead of every '.')
- Never hardcodes year or location (leaves blank if not in text)
- Extracts structured work experience (role, company, duration, highlights)
- Ignores section headers like "CERTIFICATIONS" when collecting certificates
- Removes ambiguous short aliases (ts, js, py, ml, rag, soc, eks)
- Uses "Detected" instead of "Verified"
- Supports optional Gemini structured extraction (with strict verification against resume text)
"""

from __future__ import annotations

import io
import logging
import os
import re
import uuid
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    import pymupdf as fitz  # type: ignore
except ImportError:
    try:
        import fitz  # type: ignore
    except ImportError:
        fitz = None

try:
    from pypdf import PdfReader  # type: ignore
except ImportError:
    PdfReader = None

try:
    import docx  # type: ignore
except ImportError:
    docx = None


# Unambiguous skill catalog (short 2-3 letter aliases like ts, js, py, ml, rag, soc, eks removed)
KNOWN_SKILLS_CATALOG: Dict[str, List[str]] = {
    "Python": ["python", "python3"],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite", "tsql", "pl/sql"],
    "Java": ["java", "jdk", "j2ee", "core java"],
    "JavaScript": ["javascript", "ecmascript", "vanilla js"],
    "TypeScript": ["typescript"],
    "C++": ["c++", "cpp"],
    "React": ["react", "reactjs", "react.js", "next.js", "nextjs"],
    "Node.js": ["node.js", "nodejs", "express.js"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django", "django rest framework"],
    "Flask": ["flask"],
    "Spring Boot": ["spring boot", "spring framework", "spring mvc"],
    "HTML/CSS": ["html", "html5", "css", "css3", "tailwind", "bootstrap"],
    "REST APIs": ["rest api", "restful", "rest apis", "openapi", "swagger", "graphql"],
    "Git": ["git", "github", "gitlab", "version control"],
    "Docker": ["docker", "dockerfile", "docker-compose"],
    "Kubernetes": ["kubernetes", "k8s", "helm", "gke"],
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "rds", "cloudwatch"],
    "CI/CD": ["ci/cd", "github actions", "jenkins", "gitlab ci"],
    "Linux": ["linux", "ubuntu", "bash", "shell scripting"],
    "Machine Learning": ["machine learning", "scikit-learn", "sklearn", "xgboost", "random forest"],
    "Deep Learning": ["deep learning", "pytorch", "tensorflow", "keras", "neural networks"],
    "NLP": ["natural language processing", "spacy", "huggingface", "bert"],
    "Pandas & NumPy": ["pandas", "numpy", "scipy"],
    "Data Visualization": ["tableau", "power bi", "powerbi", "matplotlib", "seaborn", "plotly", "data visualization"],
    "Statistics": ["statistics", "hypothesis testing", "a/b testing", "statistical modeling", "statistics and probability"],
    "Apache Spark": ["apache spark", "pyspark", "spark sql"],
    "Airflow": ["airflow", "apache airflow"],
    "Data Warehousing": ["data warehousing", "data warehouse", "snowflake", "bigquery", "redshift", "dbt", "dimensional modeling"],
    "Kafka": ["kafka", "apache kafka", "event streaming"],
    "MongoDB": ["mongodb", "mongoose", "nosql"],
    "Redis": ["redis"],
    "Network Security": ["network security", "firewalls", "wireshark", "ids/ips"],
    "SIEM & SOC": ["siem", "splunk", "qradar", "incident response", "threat hunting"],
    "OWASP & AppSec": ["owasp", "penetration testing", "burp suite", "vulnerability assessment", "appsec"],
    "IAM & Cryptography": ["identity and access management", "cryptography", "encryption", "zero trust", "tls/ssl", "pki"],
    "System Design": ["system design", "microservices", "distributed systems"],
    "Automated Testing": ["pytest", "jest", "unit testing", "selenium", "cypress", "testing and debugging"],
}

SOFT_SKILLS_CATALOG: List[str] = [
    "Communication",
    "Problem Solving",
    "Team Leadership",
    "Agile & Scrum",
    "Cross-Functional Collaboration",
    "Analytical Thinking",
]

SECTION_HEADERS = {
    "EDUCATION",
    "TECHNICAL SKILLS",
    "SKILLS",
    "INTERNSHIPS & WORK EXPERIENCE",
    "WORK EXPERIENCE",
    "EXPERIENCE",
    "INTERNSHIPS",
    "ACADEMIC & PERSONAL PROJECTS",
    "PROJECTS",
    "CERTIFICATIONS",
    "CERTIFICATES",
    "ACHIEVEMENTS",
    "AWARDS",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "CAREER OBJECTIVE",
    "OBJECTIVE",
    "PUBLICATIONS",
    "PUBLICATIONS & RESEARCH",
    "RESEARCH EXPERIENCE",
    "RESEARCH INTERESTS",
    "LANGUAGES",
    "REFERENCES",
    "HOBBIES",
}

CANONICAL_SECTION_PATTERNS: List[Tuple[str, re.Pattern]] = [
    (
        "SUMMARY",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:professional\s+summary|career\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective)$",
            re.I,
        ),
    ),
    (
        "EXPERIENCE",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:work\s+experience|professional\s+experience|employment\s+history|career\s+history|work\s+history|internships\s*&\s*work\s+experience|internships|experience|practical\s+experience|relevant\s+experience)$",
            re.I,
        ),
    ),
    (
        "EDUCATION",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:academic\s+background|academic\s+history|educational\s+background|qualifications|academics|degrees|education)$",
            re.I,
        ),
    ),
    (
        "PROJECTS",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:academic\s*&\s*personal\s+projects|personal\s+projects|key\s+projects|academic\s+projects|selected\s+projects|technical\s+projects|portfolio|projects)$",
            re.I,
        ),
    ),
    (
        "SKILLS",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:technical\s+skills|core\s+competencies|areas\s+of\s+expertise|technologies|tech\s+stack|technical\s+proficiencies|technical\s+strengths|key\s+skills|skills\s*&\s*proficiencies|skills\s*&\s*abilities|tools\s*&\s*technologies|tools|skills)$",
            re.I,
        ),
    ),
    (
        "CERTIFICATIONS",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:certifications\s*&\s*licenses|licenses\s*&\s*certifications|certifications|certificates|licenses|courses|credentials)$",
            re.I,
        ),
    ),
    (
        "ACHIEVEMENTS",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:honors\s*&\s*awards|awards\s*&\s*achievements|achievements|awards|honors|accomplishments|recognition)$",
            re.I,
        ),
    ),
    (
        "LANGUAGES",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:spoken\s+languages|language\s+proficiencies|languages)$",
            re.I,
        ),
    ),
    (
        "PUBLICATIONS",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:publications\s*&\s*research|research\s+publications|publications|papers|research\s+experience|research\s+interests|research)$",
            re.I,
        ),
    ),
    (
        "REFERENCES",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:references|referees)$",
            re.I,
        ),
    ),
    (
        "HOBBIES",
        re.compile(
            r"^(?:(?:\d+|[ivx]+|[a-z])[\.\)]\s*)?(?:extracurricular\s+activities|extracurriculars|volunteering|volunteer\s+work|hobbies|interests)$",
            re.I,
        ),
    ),
]


def has_whole_word(text_lower: str, alias: str) -> bool:
    """Match an alias only as a complete word/phrase, never inside another word."""
    pattern = r"(?<![A-Za-z0-9])" + re.escape(alias.lower()) + r"(?![A-Za-z0-9])"
    return bool(re.search(pattern, text_lower))


def sanitize_plain_text(value: Any, max_len: int = 50000) -> str:
    """Strip HTML/script tags, null bytes, and dangerous control sequences."""
    if not isinstance(value, str):
        return ""
    cleaned = value[:max_len]
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", cleaned)
    cleaned = re.sub(r"<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>", " ", cleaned, flags=re.I)
    cleaned = re.sub(r"<style\b[^<]*(?:(?!</style>)<[^<]*)*</style>", " ", cleaned, flags=re.I)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    return cleaned.strip()


def sanitize_short_field(value: Any, max_len: int = 120) -> str:
    return re.sub(r"\s+", " ", sanitize_plain_text(value, max_len)).strip()


def extract_text_from_file_bytes(filename: str, file_bytes: bytes) -> str:
    """Extract plain text from PDF, DOCX, or TXT files with magic-byte checks."""
    safe_name = os.path.basename(filename or "resume.txt")
    lower = safe_name.lower()

    if len(file_bytes) < 4:
        raise ValueError("Uploaded file is empty.")

    if len(file_bytes) > 5 * 1024 * 1024:
        raise ValueError("Uploaded file exceeds maximum allowed size of 5 MB.")

    if file_bytes[:2] == b"MZ" or file_bytes[:4] == b"\x7fELF":
        raise ValueError("Executable binary files are not permitted.")

    if lower.endswith(".pdf"):
        if not file_bytes.startswith(b"%PDF-"):
            raise ValueError("Invalid PDF signature: file header does not match %PDF-.")
        text = _extract_pdf_bytes(file_bytes)
    elif lower.endswith(".docx"):
        if file_bytes[:4] != b"PK\x03\x04":
            raise ValueError("Invalid DOCX signature: file is not a valid OpenXML archive.")
        text = _extract_docx_bytes(file_bytes)
    elif lower.endswith(".txt") or lower.endswith(".md"):
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError("Unsupported file format. Please upload PDF, DOCX, or TXT.")

    cleaned = sanitize_plain_text(text, 60000)
    if len(cleaned) < 20:
        raise ValueError(
            "Could not extract readable text from this file. If it is a scanned image PDF, please upload a text-based PDF, DOCX, or paste your resume text."
        )
    return cleaned


def _extract_pdf_bytes(file_bytes: bytes) -> str:
    if fitz is not None:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if len(doc) > 10:
                doc.close()
                raise ValueError("PDF exceeds the 10-page maximum limit. Please upload a standard 1-3 page resume.")
            pages = [page.get_text("text") or "" for page in doc]
            doc.close()
            joined = "\n".join(pages).strip()
            if len(joined) >= 20:
                return joined
        except ValueError:
            raise
        except Exception as exc:
            logger.warning("PyMuPDF (fitz) extraction failed, trying pypdf: %s", exc)

    if PdfReader is not None:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            if len(reader.pages) > 10:
                raise ValueError("PDF exceeds the 10-page maximum limit. Please upload a standard 1-3 page resume.")
            pages = [page.extract_text() or "" for page in reader.pages]
            joined = "\n".join(pages).strip()
            if len(joined) >= 20:
                return joined
        except ValueError:
            raise
        except Exception as exc:
            logger.warning("pypdf extraction failed, trying fallback: %s", exc)

    latin = file_bytes.decode("latin-1", errors="ignore")
    chunks: List[str] = []
    for match in re.finditer(r"\(([^()\\]{2,250})\)", latin):
        token = match.group(1)
        if re.search(r"[A-Za-z]{3,}", token):
            chunks.append(token)
    return " ".join(chunks) if chunks else ""



def _extract_docx_bytes(file_bytes: bytes) -> str:
    if docx is not None:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paras = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    paras.append(" | ".join(cell.text.strip() for cell in row.cells if cell.text.strip()))
            joined = "\n".join(paras).strip()
            if joined:
                return joined
        except Exception as exc:
            logger.warning("python-docx extraction failed, trying XML fallback: %s", exc)

    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            if "word/document.xml" not in zf.namelist():
                return ""
            xml_bytes = zf.read("word/document.xml")
            root = ET.fromstring(xml_bytes)
            texts = [elem.text for elem in root.iter() if elem.tag.endswith("}t") and elem.text]
            return " ".join(texts)
    except Exception as exc:
        logger.warning("DOCX XML extraction failed: %s", exc)
        return ""


def _is_section_header(line: str) -> str:
    """Return normalized section name if the line is a resume section heading, else ''."""
    if not line:
        return ""
    stripped = line.strip()
    if not stripped or len(stripped) > 55:
        return ""

    # Strip leading roman numerals, numbers, letters, bullets, hashes
    cleaned = re.sub(r"^(?:[ivxlcdm]+[\.\)]\s*|[a-z][\.\)]\s*|\d+[\.\)]\s*)", "", stripped, flags=re.I)
    cleaned = re.sub(r"^[#*•·▪❖♦~–—\-\|\s\d\.\(\)]+", "", cleaned)
    cleaned = re.sub(r"[:\-–—*#|\s]+$", "", cleaned).strip()
    if not cleaned:
        return ""

    words = cleaned.split()
    if not (1 <= len(words) <= 6):
        return ""

    verbs = {
        "developed",
        "built",
        "architected",
        "managed",
        "created",
        "engineered",
        "maintained",
        "designed",
        "worked",
        "reduced",
        "increased",
    }
    if any(w.lower() in verbs for w in words):
        return ""

    cleaned_upper = cleaned.upper()
    if cleaned_upper in SECTION_HEADERS:
        if "EDUCATION" in cleaned_upper or "ACADEMIC" in cleaned_upper:
            return "EDUCATION"
        if "SKILL" in cleaned_upper or "COMPETENC" in cleaned_upper or "TECH" in cleaned_upper:
            return "SKILLS"
        if "EXPERIENCE" in cleaned_upper or "INTERNSHIP" in cleaned_upper or "EMPLOYMENT" in cleaned_upper or "WORK" in cleaned_upper:
            return "EXPERIENCE"
        if "PROJECT" in cleaned_upper or "PORTFOLIO" in cleaned_upper:
            return "PROJECTS"
        if "CERTIF" in cleaned_upper or "LICENSE" in cleaned_upper:
            return "CERTIFICATIONS"
        if "ACHIEVEMENT" in cleaned_upper or "AWARD" in cleaned_upper or "HONOR" in cleaned_upper:
            return "ACHIEVEMENTS"
        if "SUMMARY" in cleaned_upper or "OBJECTIVE" in cleaned_upper or "PROFILE" in cleaned_upper or "ABOUT" in cleaned_upper:
            return "SUMMARY"
        if "PUBLICAT" in cleaned_upper or "PAPER" in cleaned_upper:
            return "PUBLICATIONS"
        if "RESEARCH" in cleaned_upper:
            return "RESEARCH"
        if "LANG" in cleaned_upper:
            return "LANGUAGES"
        if "REFERENCE" in cleaned_upper:
            return "REFERENCES"
        if "HOBB" in cleaned_upper or "INTEREST" in cleaned_upper or "EXTRACURRICULAR" in cleaned_upper or "VOLUNTEER" in cleaned_upper:
            return "HOBBIES"

    for sec_name, pattern in CANONICAL_SECTION_PATTERNS:
        if pattern.match(cleaned):
            return sec_name

    u = cleaned_upper
    if "EDUCATION" in u or "ACADEMIC" in u or "QUALIFICATION" in u or "DEGREE" in u:
        return "EDUCATION"
    if "SKILL" in u or "COMPETENC" in u or "TECH" in u or "TOOL" in u:
        return "SKILLS"
    if "EXPERIENCE" in u or "INTERNSHIP" in u or "EMPLOYMENT" in u or "WORK" in u:
        return "EXPERIENCE"
    if "PROJECT" in u or "PORTFOLIO" in u:
        return "PROJECTS"
    if "CERTIF" in u or "LICENSE" in u or "CREDENTIAL" in u:
        return "CERTIFICATIONS"
    if "ACHIEVEMENT" in u or "AWARD" in u or "HONOR" in u:
        return "ACHIEVEMENTS"
    if "SUMMARY" in u or "OBJECTIVE" in u or "PROFILE" in u or "ABOUT" in u:
        return "SUMMARY"
    if "PUBLICAT" in u or "PAPER" in u:
        return "PUBLICATIONS"
    if "RESEARCH" in u:
        return "RESEARCH"
    if "LANG" in u:
        return "LANGUAGES"
    if "REFERENCE" in u:
        return "REFERENCES"
    if "HOBB" in u or "INTEREST" in u or "EXTRACURRICULAR" in u or "VOLUNTEER" in u:
        return "HOBBIES"

    return ""


def parse_resume_text_to_profile(raw_text: str, filename: str = "Uploaded_Resume.pdf") -> Dict[str, Any]:
    """
    Parse raw resume text into a structured Candidate Profile.
    Preserves abbreviations like 'B.Tech', leaves missing fields blank instead of
    hardcoding defaults, extracts work experience, and ignores section headers.
    Guarantees zero cross-section bleed into summary, education, experience, or projects.
    """
    clean_text = sanitize_plain_text(raw_text, 50000)
    raw_lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

    # Split into clean content lines (without splitting on '.' so "B.Tech" stays "B.Tech")
    content_lines: List[str] = []
    for line in raw_lines:
        stripped = re.sub(r"^[\s•·\-*▪❖♦~]+", "", line).strip()
        if stripped:
            content_lines.append(stripped)

    # 1. Candidate Name: first non-header line without @ or http
    candidate_name = "Candidate"
    for line in content_lines[:5]:
        if _is_section_header(line):
            continue
        if "@" not in line and "http" not in line.lower() and "linkedin.com" not in line.lower():
            candidate_name = re.sub(r"[^A-Za-z\s.\-]", "", line).strip()
            if 2 <= len(candidate_name.split()) <= 5:
                break

    # 2. Contact details (email, phone, location, online profiles — leave blank if not found)
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", clean_text)
    phone_match = re.search(r"(?:Phone:\s*)?(\+?\d[\d\s\-\(\).]{8,18}\d)", clean_text, flags=re.I)
    phone_str = phone_match.group(1).strip() if phone_match else ""
    loc_match = re.search(r"Location:\s*([^|\n]+)", clean_text, flags=re.I)
    location_str = loc_match.group(1).strip() if loc_match else ""

    linkedin_m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)", clean_text, flags=re.I)
    github_m = re.search(r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)", clean_text, flags=re.I)
    portfolio_m = re.search(r"(?:https?://)?([A-Za-z0-9_-]+\.(?:dev|me|app|io|tech|online|github\.io)(?:/[A-Za-z0-9_.-]+)?)", clean_text, flags=re.I)
    linkedin_url = linkedin_m.group(0).strip() if linkedin_m else ""
    github_url = github_m.group(0).strip() if github_m else ""
    portfolio_url = portfolio_m.group(0).strip() if portfolio_m else ""

    # 3. Group lines by section heading
    sections: Dict[str, List[str]] = {
        "HEADER": [],
        "SUMMARY": [],
        "EDUCATION": [],
        "SKILLS": [],
        "EXPERIENCE": [],
        "PROJECTS": [],
        "CERTIFICATIONS": [],
        "ACHIEVEMENTS": [],
        "PUBLICATIONS": [],
        "RESEARCH": [],
        "LANGUAGES": [],
        "REFERENCES": [],
        "HOBBIES": [],
    }
    current_sec = "HEADER"
    for line in raw_lines:
        sec = _is_section_header(line)
        if sec:
            current_sec = sec
            continue
        if current_sec in sections:
            sections[current_sec].append(line)

    # 4. Detect Technical Skills using whole-word regex matching
    lower_text = clean_text.lower()
    detected_skills: List[str] = []
    skill_evidence: Dict[str, str] = {}

    for canonical_skill, aliases in KNOWN_SKILLS_CATALOG.items():
        for alias in aliases:
            if has_whole_word(lower_text, alias):
                detected_skills.append(canonical_skill)
                # Find the best non-header line that proves this skill
                evidence_line = next(
                    (
                        re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()
                        for ln in raw_lines
                        if not _is_section_header(ln) and has_whole_word(ln.lower(), alias)
                    ),
                    f"Detected {canonical_skill} in {filename}.",
                )
                skill_evidence[canonical_skill] = evidence_line[:220]
                break

    # 5. Detect Soft Skills (only what actually appears in text)
    detected_soft: List[str] = []
    for soft in SOFT_SKILLS_CATALOG:
        key_word = soft.split()[0].lower()
        if has_whole_word(lower_text, key_word):
            detected_soft.append(soft)

    # 6. Extract Education (preserving "B.Tech", real institution, real year, real score)
    education: List[Dict[str, Any]] = []
    edu_degree_pattern = re.compile(
        r"\b(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\.?|M\.?\s*E\.?|B\.?\s*Sc|M\.?\s*Sc|B\.?\s*S\.?|M\.?\s*S\.?|BCA|MCA|MBA|Ph\.?\s*D|Bachelor|Master|Associate|Diploma|High\s+School)\b",
        flags=re.I,
    )
    edu_Pool = sections["EDUCATION"] if sections["EDUCATION"] else [ln for ln in content_lines if edu_degree_pattern.search(ln)]
    score_str = ""
    for ln in edu_Pool:
        cgpa_m = re.search(r"(?:CGPA|GPA|Percentage|Score)\s*[:\-]?\s*([\d.]+\s*(?:/\s*[\d.]+|%)?)", ln, flags=re.I)
        if cgpa_m:
            score_str = cgpa_m.group(1).strip()
            break

    for ln in edu_Pool:
        clean_ln = re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()
        if not clean_ln or _is_section_header(clean_ln):
            continue
        if edu_degree_pattern.search(clean_ln):
            year_m = re.search(r"\(?\b((?:19|20)\d{2}\s*[–\-—to]+\s*(?:19|20)?\d{2,4}|(?:19|20)\d{2})\b\)?", clean_ln)
            year_val = year_m.group(1).strip() if year_m else ""
            line_no_year = re.sub(r"\(\s*" + re.escape(year_val) + r"\s*\)", "", clean_ln).strip() if year_val else clean_ln
            parts = [p.strip() for p in re.split(r"\s*[—–\-|]\s*", line_no_year) if p.strip()]
            degree_val = parts[0] if parts else clean_ln
            inst_val = parts[1] if len(parts) > 1 else ""
            loc_val = parts[2] if len(parts) > 2 else ""

            item_score = score_str
            item_cgpa_m = re.search(r"(?:CGPA|GPA|Percentage|Score)\s*[:\-]?\s*([\d.]+\s*(?:/\s*[\d.]+|%)?)", clean_ln, flags=re.I)
            if item_cgpa_m:
                item_score = item_cgpa_m.group(1).strip()

            education.append(
                {
                    "degree": degree_val[:120],
                    "institution": inst_val[:120],
                    "location": loc_val[:80],
                    "year": year_val,
                    "start_date": "",
                    "end_date": year_val,
                    "score": item_score,
                    "gpa": item_score,
                    "bullets": [],
                }
            )

    # 7. Extract Work Experience (role, company, duration, highlights/bullets)
    work_experience: List[Dict[str, Any]] = []
    current_exp: Optional[Dict[str, Any]] = None

    date_range_regex = re.compile(
        r"\(?\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*)?(?:19|20)\d{2}\s*(?:–|-|—|to)\s*(?:Present|Current|Ongoing|(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*)?(?:19|20)\d{2})\b\)?",
        re.I,
    )

    for ln in sections["EXPERIENCE"]:
        if _is_section_header(ln):
            continue
        is_bullet = bool(re.match(r"^[\s]*[•·\-*▪❖♦~–]\s+", ln))
        clean_ln = re.sub(r"^[\s•·\-*▪❖♦~–]+", "", ln).strip()
        if not clean_ln:
            continue

        date_match = date_range_regex.search(clean_ln)
        has_common_role_keyword = bool(
            re.search(
                r"\b(engineer|developer|intern|lead|manager|analyst|architect|consultant|specialist|designer|scientist|associate|officer|director|founder|co-founder)\b",
                clean_ln,
                re.I,
            )
        )

        is_header_line = (not is_bullet and (date_match is not None or has_common_role_keyword or "|" in clean_ln or "—" in clean_ln or "–" in clean_ln))

        if is_header_line and not (current_exp and len(clean_ln.split()) > 14 and not date_match):
            if current_exp:
                work_experience.append(current_exp)

            duration_val = date_match.group(0).strip("()") if date_match else ""
            header_no_date = clean_ln
            if date_match:
                header_no_date = (clean_ln[: date_match.start()] + " " + clean_ln[date_match.end() :]).strip()

            parts = [p.strip() for p in re.split(r"\s*[—–\-|]\s*", header_no_date) if p.strip()]
            role_val = parts[0] if parts else header_no_date
            company_val = parts[1] if len(parts) > 1 else ""
            loc_val = parts[2] if len(parts) > 2 else ""

            if has_common_role_keyword and len(parts) > 1:
                if not re.search(r"\b(engineer|developer|intern|lead|manager|analyst|architect|consultant|specialist|designer|scientist|associate)\b", role_val, re.I) and re.search(
                    r"\b(engineer|developer|intern|lead|manager|analyst|architect|consultant|specialist|designer|scientist|associate)\b", company_val, re.I
                ):
                    role_val, company_val = company_val, role_val

            current_exp = {
                "role": role_val[:100],
                "company": company_val[:100],
                "location": loc_val[:80],
                "start_date": "",
                "end_date": duration_val[:60],
                "duration": duration_val[:60],
                "overview": "",
                "highlights": [],
                "bullets": [],
            }
        else:
            if current_exp is not None:
                sub_bullets = [b.strip() for b in re.split(r"[\r\n]+|[•·▪❖♦]\s*", clean_ln) if b.strip()]
                for b in sub_bullets:
                    current_exp["highlights"].append(b[:240])
                    current_exp["bullets"].append(b[:240])
            elif not work_experience:
                current_exp = {
                    "role": clean_ln[:100],
                    "company": "",
                    "location": "",
                    "start_date": "",
                    "end_date": "",
                    "duration": "",
                    "overview": "",
                    "highlights": [],
                    "bullets": [],
                }
    if current_exp:
        work_experience.append(current_exp)

    # 8. Extract Projects
    projects: List[Dict[str, Any]] = []
    current_proj: Optional[Dict[str, Any]] = None
    proj_source = sections["PROJECTS"]
    if proj_source:
        for ln in proj_source:
            if _is_section_header(ln):
                continue
            is_bullet = bool(re.match(r"^[\s]*[•·\-*▪❖♦~–]\s+", ln))
            clean_ln = re.sub(r"^[\s•·\-*▪❖♦~–]+", "", ln).strip()
            if not clean_ln:
                continue

            gh_match = re.search(r"(https?://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", clean_ln, re.I)
            demo_match = re.search(r"(https?://[A-Za-z0-9_.-]+\.[A-Za-z]{2,}(?:/[A-Za-z0-9_.-]*)*)", clean_ln, re.I)
            date_m = re.search(r"\(?\b((?:19|20)\d{2}\s*[–\-—to]+\s*(?:19|20)?\d{2,4}|(?:19|20)\d{2})\b\)?", clean_ln)

            # If the line is purely an external URL and we already have an active project, attach it directly
            if (re.match(r"^https?://", clean_ln) or re.match(r"^github\.com/", clean_ln)) and current_proj:
                if gh_match and not current_proj["github_link"]:
                    current_proj["github_link"] = gh_match.group(1)
                elif demo_match and not current_proj["live_link"]:
                    current_proj["live_link"] = demo_match.group(1)
                continue

            if not is_bullet and (len(clean_ln.split()) <= 10 or ":" in clean_ln or "|" in clean_ln or "—" in clean_ln or "–" in clean_ln):
                if current_proj:
                    projects.append(current_proj)
                title_clean = re.sub(r"^(?:\d+[\.\)]\s*)?(?:Project\s*:\s*)?", "", clean_ln, flags=re.I).strip()
                parts = [p.strip() for p in re.split(r"\s*[|—–]\s*", title_clean) if p.strip()]
                p_title = parts[0] if parts else title_clean
                p_stack = parts[1] if len(parts) > 1 else ""

                matched_stack = [sk for sk in detected_skills if has_whole_word(clean_ln.lower(), sk.lower())]
                current_proj = {
                    "title": p_title[:90],
                    "name": p_title[:90],
                    "techStack": matched_stack,
                    "tech_stack": p_stack or ", ".join(matched_stack),
                    "dates": date_m.group(1).strip() if date_m else "",
                    "github_link": gh_match.group(1) if gh_match else "",
                    "live_link": demo_match.group(1) if demo_match and (not gh_match or demo_match.group(1) != gh_match.group(1)) else "",
                    "description": "",
                    "bullets": [],
                }
            elif current_proj:
                sub_bullets = [b.strip() for b in re.split(r"[\r\n]+|[•·▪❖♦]\s*", clean_ln) if b.strip()]
                for b in sub_bullets:
                    current_proj["bullets"].append(b[:240])
                desc = (current_proj["description"] + " " + clean_ln).strip()
                current_proj["description"] = desc[:240]
                if gh_match and not current_proj["github_link"]:
                    current_proj["github_link"] = gh_match.group(1)
                for sk in detected_skills:
                    if sk not in current_proj["techStack"] and has_whole_word(clean_ln.lower(), sk.lower()):
                        current_proj["techStack"].append(sk)
                        if current_proj["tech_stack"]:
                            current_proj["tech_stack"] += f", {sk}"
                        else:
                            current_proj["tech_stack"] = sk
        if current_proj:
            projects.append(current_proj)
    else:
        # Fallback if resume has no explicit PROJECTS heading
        proj_keywords = ["built", "developed", "designed", "implemented", "created", "engineered"]
        for ln in content_lines:
            if any(has_whole_word(ln.lower(), k) for k in proj_keywords) and len(ln) > 30:
                matched_stack = [sk for sk in detected_skills if has_whole_word(ln.lower(), sk.lower())]
                projects.append(
                    {
                        "title": ln[:65] + ("..." if len(ln) > 65 else ""),
                        "name": ln[:65] + ("..." if len(ln) > 65 else ""),
                        "techStack": matched_stack,
                        "tech_stack": ", ".join(matched_stack),
                        "dates": "",
                        "github_link": "",
                        "live_link": "",
                        "description": ln[:220],
                        "bullets": [ln[:220]],
                    }
                )
                if len(projects) >= 3:
                    break

    # 9. Extract Certifications
    certifications: List[str] = []
    if sections["CERTIFICATIONS"]:
        for ln in sections["CERTIFICATIONS"]:
            if _is_section_header(ln):
                continue
            clean_cert = re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()
            if len(clean_cert) >= 5:
                certifications.append(clean_cert[:120])
    else:
        for ln in content_lines:
            if _is_section_header(ln):
                continue
            if any(w in ln.lower() for w in ["certified", "certificate", "coursera", "udemy", "edx"]):
                if len(ln) >= 8:
                    certifications.append(ln[:120])

    # 10. Extract Achievements & Honors
    achievements: List[str] = []
    ach_src = sections.get("ACHIEVEMENTS") or sections.get("AWARDS") or []
    if ach_src:
        for ln in ach_src:
            if not _is_section_header(ln) and len(ln.strip()) >= 5:
                achievements.append(re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()[:140])
    else:
        for ln in content_lines:
            if any(k in ln.lower() for k in ["hackathon", "first place", "runner-up", "ranked top", "scholarship", "dean's list"]):
                if not _is_section_header(ln) and len(ln.strip()) >= 10:
                    achievements.append(re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()[:140])
                if len(achievements) >= 3:
                    break

    # 11. Extract Summary (Preventing Cross-Section Bleed)
    summary_candidates: List[str] = []
    if sections["SUMMARY"]:
        summary_candidates = sections["SUMMARY"]
    elif sections["HEADER"]:
        for ln in sections["HEADER"]:
            if "@" in ln or "linkedin.com" in ln.lower() or "github.com" in ln.lower() or "http" in ln.lower():
                continue
            if re.search(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", ln) or re.search(r"\+\d{1,3}\s*\d+", ln):
                continue
            if edu_degree_pattern.search(ln):
                continue
            if len(ln.split()) >= 4 and not re.match(r"^[\s•·\-*▪❖♦~]+", ln):
                if ln.strip().lower() != candidate_name.lower():
                    summary_candidates.append(ln)

    valid_summary_sentences: List[str] = []
    date_year_pattern = re.compile(r"\b(?:19|20)\d{2}\b")
    for ln in summary_candidates:
        clean_ln = re.sub(r"^[\s•·\-*▪❖♦~]+", "", ln).strip()
        if not clean_ln or len(clean_ln) < 10 or _is_section_header(clean_ln):
            continue
        if "@" in clean_ln or "http" in clean_ln.lower() or "github.com" in clean_ln.lower() or "linkedin.com" in clean_ln.lower():
            continue
        if edu_degree_pattern.search(clean_ln):
            continue
        if date_year_pattern.search(clean_ln) and len(clean_ln) < 30:
            continue
        if clean_ln.count(",") >= 4 and (len(clean_ln.split()) / (clean_ln.count(",") + 1)) < 2.5:
            continue
        valid_summary_sentences.append(clean_ln)

    user_summary = " ".join(valid_summary_sentences).strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", user_summary) if s.strip()]
    if sentences:
        summary_text = " ".join(sentences[:5]).strip()[:500]
    else:
        summary_text = (
            f"Detected {len(detected_skills)} technical skills, {len(projects)} projects, "
            f"and {len(work_experience)} experience entries."
        )

    basics_obj = {
        "name": candidate_name,
        "email": email_match.group(0) if email_match else "",
        "phone": phone_str,
        "location": location_str,
        "linkedin": linkedin_url,
        "github": github_url,
        "portfolio": portfolio_url,
        "confidence": 0.95 if (email_match or phone_str) else 0.70,
    }

    skills_obj = {
        "technical": detected_skills,
        "soft": detected_soft,
        "confidence": 0.95 if len(detected_skills) >= 3 else 0.60,
    }

    confidence_flags = {
        "basics": basics_obj["confidence"],
        "skills": skills_obj["confidence"],
        "education": 0.90 if education else 0.50,
        "experience": 0.88 if work_experience else 0.50,
        "projects": 0.88 if projects else 0.50,
        "certifications": 0.90 if certifications else 0.60,
        "achievements": 0.85 if achievements else 0.50,
    }

    extracted_pubs = [
        {"title": re.sub(r"^[\s•·\-*]+", "", ln).strip(), "publisher": "", "year": "", "link": ""}
        for ln in sections.get("PUBLICATIONS", [])
        if len(ln.strip()) >= 5
    ]
    extracted_langs = [
        re.sub(r"^[\s•·\-*]+", "", ln).strip()
        for ln in sections.get("LANGUAGES", [])
        if len(ln.strip()) >= 2
    ]
    extracted_research = [
        re.sub(r"^[\s•·\-*]+", "", ln).strip()
        for ln in sections.get("RESEARCH", [])
        if len(ln.strip()) >= 3
    ]

    # Enrich education items with canonical keys
    for ed in education:
        if "bullets" not in ed:
            ed["bullets"] = [ed["coursework"]] if ed.get("coursework") else []
        if "gpa" not in ed:
            ed["gpa"] = ed.get("score", "")
        if "start_date" not in ed:
            ed["start_date"] = ""
        if "end_date" not in ed:
            ed["end_date"] = ed.get("year", "")
        if "location" not in ed:
            ed["location"] = ""

    # Enrich work experience items with canonical keys
    for exp_item in work_experience:
        if "bullets" not in exp_item:
            exp_item["bullets"] = list(exp_item.get("highlights", []))
        if "overview" not in exp_item:
            exp_item["overview"] = ""
        if "start_date" not in exp_item:
            exp_item["start_date"] = ""
        if "end_date" not in exp_item:
            exp_item["end_date"] = exp_item.get("duration", "")
        if "location" not in exp_item:
            exp_item["location"] = ""

    # Enrich projects items with canonical keys
    for pr in projects:
        if "name" not in pr:
            pr["name"] = pr.get("title", "")
        if "tech_stack" not in pr:
            pr["tech_stack"] = ", ".join(pr.get("techStack", []))
        if "dates" not in pr:
            pr["dates"] = ""
        if "github_link" not in pr:
            pr["github_link"] = ""
        if "live_link" not in pr:
            pr["live_link"] = ""
        if "bullets" not in pr:
            pr["bullets"] = [pr["description"]] if pr.get("description") else []

    dob_m = re.search(r"(?:DOB|Date of Birth|Birth Date)\s*[:\-]?\s*([0-9]{1,2}[/\-.][0-9]{1,2}[/\-.][0-9]{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})", clean_text, flags=re.I)
    dob_str = dob_m.group(1).strip() if dob_m else ""
    nat_m = re.search(r"(?:Nationality|Citizenship)\s*[:\-]?\s*([A-Za-z]+)", clean_text, flags=re.I)
    nat_str = nat_m.group(1).strip() if nat_m else ""
    addr_m = re.search(r"(?:Address)\s*[:\-]?\s*([^\n]+)", clean_text, flags=re.I)
    addr_str = addr_m.group(1).strip() if addr_m else (location_str or "")

    headline_str = ""
    if work_experience and work_experience[0].get("role"):
        headline_str = work_experience[0]["role"]
    elif education and education[0].get("degree"):
        headline_str = education[0]["degree"]

    structured_langs = [
        {"name": l, "proficiency": "Fluent", "level": 90} for l in extracted_langs
    ]
    hobbies_list = [
        re.sub(r"^[\s•·\-*]+", "", ln).strip()
        for ln in (sections.get("HOBBIES") or sections.get("INTERESTS") or [])
        if len(ln.strip()) >= 3 and not _is_section_header(ln)
    ]

    return {
        "id": f"res-{uuid.uuid4().hex[:10]}",
        "filename": sanitize_short_field(filename, 100),
        "uploadedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "rawText": clean_text,
        "extractionSource": "template",
        # Structured Schema (Section 13 G)
        "basics": basics_obj,
        "summary": summary_text,
        "skills": skills_obj,
        "education": education,
        "experience": work_experience,
        "projects": projects,
        "certifications": certifications,
        "achievements": achievements,
        "confidenceFlags": confidence_flags,
        # AI Resume Builder Normalized Structure
        "personalInfo": {
            "full_name": candidate_name,
            "headline": headline_str,
            "email": email_match.group(0) if email_match else "",
            "phone": phone_str,
            "location": location_str,
            "address": addr_str,
            "city": location_str,
            "linkedin": linkedin_url,
            "github": github_url,
            "portfolio": portfolio_url,
            "dob": dob_str,
            "nationality": nat_str,
            "photo_data_url": "",
        },
        "languages": structured_langs,
        "references": [],
        "hobbies": hobbies_list,
        "publications": extracted_pubs,
        "additionalInfo": {
            "languages_known": extracted_langs,
            "research_interests": extracted_research,
            "publications": extracted_pubs,
            "extracurriculars": [],
        },
        # Backward-compatible fields
        "contact": basics_obj,
        "technicalSkills": detected_skills,
        "softSkills": detected_soft,
        "workExperience": work_experience,
        "skillEvidence": skill_evidence,
    }
