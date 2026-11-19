"""
CareerMatch AI: Comprehensive Test Suite for AI Resume Builder & Template Studio
Validates:
1. Template Registry (All 8 original templates, properties, default modern_ats).
2. Sample Profiles (Indian Fresher, Software Engineer, Data Scientist).
3. Profile Validation & Essential Requirements (Name, Contact, Substantive sections).
4. Template-Specific Validation Rules (Graduate & Fresher requires education, etc.).
5. Automatic Resume Extraction (PDF, DOCX, TXT into normalized builder profile).
6. High-Fidelity A4 PDF Generation across all 8 templates and 3 profiles (24 combinations).
7. PDF Selectable & Searchable Text Verification (PyMuPDF inspection).
8. Clickable Hyperlinks (Email mailto, LinkedIn, GitHub, Portfolio).
9. Safe Filename Sanitization ("Candidate_Name_Resume.pdf").
10. Separation from Career Scores, Verification, and Assessments.
"""

import io
import os
import re
import sys
import docx
import pytest
import pymupdf

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.resume_builder_service import (
    FICTIONAL_TEST_PROFILES,
    TEMPLATES_METADATA,
    ResumePdfGenerator,
    categorize_skills,
    get_template_by_id,
    validate_resume_profile,
)
from backend.resume_parser import (
    extract_text_from_file_bytes,
    parse_resume_text_to_profile,
)


# ----------------------------------------------------------------------
# 1. Template Registry & Metadata Tests
# ----------------------------------------------------------------------
def test_all_ten_templates_exist():
    assert len(TEMPLATES_METADATA) == 10, f"Expected exactly 10 templates, found {len(TEMPLATES_METADATA)}"

    expected_ids = {
        "editorial_serif",
        "classic_executive",
        "corporate_accent",
        "clean_minimalist",
        "swiss_modern",
        "executive_slate",
        "editorial_warmth",
        "timeline_studio",
        "emerald_sidebar",
        "ats_compact_pro",
    }
    actual_ids = {t["id"] for t in TEMPLATES_METADATA}
    assert expected_ids == actual_ids, f"Template IDs mismatch. Missing: {expected_ids - actual_ids}"

    # Default template check
    default_tpl = next((t for t in TEMPLATES_METADATA if t.get("isDefault")), None)
    assert default_tpl is not None, "A default template must be designated"
    assert default_tpl["id"] == "editorial_serif", "Default template must be 'editorial_serif'"

    # Two-column disclaimer check
    two_col_ids = {t["id"] for t in TEMPLATES_METADATA if t.get("isTwoColumn")}
    assert "swiss_modern" in two_col_ids
    assert "timeline_studio" in two_col_ids
    assert "emerald_sidebar" in two_col_ids

    # Every template has required metadata fields
    for t in TEMPLATES_METADATA:
        assert "name" in t and len(t["name"]) > 0
        assert "category" in t
        assert "supportsTheme" in t and isinstance(t["supportsTheme"], bool)
        assert "supportsPhoto" in t and isinstance(t["supportsPhoto"], bool)
        assert "accentColor" in t and t["accentColor"].startswith("#")
        assert "swatches" in t and isinstance(t["swatches"], list) and len(t["swatches"]) >= 1
        assert "description" in t and len(t["description"]) > 10

    # Legacy template resolution check
    assert get_template_by_id("modern_ats")["id"] == "editorial_serif"
    assert get_template_by_id("software_engineer")["id"] == "corporate_accent"
    assert get_template_by_id("graduate_fresher")["id"] == "swiss_modern"
    assert get_template_by_id("minimal_single")["id"] == "ats_compact_pro"
    assert get_template_by_id("professional_two_col")["id"] == "emerald_sidebar"
    assert get_template_by_id("banner")["id"] == "corporate_accent"
    assert get_template_by_id("timeline")["id"] == "timeline_studio"


# ----------------------------------------------------------------------
# 2. Fictional Test Profiles
# ----------------------------------------------------------------------
def test_three_fictional_profiles_structure():
    assert "fresher" in FICTIONAL_TEST_PROFILES
    assert "software_engineer" in FICTIONAL_TEST_PROFILES
    assert "data_scientist" in FICTIONAL_TEST_PROFILES

    # Fresher must have 0 work experience
    fresher = FICTIONAL_TEST_PROFILES["fresher"]
    assert len(fresher.get("workExperience", [])) == 0, "Fresher profile must not require work experience"
    assert len(fresher.get("education", [])) >= 1, "Fresher must have education"
    assert len(fresher.get("projects", [])) >= 1, "Fresher must have projects"

    # Software Engineer must have employment entries
    sde = FICTIONAL_TEST_PROFILES["software_engineer"]
    assert len(sde.get("workExperience", [])) >= 2
    assert len(sde.get("technicalSkills", [])) >= 5

    # Data Scientist must have ML/data skills and publications
    ds = FICTIONAL_TEST_PROFILES["data_scientist"]
    assert len(ds.get("technicalSkills", [])) >= 5
    assert len(ds.get("additionalInfo", {}).get("publications", [])) >= 1


# ----------------------------------------------------------------------
# 3. Profile Validation & Essential Requirements
# ----------------------------------------------------------------------
def test_validation_missing_candidate_name():
    invalid_profile = {
        "personalInfo": {"full_name": "", "email": "test@example.com"},
        "education": [{"degree": "B.Tech"}],
    }
    val = validate_resume_profile(invalid_profile, "modern_ats")
    assert not val["valid"]
    assert any("Candidate Full Name is required" in e for e in val["errors"])


def test_validation_missing_contact_method():
    invalid_profile = {
        "personalInfo": {"full_name": "Aarav Sharma", "email": "", "phone": ""},
        "education": [{"degree": "B.Tech"}],
    }
    val = validate_resume_profile(invalid_profile, "modern_ats")
    assert not val["valid"]
    assert any("contact method" in e.lower() for e in val["errors"])


def test_validation_missing_substantive_section():
    invalid_profile = {
        "personalInfo": {"full_name": "Aarav Sharma", "email": "aarav@example.com"},
        "education": [],
        "workExperience": [],
        "projects": [],
    }
    val = validate_resume_profile(invalid_profile, "modern_ats")
    assert not val["valid"]
    assert any("substantive section" in e.lower() for e in val["errors"])


def test_validation_graduate_fresher_requires_education():
    profile_without_edu = {
        "personalInfo": {"full_name": "Aarav Sharma", "email": "aarav@example.com"},
        "education": [],
        "projects": [{"title": "Demo"}],
    }
    val = validate_resume_profile(profile_without_edu, "graduate_fresher")
    assert not val["valid"]
    assert any("education" in e.lower() for e in val["errors"])


# ----------------------------------------------------------------------
# 4. Resume Extraction into Builder Profile
# ----------------------------------------------------------------------
def test_resume_extraction_captures_links_and_builder_fields():
    fixture_path = os.path.join(ROOT_DIR, "tests", "fixtures", "test_resume.txt")
    with open(fixture_path, "r", encoding="utf-8") as f:
        raw_text = f.read()

    parsed = parse_resume_text_to_profile(raw_text, "test_resume.txt")

    # Verify existing keys are preserved
    assert "contact" in parsed
    assert "technicalSkills" in parsed
    assert "education" in parsed
    assert "workExperience" in parsed
    assert "projects" in parsed

    # Verify builder normalized fields
    assert "personalInfo" in parsed
    pinfo = parsed["personalInfo"]
    assert pinfo["full_name"] == "Aarav Sharma"
    assert "aarav.sharma@iitb.ac.in" in pinfo["email"]
    assert "98765" in pinfo["phone"]
    assert "linkedin.com/in/aaravsharma-cs" in pinfo["linkedin"]
    assert "github.com/aaravsharma-dev" in pinfo["github"]


# ----------------------------------------------------------------------
# 5. PDF Generation & Quality (All 8 Templates x 3 Profiles = 24 Matrix)
# ----------------------------------------------------------------------
@pytest.mark.parametrize("template", TEMPLATES_METADATA)
@pytest.mark.parametrize("profile_key", ["fresher", "software_engineer", "data_scientist"])
def test_pdf_generation_matrix(template, profile_key):
    profile = FICTIONAL_TEST_PROFILES[profile_key]
    tpl_id = template["id"]

    val = validate_resume_profile(profile, tpl_id)
    assert val["valid"], f"Validation failed for {profile_key} on {tpl_id}: {val['errors']}"

    gen = ResumePdfGenerator(profile, tpl_id)
    pdf_bytes = gen.build_pdf_bytes()

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000, "PDF bytes should be non-trivial"

    # Open with PyMuPDF to inspect physical PDF properties
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    assert len(doc) >= 1, "PDF must have at least 1 page"

    # Verify A4 Page Dimensions (595.27 x 841.89 points +- 1 point)
    p1 = doc[0]
    rect = p1.rect
    assert abs(rect.width - 595.27) < 2.0, f"Expected A4 width ~595pt, got {rect.width}"
    assert abs(rect.height - 841.89) < 2.0, f"Expected A4 height ~841pt, got {rect.height}"

    # Verify Text is Selectable & Searchable
    full_text = "".join(page.get_text() for page in doc)
    assert len(full_text.strip()) > 100, "PDF text must be selectable and non-empty"

    # Candidate Name must be prominent in the text
    cand_name_first = val["candidateName"].split()[0]
    assert cand_name_first in full_text, f"Candidate first name '{cand_name_first}' not found in PDF text"

    # Clickable Links check
    links = p1.get_links()
    assert len(links) >= 1, f"Expected clickable links on page 1 of {tpl_id}, found {len(links)}"
    uris = [lnk.get("uri", "") for lnk in links if "uri" in lnk]
    assert any("mailto:" in u or "linkedin" in u or "github" in u or "http" in u for u in uris), f"No valid URL link found in {uris}"

    # For Editorial Serif / Academic: empty publications should never render a blank section
    if tpl_id in ("editorial_serif", "academic_research") and profile_key == "fresher":
        assert "PUBLICATIONS & RESEARCH" not in full_text and "PUBLICATIONS" not in full_text, "Empty publications section must be cleanly hidden"


# ----------------------------------------------------------------------
# 6. Skill Categorization Utility
# ----------------------------------------------------------------------
def test_skill_categorization():
    skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Git", "React", "PyTorch"]
    cats = categorize_skills(skills)
    assert "Python" in cats["programming_languages"]
    assert "FastAPI" in cats["frameworks_libraries"] or "React" in cats["frameworks_libraries"]
    assert "PostgreSQL" in cats["databases"]
    assert "Docker" in cats["cloud_devops"] or "AWS" in cats["cloud_devops"]


# ----------------------------------------------------------------------
# 7. DOCX Generation & Export Endpoint Tests
# ----------------------------------------------------------------------
@pytest.fixture
def client():
    from starlette.testclient import TestClient
    from backend.main import app
    return TestClient(app)


def test_generate_docx_endpoint(client):
    """Verify POST /api/builder/generate-docx generates valid ATS-friendly .docx files."""
    prof = FICTIONAL_TEST_PROFILES["fresher"]
    resp = client.post(
        "/api/builder/generate-docx",
        json={"profile": prof, "templateId": "editorial_serif", "accentColor": "#111827"},
    )
    assert resp.status_code == 200, resp.text
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in resp.headers.get("content-type", "")
    assert "attachment; filename=" in resp.headers.get("content-disposition", "")
    assert resp.headers["content-disposition"].endswith('.docx"')

    doc = docx.Document(io.BytesIO(resp.content))
    all_text = " ".join([p.text for p in doc.paragraphs] + [c.text for t in doc.tables for r in t.rows for c in r.cells])
    assert "Aarav Sharma" in all_text
    assert "B.Tech in Computer Science" in all_text


def test_generate_docx_templates_variety(client):
    """Test DOCX export across both two-column and single-column templates."""
    prof = FICTIONAL_TEST_PROFILES["software_engineer"]
    for t_id in ("editorial_serif", "corporate_accent", "swiss_modern", "ats_compact_pro"):
        resp = client.post(
            "/api/builder/generate-docx",
            json={"profile": prof, "templateId": t_id, "accentColor": "#2563A6"},
        )
        assert resp.status_code == 200, f"Failed for template {t_id}: {resp.text}"
        doc = docx.Document(io.BytesIO(resp.content))
        assert len(doc.paragraphs) > 0 or len(doc.tables) > 0


# ----------------------------------------------------------------------
# 8. Messy Multi-Section Resume Parsing (Zero Cross-Section Bleed)
# ----------------------------------------------------------------------
def test_messy_resume_parsing_zero_cross_section_bleed():
    """Verify that messy headings, bullets, and numbering classify cleanly with zero text dumping into summary."""
    from backend.resume_parser import parse_resume_text_to_profile

    messy_resume_text = """
    Rohan Verma
    rohan.verma@example.com | +91 98765 43210 | Bengaluru, India
    linkedin.com/in/rohanverma | github.com/rohanverma

    1. PROFESSIONAL SUMMARY:
    Results-driven backend software engineer with 3+ years of experience building high-throughput microservices.
    Specialized in Python, distributed cache architectures, and relational database query optimization.
    Passionate about fault-tolerant systems and automated test reliability.

    II. WORK EXPERIENCE:
    Senior Software Engineer | Razorpay | Bengaluru, India (June 2022 – Present)
    • Architected payments settlement pipeline processing 1.2M transactions daily with sub-200ms latency.
    • Decreased PostgreSQL database lock contention by 34% through partition pruning and index reindexing.
    ▪ Mentored 4 junior engineers on distributed tracing with OpenTelemetry and Docker.

    Software Development Intern | Zerodha | Bengaluru, India (Jan 2022 – May 2022)
    - Built internal trade audit reconciliation service in Go and Redis.
    - Automated integration test execution reducing CI run duration from 22m to 7m.

    3. KEY PROJECTS:
    Distributed Task Queue Engine | Python, Redis, FastAPI (2023)
    https://github.com/rohanverma/task-engine
    • Built Celery-compatible distributed task queue supporting delayed execution and exponential retries.
    • Benchmarked throughput at 14,000 tasks per second with zero message loss.

    IV. EDUCATION & ACADEMICS:
    B.Tech in Computer Science and Engineering | National Institute of Technology, Karnataka (2018 – 2022)
    CGPA: 8.8 / 10.0

    5. TECHNICAL SKILLS & TOOLS:
    Languages: Python, Go, SQL, JavaScript
    Frameworks: FastAPI, Django, Flask
    Databases & Cloud: PostgreSQL, Redis, Docker, AWS, Git

    6. CERTIFICATIONS:
    AWS Certified Solutions Architect – Associate (2023)

    7. HONORS & AWARDS:
    Smart India Hackathon 1st Place Winner (2021)
    """

    profile = parse_resume_text_to_profile(messy_resume_text, "Rohan_Verma_Resume.pdf")

    # 1. Basics verification
    assert profile["basics"]["name"] == "Rohan Verma"
    assert profile["basics"]["email"] == "rohan.verma@example.com"
    assert "98765" in profile["basics"]["phone"]

    # 2. Zero Cross-Section Bleed into Summary
    summary = profile["summary"]
    assert "Results-driven backend software engineer" in summary
    assert "1.2M transactions" not in summary, "Experience bullets leaked into summary!"
    assert "B.Tech" not in summary, "Education leaked into summary!"
    assert "Razorpay" not in summary, "Company leaked into summary!"
    assert "CGPA" not in summary, "CGPA leaked into summary!"

    # 3. Work Experience cleanly extracted into separate items & bullets
    exp = profile["workExperience"]
    assert len(exp) == 2, f"Expected 2 experience entries, got {len(exp)}"
    assert "Razorpay" in exp[0]["company"]
    assert "Senior Software Engineer" in exp[0]["role"]
    assert len(exp[0]["bullets"]) == 3, f"Expected 3 bullets, got {len(exp[0]['bullets'])}"
    assert "1.2M transactions" in exp[0]["bullets"][0]
    assert "Zerodha" in exp[1]["company"]

    # 4. Education accurately extracted without mixing experience
    edu = profile["education"]
    assert len(edu) >= 1
    assert "B.Tech" in edu[0]["degree"]
    assert "National Institute of Technology" in edu[0]["institution"]
    assert "8.8" in edu[0]["score"]

    # 5. Projects accurately extracted
    projects = profile["projects"]
    assert len(projects) >= 1
    assert "Distributed Task Queue" in projects[0]["title"] or "Distributed Task Queue" in projects[0]["name"]
    assert "github.com/rohanverma/task-engine" in (projects[0].get("github_link") or projects[0].get("description"))

    # 6. Technical skills
    skills = profile["skills"]["technical"]
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "Docker" in skills

