"""
CareerMatch AI — AI Resume Builder & Template Studio Service
Provides normalized profile parsing, validation, template configurations,
and high-fidelity ReportLab PDF generation for 8 original templates:
1. Modern ATS Professional (Default Recommended)
2. Software Engineer
3. Data Science & Machine Learning
4. Graduate & Fresher
5. Minimal Single Column
6. Professional Two Column
7. Executive Professional
8. Academic & Research
"""

import html
import io
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    import docx
    from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Inches, Pt, RGBColor
except ImportError:
    docx = None

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ----------------------------------------------------------------------
# Template Definitions & Metadata (10 Bespoke Industry-Grade Templates)
# ----------------------------------------------------------------------
TEMPLATES_METADATA = [
    {
        "id": "editorial_serif",
        "name": "Editorial Serif",
        "subtitle": "Classic Academic & Engineering Rail",
        "category": "Classic & ATS",
        "audience": "Academic, engineering, and corporate applications requiring crisp traditional typography.",
        "description": "Classic academic and engineering serif layout with left rail for dates and section labels.",
        "atsSuitability": "Highest (99% ATS Friendly)",
        "atsBadge": "ATS Classic",
        "isDefault": True,
        "isTwoColumn": False,
        "supportsTheme": False,
        "supportsPhoto": False,
        "accentColor": "#111827",
        "swatches": ["#111827"],
    },
    {
        "id": "classic_executive",
        "name": "Classic Executive",
        "subtitle": "Formal Shaded Banners & Dotted Leaders",
        "category": "Executive & Traditional",
        "audience": "Senior leaders, directors, consultants, and traditional corporate executives.",
        "description": "Traditional formal serif layout with centered shaded section banners, decorative florets, and dotted leaders.",
        "atsSuitability": "High (95% ATS Friendly)",
        "atsBadge": "Executive Formal",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": False,
        "supportsPhoto": False,
        "accentColor": "#1F2937",
        "swatches": ["#1F2937"],
    },
    {
        "id": "corporate_accent",
        "name": "Corporate Accent",
        "subtitle": "Double-Ruled Headers & 4-Column Skills",
        "category": "Modern & Corporate",
        "audience": "Software engineers, tech leads, corporate professionals, and enterprise applicants.",
        "description": "Structured modern sans-serif with double-ruled accent section headers, 4-column skill grid, and optional top-right photo.",
        "atsSuitability": "High (96% ATS Friendly)",
        "atsBadge": "Corporate Standard",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": True,
        "supportsPhoto": True,
        "accentColor": "#2563A6",
        "swatches": ["#2563A6", "#0F766E", "#1E3A8A", "#7C2D12", "#4338CA", "#334155"],
    },
    {
        "id": "clean_minimalist",
        "name": "Clean Minimalist",
        "subtitle": "High-Craft Editorial Sans/Serif Pairing",
        "category": "Minimal & ATS",
        "audience": "Candidates seeking an uncluttered, distraction-free resume with maximum readability.",
        "description": "High-craft editorial pairing of crisp sans-serif headings with classic serif body, bold section underlines, and diamond bullets.",
        "atsSuitability": "Highest (99% ATS Friendly)",
        "atsBadge": "Maximum ATS",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": False,
        "supportsPhoto": False,
        "accentColor": "#111827",
        "swatches": ["#111827"],
    },
    {
        "id": "swiss_modern",
        "name": "Swiss Modern",
        "subtitle": "Architectural Column Split & Skill Bars",
        "category": "Modern & Design-Forward",
        "audience": "Product designers, frontend engineers, creative technologists, and design-forward applicants.",
        "description": "Architectural geometric sans-serif with oversized stacked all-caps name, vertical hairline column split, short thick accent underlines, and horizontal skill bars.",
        "atsSuitability": "Moderate (Human-Review Focused)",
        "atsBadge": "Swiss Design",
        "isDefault": False,
        "isTwoColumn": True,
        "supportsTheme": True,
        "supportsPhoto": False,
        "accentColor": "#111827",
        "swatches": ["#111827", "#1D4ED8", "#0F766E", "#B45309", "#9F1239", "#374151"],
        "atsNotice": "Notice: Two-column layout is designed for human review and portfolio submissions.",
    },
    {
        "id": "executive_slate",
        "name": "Executive Slate",
        "subtitle": "Airy Modern C-Suite Typography",
        "category": "Executive & Modern",
        "audience": "C-suite leaders, VPs, engineering managers, and senior architects.",
        "description": "Airy, modern C-suite/tech leadership sans-serif with monochrome-accent typography, zero heavy lines, and a 3-column expertise grid.",
        "atsSuitability": "High (95% ATS Friendly)",
        "atsBadge": "Executive Modern",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": True,
        "supportsPhoto": False,
        "accentColor": "#4A7BB7",
        "swatches": ["#4A7BB7", "#2563EB", "#0D9488", "#4F46E5", "#334155", "#0369A1"],
    },
    {
        "id": "editorial_warmth",
        "name": "Editorial Warmth",
        "subtitle": "Warm Terracotta Serif & Hairline Dividers",
        "category": "Modern & Editorial",
        "audience": "Writers, researchers, consultants, analysts, and tech professionals seeking warmth.",
        "description": "Refined warm-accent serif headings paired with clean sans-serif body and delicate hairline separators between roles and proficiencies.",
        "atsSuitability": "High (94% ATS Friendly)",
        "atsBadge": "Warm Editorial",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": True,
        "supportsPhoto": False,
        "accentColor": "#B5653B",
        "swatches": ["#B5653B", "#9A3412", "#1E40AF", "#166534", "#6D28D9", "#374151"],
    },
    {
        "id": "timeline_studio",
        "name": "Timeline Studio",
        "subtitle": "Continuous Vertical Career Timeline",
        "category": "Creative & Modern",
        "audience": "Designers, full-stack builders, creative directors, and candidates with rich milestone history.",
        "description": "Editorial 2-column layout with centered avatar, condensed uppercase headings, hollow circles on sidebar headers, and a continuous vertical timeline with circular nodes.",
        "atsSuitability": "Moderate (Visual & Creative Focus)",
        "atsBadge": "Visual Timeline",
        "isDefault": False,
        "isTwoColumn": True,
        "supportsTheme": True,
        "supportsPhoto": True,
        "accentColor": "#1F2937",
        "swatches": ["#1F2937", "#0F766E", "#1E3A8A", "#7E22CE", "#9F1239", "#B45309"],
        "atsNotice": "Notice: Two-column visual timeline layout is best suited for human review and creative roles.",
    },
    {
        "id": "emerald_sidebar",
        "name": "Emerald Sidebar",
        "subtitle": "Full-Bleed Colored Sidebar & White Contrast",
        "category": "Modern & Standout",
        "audience": "Candidates seeking a bold, standout first impression for direct recruiter review.",
        "description": "High-impact full-bleed colored left sidebar with circular avatar, white serif name, and white skill bars paired with a crisp white serif/sans right main column.",
        "atsSuitability": "Moderate (Visual Layout Focus)",
        "atsBadge": "Full-Bleed Sidebar",
        "isDefault": False,
        "isTwoColumn": True,
        "supportsTheme": True,
        "supportsPhoto": True,
        "accentColor": "#0D4A3E",
        "swatches": ["#0D4A3E", "#1E293B", "#581C37", "#1F2937", "#0F4C5C", "#2E1065"],
        "atsNotice": "Notice: Full-bleed sidebar layout is crafted for direct recruiter and human review.",
    },
    {
        "id": "ats_compact_pro",
        "name": "ATS Compact Pro",
        "subtitle": "Maximum Density Single-Column Corporate Standard",
        "category": "ATS & High-Density",
        "audience": "Corporate, finance, legal, and engineering applications demanding maximum space efficiency.",
        "description": "Maximum-density, recruiter-favorite single-column corporate, legal, and engineering ATS layout with 4-column skill grid.",
        "atsSuitability": "Highest (100% ATS Friendly)",
        "atsBadge": "Recruiter Favorite",
        "isDefault": False,
        "isTwoColumn": False,
        "supportsTheme": False,
        "supportsPhoto": False,
        "accentColor": "#111827",
        "swatches": ["#111827"],
    },
]

LEGACY_TEMPLATE_MAP = {
    # 8 legacy backend template IDs
    "modern_ats": "editorial_serif",
    "software_engineer": "corporate_accent",
    "data_science": "clean_minimalist",
    "graduate_fresher": "swiss_modern",
    "minimal_single": "ats_compact_pro",
    "professional_two_col": "emerald_sidebar",
    "executive_pro": "executive_slate",
    "academic_research": "editorial_serif",
    # 12 legacy frontend IDs
    "banner": "corporate_accent",
    "essential": "corporate_accent",
    "polished": "clean_minimalist",
    "vivid": "swiss_modern",
    "serif": "editorial_serif",
    "harmony": "editorial_warmth",
    "defined": "classic_executive",
    "executive": "emerald_sidebar",
    "minimal": "ats_compact_pro",
    "compact": "ats_compact_pro",
    "timeline": "timeline_studio",
    "academic": "editorial_serif",
}


def get_template_by_id(template_id: str) -> Dict[str, Any]:
    resolved_id = LEGACY_TEMPLATE_MAP.get(template_id, template_id)
    for t in TEMPLATES_METADATA:
        if t["id"] == resolved_id:
            return t
    return TEMPLATES_METADATA[0]  # Fallback to default editorial_serif


# ----------------------------------------------------------------------
# Skill Categorization Helper
# ----------------------------------------------------------------------
PROGRAMMING_LANGS = {
    "python", "java", "c++", "c", "c#", "javascript", "typescript", "go",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "dart"
}
FRAMEWORKS_LIBS = {
    "react", "react.js", "next.js", "vue", "angular", "node.js", "express.js",
    "fastapi", "django", "flask", "spring boot", "pytorch", "tensorflow",
    "scikit-learn", "pandas", "numpy", "keras", "huggingface", "tailwind",
    "bootstrap", "html/css", "rest apis", "graphql"
}
DATABASES = {
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "cassandra",
    "oracle", "snowflake", "bigquery", "dynamodb", "elasticsearch"
}
CLOUD_DEVOPS = {
    "aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "terraform",
    "linux", "git", "github actions", "jenkins", "ansible", "prometheus", "grafana"
}


def categorize_skills(raw_skills: List[str]) -> Dict[str, List[str]]:
    """Group flat skill list into standard technical categories."""
    cats: Dict[str, List[str]] = {
        "programming_languages": [],
        "frameworks_libraries": [],
        "databases": [],
        "cloud_devops": [],
        "tools_platforms": [],
        "other_skills": [],
    }
    seen = set()
    for sk in raw_skills:
        clean = sk.strip()
        if not clean or clean.lower() in seen:
            continue
        seen.add(clean.lower())
        c_low = clean.lower()
        if c_low in PROGRAMMING_LANGS:
            cats["programming_languages"].append(clean)
        elif any(f in c_low for f in ["react", "node", "fastapi", "django", "flask", "spring", "torch", "tensor", "learn", "pandas", "vue", "angular"]):
            cats["frameworks_libraries"].append(clean)
        elif any(d in c_low for d in ["sql", "mongo", "redis", "postgres", "mysql", "sqlite", "snow"]):
            cats["databases"].append(clean)
        elif any(cd in c_low for cd in ["aws", "cloud", "docker", "k8s", "kubernetes", "ci/cd", "linux", "terraform", "devops"]):
            cats["cloud_devops"].append(clean)
        elif any(t in c_low for t in ["git", "postman", "jira", "figma", "vs code", "linux", "bash"]):
            cats["tools_platforms"].append(clean)
        else:
            cats["other_skills"].append(clean)

    return cats


# ----------------------------------------------------------------------
# Profile Validation
# ----------------------------------------------------------------------
def validate_resume_profile(profile: Dict[str, Any], template_id: str = "modern_ats") -> Dict[str, Any]:
    """
    Validate normalized resume profile against required and recommended rules.
    Returns:
    {
      "valid": bool,
      "errors": List[str],        # Blocking missing required fields
      "warnings": List[str],      # Non-blocking missing recommended sections
      "includedSections": List[str],
      "candidateName": str,
      "contactInfo": str,
      "template": Dict[str, Any]
    }
    """
    tpl = get_template_by_id(template_id)
    errors: List[str] = []
    warnings: List[str] = []
    included: List[str] = []

    # 1. Essential: Candidate Name
    name = (
        profile.get("personalInfo", {}).get("full_name")
        or profile.get("contact", {}).get("name")
        or profile.get("basics", {}).get("name")
        or ""
    ).strip()

    if not name or len(name) < 2:
        errors.append("Candidate Full Name is required.")

    # 2. Essential: At least one contact method (email or phone)
    email = (
        profile.get("personalInfo", {}).get("email")
        or profile.get("contact", {}).get("email")
        or profile.get("basics", {}).get("email")
        or ""
    ).strip()
    phone = (
        profile.get("personalInfo", {}).get("phone")
        or profile.get("contact", {}).get("phone")
        or profile.get("basics", {}).get("phone")
        or ""
    ).strip()

    if not email and not phone:
        errors.append("At least one contact method (Email or Phone Number) is required.")

    # 3. Substantive Sections Check
    edu_list = profile.get("education", [])
    exp_list = profile.get("workExperience", []) or profile.get("experience", [])
    proj_list = profile.get("projects", [])
    skills_list = profile.get("technicalSkills", []) or profile.get("skills", {}).get("technical", [])
    certs_list = profile.get("certifications", [])
    achieve_list = profile.get("achievements", [])
    summary_text = (profile.get("summary") or profile.get("professionalSummary", "") or "").strip()
    pub_list = profile.get("additionalInfo", {}).get("publications", []) or profile.get("publications", [])

    has_substantive = bool(edu_list or exp_list or proj_list)
    if not has_substantive:
        errors.append("Resume must include at least one substantive section: Education, Work Experience, or Projects.")

    # Section-by-section inventory
    if name and (email or phone):
        included.append("Personal Information")
    if summary_text:
        included.append("Professional Summary")
    if edu_list:
        included.append(f"Education ({len(edu_list)} entr{'y' if len(edu_list) == 1 else 'ies'})")
    if exp_list:
        included.append(f"Work Experience ({len(exp_list)} role{'s' if len(exp_list) != 1 else ''})")
    if proj_list:
        included.append(f"Projects ({len(proj_list)} project{'s' if len(proj_list) != 1 else ''})")
    if skills_list:
        included.append(f"Technical Skills ({len(skills_list)} skills)")
    if certs_list:
        included.append(f"Certifications ({len(certs_list)} cert{'s' if len(certs_list) != 1 else ''})")
    if achieve_list:
        included.append(f"Achievements ({len(achieve_list)} entry{'s' if len(achieve_list) != 1 else ''})")
    if pub_list:
        included.append(f"Publications ({len(pub_list)} publication{'s' if len(pub_list) != 1 else ''})")

    # Template Specific Recommendations (Non-blocking warnings)
    t_id = tpl["id"]
    if t_id in ("swiss_modern", "graduate_fresher"):
        if not edu_list:
            errors.append("Graduate & Fresher / Swiss Modern template requires an Education entry.")
        if not proj_list:
            warnings.append("Graduate & Fresher resumes strongly benefit from at least one academic or personal project.")
    elif t_id in ("corporate_accent", "software_engineer"):
        if not (exp_list or proj_list):
            errors.append("Software Engineer / Corporate Accent template requires at least one Experience entry or Project.")
        if not skills_list:
            warnings.append("Corporate Accent template recommends listing key programming languages and frameworks.")
    elif t_id in ("clean_minimalist", "data_science"):
        if not (proj_list or exp_list or edu_list):
            errors.append("Clean Minimalist template requires at least one Project, Work Experience, or Education entry.")
        if not skills_list:
            warnings.append("Clean Minimalist template recommends listing key technical skills.")
    elif t_id in ("editorial_serif", "academic_research"):
        if not (edu_list or proj_list or exp_list):
            errors.append("Editorial Serif template requires Education, Projects, or Research Experience.")

    # General recommendations
    if not skills_list:
        warnings.append("Technical Skills section is empty. Adding skills significantly improves recruiter visibility.")
    if not summary_text:
        warnings.append("Professional summary is omitted (optional, will be hidden from final PDF).")

    contact_summary_parts = []
    if email:
        contact_summary_parts.append(email)
    if phone:
        contact_summary_parts.append(phone)
    city = (
        profile.get("personalInfo", {}).get("city")
        or profile.get("contact", {}).get("location")
        or ""
    ).strip()
    if city:
        contact_summary_parts.append(city)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "includedSections": included,
        "candidateName": name or "Candidate",
        "contactInfo": " · ".join(contact_summary_parts) or "None provided",
        "template": tpl,
    }


# ----------------------------------------------------------------------
# Clean String & HTML Sanitizer for ReportLab Flowables
# ----------------------------------------------------------------------
def sanitize_for_pdf(text: Any) -> str:
    """Escape XML characters while preserving clean whitespace for ReportLab."""
    if text is None:
        return ""
    s = str(text).strip()
    if not s:
        return ""
    # Escape standard XML entities
    s = html.escape(s, quote=False)
    # Convert newlines to break tags
    s = s.replace("\n", "<br/>")
    return s


def build_clickable_link(url: str, label: str, color_hex: str = "#2563EB") -> str:
    """Generate a clean clickable link safe for ReportLab Paragraphs."""
    clean_url = url.strip()
    if not clean_url:
        return sanitize_for_pdf(label)
    if not clean_url.startswith("http://") and not clean_url.startswith("https://") and not clean_url.startswith("mailto:") and not clean_url.startswith("tel:"):
        clean_url = "https://" + clean_url
    safe_label = sanitize_for_pdf(label)
    return f'<font color="{color_hex}"><u><a href="{clean_url}">{safe_label}</a></u></font>'


# ----------------------------------------------------------------------
# Numbered Canvas for Dynamic Page Numbering "Page X of Y"
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Any] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            if num_pages > 1:
                self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count: int) -> None:
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 20, page_str)
        self.restoreState()


# ----------------------------------------------------------------------
# PDF Generation Engine
# ----------------------------------------------------------------------
class ResumePdfGenerator:
    """Builds professional A4 resumes for all 8 templates."""

    def __init__(self, profile: Dict[str, Any], template_id: str = "modern_ats"):
        self.profile = profile
        self.template_id = template_id
        self.template = get_template_by_id(template_id)
        self.accent_hex = self.template.get("accentColor", "#1E3A8A")
        self.accent_color = colors.HexColor(self.accent_hex)
        self.dark_color = colors.HexColor("#18181B")
        self.muted_color = colors.HexColor("#52525B")
        self.light_bg = colors.HexColor("#F8FAFC")
        self.border_color = colors.HexColor("#E2E8F0")

        # Normalize data fields
        pinfo = self.profile.get("personalInfo", {})
        cinfo = self.profile.get("contact", {})
        binfo = self.profile.get("basics", {})
        self.name = (pinfo.get("full_name") or cinfo.get("name") or binfo.get("name") or "Candidate").strip()
        self.email = (pinfo.get("email") or cinfo.get("email") or binfo.get("email") or "").strip()
        self.phone = (pinfo.get("phone") or cinfo.get("phone") or binfo.get("phone") or "").strip()
        self.city = (pinfo.get("city") or cinfo.get("location") or binfo.get("location") or "").strip()
        self.linkedin = (pinfo.get("linkedin") or cinfo.get("linkedin") or "").strip()
        self.github = (pinfo.get("github") or cinfo.get("github") or "").strip()
        self.portfolio = (pinfo.get("portfolio") or cinfo.get("portfolio") or "").strip()

        # Summary / Objective
        self.summary = (
            self.profile.get("summary")
            or self.profile.get("professionalSummary")
            or self.profile.get("careerObjective")
            or ""
        ).strip()

        self.education = self.profile.get("education", [])
        self.experience = self.profile.get("workExperience", []) or self.profile.get("experience", [])
        self.projects = self.profile.get("projects", [])
        self.certifications = self.profile.get("certifications", [])
        self.achievements = self.profile.get("achievements", [])
        self.additional = self.profile.get("additionalInfo", {})
        self.publications = self.additional.get("publications", []) or self.profile.get("publications", [])
        self.research_interests = self.additional.get("research_interests", []) or self.profile.get("researchInterests", [])
        self.languages = self.additional.get("languages_known", []) or self.profile.get("languages", [])

        # Categorize technical skills
        raw_skills = self.profile.get("technicalSkills", [])
        if not raw_skills and isinstance(self.profile.get("skills"), dict):
            raw_skills = self.profile["skills"].get("technical", [])
        self.skill_cats = categorize_skills(raw_skills)
        self.all_skills = raw_skills

    def _setup_styles(self) -> Dict[str, ParagraphStyle]:
        styles = getSampleStyleSheet()

        t_id = self.template.get("id", self.template_id)
        if t_id in ("editorial_serif", "classic_executive", "editorial_warmth", "academic_research", "executive_pro"):
            font_family = "Times-Roman"
            font_bold = "Times-Bold"
            font_italic = "Times-Italic"
        else:
            font_family = "Helvetica"
            font_bold = "Helvetica-Bold"
            font_italic = "Helvetica-Oblique"

        custom_styles = {
            "Name": ParagraphStyle(
                "ResumeName",
                fontName=font_bold,
                fontSize=20,
                leading=24,
                textColor=self.dark_color,
                alignment=TA_LEFT,
                spaceAfter=4,
            ),
            "NameCenter": ParagraphStyle(
                "ResumeNameCenter",
                fontName=font_bold,
                fontSize=20,
                leading=24,
                textColor=self.dark_color,
                alignment=TA_CENTER,
                spaceAfter=4,
            ),
            "ContactLine": ParagraphStyle(
                "ResumeContact",
                fontName=font_family,
                fontSize=8.5,
                leading=12,
                textColor=self.muted_color,
                alignment=TA_LEFT,
                spaceAfter=8,
            ),
            "ContactLineCenter": ParagraphStyle(
                "ResumeContactCenter",
                fontName=font_family,
                fontSize=8.5,
                leading=12,
                textColor=self.muted_color,
                alignment=TA_CENTER,
                spaceAfter=8,
            ),
            "SectionHeading": ParagraphStyle(
                "ResumeSectionHeading",
                fontName=font_bold,
                fontSize=11,
                leading=15,
                textColor=self.accent_color,
                spaceBefore=10,
                spaceAfter=3,
                keepWithNext=True,
            ),
            "ItemTitle": ParagraphStyle(
                "ResumeItemTitle",
                fontName=font_bold,
                fontSize=10,
                leading=13,
                textColor=self.dark_color,
                keepWithNext=True,
            ),
            "ItemSubtitle": ParagraphStyle(
                "ResumeItemSubtitle",
                fontName=font_italic,
                fontSize=9,
                leading=12,
                textColor=self.muted_color,
                keepWithNext=True,
            ),
            "ItemRight": ParagraphStyle(
                "ResumeItemRight",
                fontName=font_family,
                fontSize=8.5,
                leading=12,
                textColor=self.muted_color,
                alignment=TA_RIGHT,
                keepWithNext=True,
            ),
            "Body": ParagraphStyle(
                "ResumeBody",
                fontName=font_family,
                fontSize=9,
                leading=13,
                textColor=self.dark_color,
                spaceAfter=4,
            ),
            "BulletText": ParagraphStyle(
                "ResumeBullet",
                fontName=font_family,
                fontSize=8.8,
                leading=12.5,
                textColor=self.dark_color,
                leftIndent=12,
                firstLineIndent=-8,
                spaceAfter=2,
            ),
            "NoticeBox": ParagraphStyle(
                "ResumeNoticeBox",
                fontName=font_italic,
                fontSize=7.5,
                leading=10,
                textColor=colors.HexColor("#92400E"),
                alignment=TA_CENTER,
                spaceAfter=6,
            ),
        }
        return custom_styles

    def _build_contact_string(self, center: bool = False) -> str:
        parts: List[str] = []
        if self.email:
            parts.append(build_clickable_link(f"mailto:{self.email}", self.email, self.accent_hex))
        if self.phone:
            parts.append(build_clickable_link(f"tel:{self.phone}", self.phone, self.accent_hex))
        if self.city:
            parts.append(sanitize_for_pdf(self.city))
        if self.linkedin:
            label = "LinkedIn" if "linkedin.com" in self.linkedin else self.linkedin
            parts.append(build_clickable_link(self.linkedin, label, self.accent_hex))
        if self.github:
            label = "GitHub" if "github.com" in self.github else self.github
            parts.append(build_clickable_link(self.github, label, self.accent_hex))
        if self.portfolio:
            label = "Portfolio"
            parts.append(build_clickable_link(self.portfolio, label, self.accent_hex))
        return "  ·  ".join(parts)

    def _build_divider(self, width: float = 523.27) -> HRFlowable:
        return HRFlowable(
            width=width,
            thickness=1,
            color=self.accent_color,
            spaceBefore=2,
            spaceAfter=6,
        )

    def _build_skills_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.all_skills:
            return elements

        elements.append(Paragraph("TECHNICAL SKILLS", styles["SectionHeading"]))
        elements.append(self._build_divider())

        # Check if we have rich categories
        cats = [
            ("Languages", self.skill_cats.get("programming_languages", [])),
            ("Frameworks & Libraries", self.skill_cats.get("frameworks_libraries", [])),
            ("Databases", self.skill_cats.get("databases", [])),
            ("Cloud & DevOps", self.skill_cats.get("cloud_devops", [])),
            ("Developer Tools", self.skill_cats.get("tools_platforms", [])),
            ("Other Competencies", self.skill_cats.get("other_skills", [])),
        ]
        non_empty = [(k, v) for k, v in cats if v]
        if non_empty and (self.template_id in ("software_engineer", "data_science", "modern_ats")):
            for cat_name, items in non_empty:
                line = f"<b>{cat_name}:</b> {sanitize_for_pdf(', '.join(items))}"
                elements.append(Paragraph(line, styles["Body"]))
        else:
            flat_line = sanitize_for_pdf(", ".join(self.all_skills))
            elements.append(Paragraph(flat_line, styles["Body"]))

        return elements

    def _build_education_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.education:
            return elements

        heading = "EDUCATION & ACADEMICS" if self.template_id == "graduate_fresher" else "EDUCATION"
        elements.append(Paragraph(heading, styles["SectionHeading"]))
        elements.append(self._build_divider())

        for edu in self.education:
            degree = edu.get("degree", "Degree")
            inst = edu.get("institution", "")
            spec = edu.get("specialization", "")
            year = edu.get("year") or edu.get("end_date") or ""
            score = edu.get("score") or edu.get("cgpa") or ""
            coursework = edu.get("coursework", "")

            title_txt = f"<b>{sanitize_for_pdf(degree)}</b>"
            if spec:
                title_txt += f" — <i>{sanitize_for_pdf(spec)}</i>"

            right_meta = []
            if year:
                right_meta.append(sanitize_for_pdf(year))
            if score:
                right_meta.append(f"<b>{sanitize_for_pdf(score)}</b>")
            right_txt = " | ".join(right_meta)

            table_data = [
                [
                    Paragraph(title_txt, styles["ItemTitle"]),
                    Paragraph(right_txt, styles["ItemRight"]),
                ]
            ]
            t = Table(table_data, colWidths=[380, 143])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]))
            elements.append(t)

            if inst:
                elements.append(Paragraph(sanitize_for_pdf(inst), styles["ItemSubtitle"]))

            if coursework:
                elements.append(Paragraph(f"<b>Key Coursework:</b> {sanitize_for_pdf(coursework)}", styles["BulletText"]))

            elements.append(Spacer(1, 4))

        return elements

    def _build_experience_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.experience:
            return elements

        heading = "LEADERSHIP & WORK EXPERIENCE" if self.template_id == "executive_pro" else "WORK EXPERIENCE"
        elements.append(Paragraph(heading, styles["SectionHeading"]))
        elements.append(self._build_divider())

        for exp in self.experience:
            role = exp.get("role") or exp.get("designation") or "Role"
            company = exp.get("company", "")
            duration = exp.get("duration") or exp.get("start_date", "") + (" - " + exp.get("end_date", "") if exp.get("end_date") else "")
            location = exp.get("location", "")
            emp_type = exp.get("employment_type", "")

            title_txt = f"<b>{sanitize_for_pdf(role)}</b>"
            if company:
                title_txt += f" · {sanitize_for_pdf(company)}"
            if emp_type:
                title_txt += f" (<i>{sanitize_for_pdf(emp_type)}</i>)"

            right_parts = []
            if duration:
                right_parts.append(sanitize_for_pdf(duration))
            if location:
                right_parts.append(sanitize_for_pdf(location))
            right_txt = " | ".join(right_parts)

            table_data = [
                [
                    Paragraph(title_txt, styles["ItemTitle"]),
                    Paragraph(right_txt, styles["ItemRight"]),
                ]
            ]
            t = Table(table_data, colWidths=[360, 163])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]))
            elements.append(t)

            # Bullets
            bullets = exp.get("highlights", []) or exp.get("responsibilities", [])
            for b in bullets:
                if b and str(b).strip():
                    elements.append(Paragraph(f"• {sanitize_for_pdf(b)}", styles["BulletText"]))

            # Achievements in role
            achievements_in_role = exp.get("achievements", [])
            if isinstance(achievements_in_role, list):
                for a in achievements_in_role:
                    if a and str(a).strip():
                        elements.append(Paragraph(f"• <b>Key Impact:</b> {sanitize_for_pdf(a)}", styles["BulletText"]))

            elements.append(Spacer(1, 4))

        return elements

    def _build_projects_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.projects:
            return elements

        heading = "KEY IMPLEMENTATIONS & PROJECTS" if self.template_id in ("data_science", "software_engineer") else "PROJECTS"
        elements.append(Paragraph(heading, styles["SectionHeading"]))
        elements.append(self._build_divider())

        for proj in self.projects:
            title = proj.get("title") or proj.get("name") or "Project"
            desc = proj.get("description", "")
            tech = proj.get("techStack") or proj.get("technologies") or []
            gh_link = proj.get("github_link") or proj.get("github") or ""
            live_link = proj.get("live_link") or proj.get("link") or ""

            left_txt = f"<b>{sanitize_for_pdf(title)}</b>"
            links_list = []
            if gh_link:
                links_list.append(build_clickable_link(gh_link, "GitHub", self.accent_hex))
            if live_link:
                links_list.append(build_clickable_link(live_link, "Live Demo", self.accent_hex))
            right_txt = " | ".join(links_list)

            table_data = [
                [
                    Paragraph(left_txt, styles["ItemTitle"]),
                    Paragraph(right_txt, styles["ItemRight"]),
                ]
            ]
            t = Table(table_data, colWidths=[400, 123])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]))
            elements.append(t)

            if tech:
                tech_str = ", ".join(tech) if isinstance(tech, list) else str(tech)
                elements.append(Paragraph(f"<b>Tech Stack:</b> <i>{sanitize_for_pdf(tech_str)}</i>", styles["ItemSubtitle"]))

            if desc:
                # If description has multiple sentences, format as bullets or concise body
                sentences = [s.strip() for s in desc.split(". ") if s.strip()]
                if len(sentences) > 1 and len(desc) > 80:
                    for s in sentences:
                        dot = "." if not s.endswith(".") else ""
                        elements.append(Paragraph(f"• {sanitize_for_pdf(s + dot)}", styles["BulletText"]))
                else:
                    elements.append(Paragraph(f"• {sanitize_for_pdf(desc)}", styles["BulletText"]))

            elements.append(Spacer(1, 4))

        return elements

    def _build_certifications_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.certifications:
            return elements

        elements.append(Paragraph("CERTIFICATIONS", styles["SectionHeading"]))
        elements.append(self._build_divider())

        for cert in self.certifications:
            if isinstance(cert, dict):
                c_name = cert.get("name", "Certification")
                issuer = cert.get("issuer") or cert.get("organization", "")
                date_val = cert.get("issue_date") or cert.get("date", "")
                link_val = cert.get("credential_link") or cert.get("url", "")

                txt = f"• <b>{sanitize_for_pdf(c_name)}</b>"
                if issuer:
                    txt += f" — {sanitize_for_pdf(issuer)}"
                if date_val:
                    txt += f" ({sanitize_for_pdf(date_val)})"
                if link_val:
                    txt += " · " + build_clickable_link(link_val, "Verify Credential", self.accent_hex)
                elements.append(Paragraph(txt, styles["BulletText"]))
            else:
                elements.append(Paragraph(f"• {sanitize_for_pdf(cert)}", styles["BulletText"]))

        elements.append(Spacer(1, 4))
        return elements

    def _build_achievements_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.achievements:
            return elements

        heading = "HONORS & ACHIEVEMENTS" if self.template_id in ("academic_research", "graduate_fresher") else "KEY ACHIEVEMENTS"
        elements.append(Paragraph(heading, styles["SectionHeading"]))
        elements.append(self._build_divider())

        for ach in self.achievements:
            if isinstance(ach, dict):
                title = ach.get("title", "Achievement")
                desc = ach.get("description", "")
                date_val = ach.get("date", "")
                txt = f"• <b>{sanitize_for_pdf(title)}</b>"
                if date_val:
                    txt += f" ({sanitize_for_pdf(date_val)})"
                if desc:
                    txt += f": {sanitize_for_pdf(desc)}"
                elements.append(Paragraph(txt, styles["BulletText"]))
            else:
                elements.append(Paragraph(f"• {sanitize_for_pdf(ach)}", styles["BulletText"]))

        elements.append(Spacer(1, 4))
        return elements

    def _build_publications_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        if not self.publications:
            return elements

        elements.append(Paragraph("PUBLICATIONS & RESEARCH", styles["SectionHeading"]))
        elements.append(self._build_divider())

        for pub in self.publications:
            if isinstance(pub, dict):
                p_title = pub.get("title", "")
                publisher = pub.get("publisher") or pub.get("journal", "")
                year = pub.get("year", "")
                link = pub.get("link") or pub.get("url", "")

                txt = f"• <i>\"{sanitize_for_pdf(p_title)}\"</i>"
                if publisher:
                    txt += f", <b>{sanitize_for_pdf(publisher)}</b>"
                if year:
                    txt += f" ({sanitize_for_pdf(year)})"
                if link:
                    txt += " · " + build_clickable_link(link, "DOI / Paper Link", self.accent_hex)
                elements.append(Paragraph(txt, styles["BulletText"]))
            else:
                elements.append(Paragraph(f"• {sanitize_for_pdf(pub)}", styles["BulletText"]))

        elements.append(Spacer(1, 4))
        return elements

    def _build_additional_section(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        elements: List[Any] = []
        has_research = bool(self.research_interests)
        has_languages = bool(self.languages)
        extracurriculars = self.additional.get("extracurriculars", [])

        if not (has_research or has_languages or extracurriculars):
            return elements

        elements.append(Paragraph("ADDITIONAL INFORMATION", styles["SectionHeading"]))
        elements.append(self._build_divider())

        if has_research:
            r_str = ", ".join(self.research_interests) if isinstance(self.research_interests, list) else str(self.research_interests)
            elements.append(Paragraph(f"<b>Research Interests:</b> {sanitize_for_pdf(r_str)}", styles["Body"]))

        if has_languages:
            l_str = ", ".join(self.languages) if isinstance(self.languages, list) else str(self.languages)
            elements.append(Paragraph(f"<b>Languages Known:</b> {sanitize_for_pdf(l_str)}", styles["Body"]))

        if extracurriculars:
            for ec in extracurriculars:
                elements.append(Paragraph(f"• {sanitize_for_pdf(ec)}", styles["BulletText"]))

        elements.append(Spacer(1, 4))
        return elements

    # ------------------------------------------------------------------
    # Two-Column Generator (Template 6: Professional Two Column)
    # ------------------------------------------------------------------
    def _generate_two_column_pdf(self, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """
        Builds Template 6 — Professional Two Column.
        Sidebar (width: 170pt): Contact, Skills, Education, Certifications, Languages.
        Main column (width: 335pt): Summary, Experience, Projects, Achievements.
        """
        story: List[Any] = []

        # Header across top
        story.append(Paragraph(sanitize_for_pdf(self.name), styles["Name"]))
        notice = "Two-Column Human Review Format · May require conversion for strict automated legacy ATS filters"
        story.append(Paragraph(notice, styles["NoticeBox"]))

        # Build Sidebar Flowables
        sidebar_flowables: List[Any] = []
        sidebar_flowables.append(Paragraph("CONTACT", styles["SectionHeading"]))
        sidebar_flowables.append(HRFlowable(width=160, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
        if self.email:
            sidebar_flowables.append(Paragraph(f"<b>Email:</b><br/>{build_clickable_link(f'mailto:{self.email}', self.email, self.accent_hex)}", styles["Body"]))
        if self.phone:
            sidebar_flowables.append(Paragraph(f"<b>Phone:</b><br/>{build_clickable_link(f'tel:{self.phone}', self.phone, self.accent_hex)}", styles["Body"]))
        if self.city:
            sidebar_flowables.append(Paragraph(f"<b>Location:</b><br/>{sanitize_for_pdf(self.city)}", styles["Body"]))
        if self.linkedin:
            sidebar_flowables.append(Paragraph(f"<b>LinkedIn:</b><br/>{build_clickable_link(self.linkedin, 'Profile Link', self.accent_hex)}", styles["Body"]))
        if self.github:
            sidebar_flowables.append(Paragraph(f"<b>GitHub:</b><br/>{build_clickable_link(self.github, 'Repository Profile', self.accent_hex)}", styles["Body"]))
        if self.portfolio:
            sidebar_flowables.append(Paragraph(f"<b>Portfolio:</b><br/>{build_clickable_link(self.portfolio, 'Live Portfolio', self.accent_hex)}", styles["Body"]))

        if self.all_skills:
            sidebar_flowables.append(Spacer(1, 8))
            sidebar_flowables.append(Paragraph("CORE SKILLS", styles["SectionHeading"]))
            sidebar_flowables.append(HRFlowable(width=160, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            for sk in self.all_skills[:14]:
                sidebar_flowables.append(Paragraph(f"• {sanitize_for_pdf(sk)}", styles["BulletText"]))

        if self.education:
            sidebar_flowables.append(Spacer(1, 8))
            sidebar_flowables.append(Paragraph("EDUCATION", styles["SectionHeading"]))
            sidebar_flowables.append(HRFlowable(width=160, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            for edu in self.education:
                deg = edu.get("degree", "Degree")
                inst = edu.get("institution", "")
                yr = edu.get("year") or edu.get("end_date") or ""
                sc = edu.get("score") or edu.get("cgpa") or ""
                sidebar_flowables.append(Paragraph(f"<b>{sanitize_for_pdf(deg)}</b>", styles["ItemTitle"]))
                if inst:
                    sidebar_flowables.append(Paragraph(sanitize_for_pdf(inst), styles["ItemSubtitle"]))
                if yr or sc:
                    sidebar_flowables.append(Paragraph(f"{sanitize_for_pdf(yr)} {f'· <b>{sanitize_for_pdf(sc)}</b>' if sc else ''}", styles["ItemRight"]))
                sidebar_flowables.append(Spacer(1, 4))

        if self.languages:
            sidebar_flowables.append(Spacer(1, 8))
            sidebar_flowables.append(Paragraph("LANGUAGES", styles["SectionHeading"]))
            sidebar_flowables.append(HRFlowable(width=160, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            l_str = ", ".join(self.languages) if isinstance(self.languages, list) else str(self.languages)
            sidebar_flowables.append(Paragraph(sanitize_for_pdf(l_str), styles["Body"]))

        # Build Main Column Flowables
        main_flowables: List[Any] = []
        if self.summary:
            main_flowables.append(Paragraph("EXECUTIVE SUMMARY", styles["SectionHeading"]))
            main_flowables.append(HRFlowable(width=335, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            main_flowables.append(Paragraph(sanitize_for_pdf(self.summary), styles["Body"]))
            main_flowables.append(Spacer(1, 6))

        # Main: Experience
        if self.experience:
            main_flowables.append(Paragraph("EXPERIENCE", styles["SectionHeading"]))
            main_flowables.append(HRFlowable(width=335, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            for exp in self.experience:
                role = exp.get("role") or exp.get("designation") or "Role"
                comp = exp.get("company", "")
                dur = exp.get("duration") or exp.get("start_date", "")
                main_flowables.append(Paragraph(f"<b>{sanitize_for_pdf(role)}</b> · {sanitize_for_pdf(comp)}", styles["ItemTitle"]))
                if dur:
                    main_flowables.append(Paragraph(sanitize_for_pdf(dur), styles["ItemSubtitle"]))
                for h in (exp.get("highlights", []) or exp.get("responsibilities", [])):
                    if h:
                        main_flowables.append(Paragraph(f"• {sanitize_for_pdf(h)}", styles["BulletText"]))
                main_flowables.append(Spacer(1, 4))

        # Main: Projects
        if self.projects:
            main_flowables.append(Paragraph("PROJECTS", styles["SectionHeading"]))
            main_flowables.append(HRFlowable(width=335, thickness=1, color=self.accent_color, spaceBefore=2, spaceAfter=4))
            for proj in self.projects:
                p_name = proj.get("title") or proj.get("name") or "Project"
                desc = proj.get("description", "")
                tech = proj.get("techStack") or proj.get("technologies") or []
                main_flowables.append(Paragraph(f"<b>{sanitize_for_pdf(p_name)}</b>", styles["ItemTitle"]))
                if tech:
                    t_str = ", ".join(tech) if isinstance(tech, list) else str(tech)
                    main_flowables.append(Paragraph(f"<i>Tech: {sanitize_for_pdf(t_str)}</i>", styles["ItemSubtitle"]))
                if desc:
                    main_flowables.append(Paragraph(f"• {sanitize_for_pdf(desc)}", styles["BulletText"]))
                main_flowables.append(Spacer(1, 4))

        # Main: Certifications & Achievements
        if self.certifications:
            main_flowables.extend(self._build_certifications_section(styles))
        if self.achievements:
            main_flowables.extend(self._build_achievements_section(styles))

        # Combine into two-column table
        two_col_table = Table(
            [[sidebar_flowables, main_flowables]],
            colWidths=[175, 348],
        )
        two_col_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LINEAFTER", (0, 0), (0, -1), 0.5, self.border_color),
        ]))
        story.append(two_col_table)
        return story

    # ------------------------------------------------------------------
    # Single-Column Generator (Templates 1, 2, 3, 4, 5, 7, 8)
    # ------------------------------------------------------------------
    def build_pdf_bytes(self) -> bytes:
        """Render complete A4 PDF and return raw bytes."""
        buffer = io.BytesIO()
        # Page size: A4 = 595.27 x 841.89 points.
        # Margins: 36 points (0.5 inch) left/right/top/bottom
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = self._setup_styles()
        story: List[Any] = []

        t_id = self.template.get("id", self.template_id)

        # Two Column Templates
        if self.template.get("isTwoColumn") or t_id in ("swiss_modern", "timeline_studio", "emerald_sidebar", "professional_two_col"):
            story = self._generate_two_column_pdf(styles)
            doc.build(story, canvasmaker=NumberedCanvas)
            return buffer.getvalue()

        # --------------------------------------------------------------
        # Single Column Templates
        # --------------------------------------------------------------
        is_centered = t_id in ("classic_executive", "clean_minimalist", "minimal_single", "academic_research")

        # Name Header
        if is_centered:
            story.append(Paragraph(sanitize_for_pdf(self.name), styles["NameCenter"]))
            story.append(Paragraph(self._build_contact_string(center=True), styles["ContactLineCenter"]))
        else:
            story.append(Paragraph(sanitize_for_pdf(self.name), styles["Name"]))
            story.append(Paragraph(self._build_contact_string(center=False), styles["ContactLine"]))

        # Professional Summary / Objective
        if self.summary:
            heading = "EXECUTIVE PROFILE" if t_id in ("classic_executive", "executive_slate", "executive_pro") else "PROFESSIONAL SUMMARY"
            story.append(Paragraph(heading, styles["SectionHeading"]))
            story.append(self._build_divider())
            story.append(Paragraph(sanitize_for_pdf(self.summary), styles["Body"]))
            story.append(Spacer(1, 4))

        # Section Ordering Per Template
        if t_id in ("corporate_accent", "ats_compact_pro", "software_engineer", "data_science"):
            # Skills first -> Projects -> Experience -> Education -> Certifications -> Achievements
            story.extend(self._build_skills_section(styles))
            story.extend(self._build_projects_section(styles))
            story.extend(self._build_experience_section(styles))
            story.extend(self._build_education_section(styles))
            story.extend(self._build_certifications_section(styles))
            story.extend(self._build_achievements_section(styles))
            if self.publications:
                story.extend(self._build_publications_section(styles))
            story.extend(self._build_additional_section(styles))

        elif t_id in ("editorial_serif", "academic_research"):
            # Education -> Experience -> Research Interests -> Publications (if any) -> Projects -> Skills -> Certifications -> Achievements
            story.extend(self._build_education_section(styles))
            if self.experience:
                story.extend(self._build_experience_section(styles))
            if self.research_interests:
                story.append(Paragraph("RESEARCH INTERESTS", styles["SectionHeading"]))
                story.append(self._build_divider())
                r_txt = ", ".join(self.research_interests) if isinstance(self.research_interests, list) else str(self.research_interests)
                story.append(Paragraph(sanitize_for_pdf(r_txt), styles["Body"]))
                story.append(Spacer(1, 4))
            if self.publications:
                story.extend(self._build_publications_section(styles))
            story.extend(self._build_projects_section(styles))
            story.extend(self._build_skills_section(styles))
            story.extend(self._build_certifications_section(styles))
            story.extend(self._build_achievements_section(styles))

        elif t_id in ("executive_slate", "editorial_warmth", "classic_executive", "executive_pro"):
            # Summary -> Achievements -> Experience -> Education -> Skills -> Certifications
            story.extend(self._build_achievements_section(styles))
            story.extend(self._build_experience_section(styles))
            story.extend(self._build_skills_section(styles))
            story.extend(self._build_education_section(styles))
            if self.projects:
                story.extend(self._build_projects_section(styles))
            story.extend(self._build_certifications_section(styles))
            story.extend(self._build_additional_section(styles))

        else:
            # Experience -> Education -> Projects -> Skills -> Certifications -> Achievements -> Additional
            if self.experience:
                story.extend(self._build_experience_section(styles))
            story.extend(self._build_education_section(styles))
            story.extend(self._build_skills_section(styles))
            story.extend(self._build_projects_section(styles))
            story.extend(self._build_certifications_section(styles))
            story.extend(self._build_achievements_section(styles))
            story.extend(self._build_additional_section(styles))

        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()


# ----------------------------------------------------------------------
# 3 Fictional Indian Test Profiles (Required by prompt Section 14 B)
# ----------------------------------------------------------------------
FICTIONAL_TEST_PROFILES = {
    "fresher": {
        "personalInfo": {
            "full_name": "Aarav Sharma",
            "email": "aarav.sharma@example.edu.in",
            "phone": "+91 98765 43210",
            "city": "Bengaluru, Karnataka",
            "linkedin": "https://linkedin.com/in/aarav-sharma-tech",
            "github": "https://github.com/aarav-sharma",
            "portfolio": "https://aaravsharma.dev",
        },
        "summary": "Motivated Computer Science graduate from Indian Institute of Technology Bombay seeking an entry-level software engineering role to build robust, scalable distributed applications.",
        "education": [
            {
                "degree": "B.Tech in Computer Science and Engineering",
                "institution": "Indian Institute of Technology Bombay",
                "specialization": "Distributed Computing",
                "year": "2020 – 2024",
                "score": "8.9 / 10.0 CGPA",
                "coursework": "Data Structures, Algorithms, Database Systems, Computer Networks, Operating Systems",
            }
        ],
        "workExperience": [],  # Fresher with zero prior corporate experience
        "projects": [
            {
                "title": "Distributed Cache Engine",
                "description": "Engineered an in-memory distributed key-value cache in Python and FastAPI with consistent hashing and LRU eviction supporting 5,000 req/sec benchmark load.",
                "techStack": ["Python", "FastAPI", "Redis", "Docker"],
                "github_link": "https://github.com/aarav-sharma/distributed-cache",
                "live_link": "https://cache-demo.aaravsharma.dev",
            },
            {
                "title": "Campus Placement Portal",
                "description": "Built candidate resume indexing and interview scheduling web platform adopted by 1,200+ students and 45 campus recruiters.",
                "techStack": ["React", "Node.js", "PostgreSQL"],
                "github_link": "https://github.com/aarav-sharma/placement-portal",
            },
        ],
        "technicalSkills": [
            "Python", "C++", "JavaScript", "SQL", "FastAPI", "React",
            "Node.js", "PostgreSQL", "Redis", "Git", "Docker", "Linux"
        ],
        "certifications": [
            {
                "name": "AWS Certified Cloud Practitioner",
                "issuer": "Amazon Web Services",
                "issue_date": "2023",
                "credential_link": "https://aws.amazon.com/verification/example",
            }
        ],
        "achievements": [
            {
                "title": "Smart India Hackathon Finalist",
                "description": "Ranked in top 5 out of 1,500 teams nationwide for automated civic issue tracking platform.",
                "date": "2023",
            },
            {
                "title": "Dean's Academic Merit Honor Roll",
                "description": "Awarded for consistent top 5% semester GPA across four consecutive academic semesters.",
                "date": "2022",
            },
        ],
        "additionalInfo": {
            "languages_known": ["English", "Hindi"],
            "extracurriculars": ["Core Coordinator, Techfest IIT Bombay", "Open Source Contributor"],
            "research_interests": [],
            "publications": [],
        },
    },
    "software_engineer": {
        "personalInfo": {
            "full_name": "Priya Nair",
            "email": "priya.nair@example.com",
            "phone": "+91 98123 45678",
            "city": "Hyderabad, Telangana",
            "linkedin": "https://linkedin.com/in/priya-nair-dev",
            "github": "https://github.com/priyanair",
            "portfolio": "https://priyanair.dev",
        },
        "summary": "Full-Stack Software Engineer with 4 years of experience architecting resilient backend microservices, real-time data pipelines, and developer tooling across high-volume fintech and e-commerce platforms.",
        "education": [
            {
                "degree": "B.E. in Information Technology",
                "institution": "National Institute of Technology Karnataka",
                "year": "2016 – 2020",
                "score": "8.6 CGPA",
                "coursework": "Software Architecture, Cloud Systems, Network Security",
            }
        ],
        "workExperience": [
            {
                "role": "Senior Software Engineer",
                "company": "Razorpay",
                "employment_type": "Full-time",
                "start_date": "2022",
                "end_date": "Present",
                "location": "Bengaluru, India",
                "highlights": [
                    "Architected core payment reconciliation microservices processing ₹40Cr+ daily volume with 99.99% availability.",
                    "Migrated monolithic batch payout system to event-driven Kafka pipelines, cutting settlement latency from 45 mins to 90 seconds.",
                    "Mentored 6 junior engineers and led code review standards across the payments platform squad.",
                ],
                "achievements": ["Spotlight Engineering Award 2023 for zero-loss payment failover architecture."],
            },
            {
                "role": "Software Engineer",
                "company": "Swiggy",
                "employment_type": "Full-time",
                "start_date": "2020",
                "end_date": "2022",
                "location": "Hyderabad, India",
                "highlights": [
                    "Engineered driver dispatch routing service using Go and Redis Geo-sets, lowering average order delivery time by 3.2 minutes.",
                    "Developed automated load test suites with Locust, identifying database deadlock bottlenecks before major festive flash sales.",
                ],
            },
        ],
        "projects": [
            {
                "title": "FinLog: Distributed Audit Ledger",
                "description": "Open-source append-only transaction audit ledger with cryptographic SHA-256 verification chains and sub-5ms proof generation.",
                "techStack": ["Go", "PostgreSQL", "Docker"],
                "github_link": "https://github.com/priyanair/finlog",
            }
        ],
        "technicalSkills": [
            "Go", "Python", "Java", "TypeScript", "SQL", "FastAPI",
            "Spring Boot", "React", "Next.js", "PostgreSQL", "Redis",
            "Kafka", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"
        ],
        "certifications": [
            {
                "name": "AWS Certified Solutions Architect – Associate",
                "issuer": "Amazon Web Services",
                "issue_date": "2022",
            },
            {
                "name": "Certified Kubernetes Application Developer (CKAD)",
                "issuer": "Cloud Native Computing Foundation",
                "issue_date": "2023",
            },
        ],
        "achievements": [
            {
                "title": "Speaker at PyCon India 2023",
                "description": "Presented 'Scaling Async Microservices with FastAPI and Celery'.",
                "date": "2023",
            }
        ],
        "additionalInfo": {
            "languages_known": ["English", "Hindi", "Malayalam"],
            "extracurriculars": [],
            "research_interests": [],
            "publications": [],
        },
    },
    "data_scientist": {
        "personalInfo": {
            "full_name": "Dr. Rohan Verma",
            "email": "rohan.verma.ds@example.com",
            "phone": "+91 99234 56789",
            "city": "Pune, Maharashtra",
            "linkedin": "https://linkedin.com/in/rohanverma-ml",
            "github": "https://github.com/rohanverma-ai",
            "portfolio": "https://rohanverma.ai",
        },
        "summary": "Data Scientist & Applied ML Engineer specializing in Large Language Model fine-tuning, retrieval-augmented generation (RAG), and statistical inference pipelines for enterprise intelligence.",
        "education": [
            {
                "degree": "M.Tech in Data Science & Artificial Intelligence",
                "institution": "Indian Institute of Science (IISc) Bangalore",
                "year": "2019 – 2021",
                "score": "9.2 CGPA",
                "coursework": "Deep Learning, Statistical Learning Theory, NLP, Optimization",
            },
            {
                "degree": "B.Tech in Computer Engineering",
                "institution": "College of Engineering Pune (COEP)",
                "year": "2015 – 2019",
                "score": "8.8 CGPA",
            },
        ],
        "workExperience": [
            {
                "role": "Lead Data Scientist",
                "company": "Zomato AI Labs",
                "employment_type": "Full-time",
                "start_date": "2021",
                "end_date": "Present",
                "location": "Gurugram / Remote",
                "highlights": [
                    "Developed neural recommendation model serving personalized restaurant feeds to 12M+ monthly active diners, improving CTR by 18.4%.",
                    "Trained domain-specific cross-encoder rerankers on customer review queries using PyTorch and HuggingFace Transformers.",
                    "Implemented automated feature drift detection pipelines in MLflow and Feast feature store.",
                ],
            }
        ],
        "projects": [
            {
                "title": "Enterprise RAG Assistant",
                "description": "Domain-adapted RAG question-answering system achieving 89% faithfulness on financial earnings call transcripts.",
                "techStack": ["Python", "PyTorch", "FastAPI", "ChromaDB"],
                "github_link": "https://github.com/rohanverma-ai/enterprise-rag",
            },
            {
                "title": "Real-Time Fraud Detection Engine",
                "description": "Sub-15ms inference latency pipeline detecting anomalous card transactions with 94.2% precision.",
                "techStack": ["Python", "XGBoost", "Kafka", "Docker"],
            },
        ],
        "technicalSkills": [
            "Python", "SQL", "R", "C++", "PyTorch", "TensorFlow",
            "Scikit-Learn", "HuggingFace", "LangChain", "Pandas",
            "NumPy", "PostgreSQL", "Milvus", "Docker", "Airflow", "Kafka"
        ],
        "certifications": [
            {
                "name": "DeepLearning.AI TensorFlow Developer Specialization",
                "issuer": "Coursera",
                "issue_date": "2021",
            }
        ],
        "achievements": [
            {
                "title": "Kaggle Grandmaster (Competitions)",
                "description": "Ranked top 100 globally out of 200,000+ active competitive ML practitioners.",
                "date": "2022",
            }
        ],
        "additionalInfo": {
            "languages_known": ["English", "Hindi", "Marathi"],
            "research_interests": ["Retrieval-Augmented Generation", "Indo-Aryan NLP", "Efficient Transformer Quantization"],
            "publications": [
                {
                    "title": "Efficient Attention Mechanisms for Domain-Adapted Transformers in Low-Resource Indic Languages",
                    "publisher": "IEEE International Conference on Big Data",
                    "year": "2023",
                    "link": "https://doi.org/10.1109/BigData.2023.example",
                }
            ],
        },
    },
}


def _hex_to_rgb(hex_str: str) -> "RGBColor":
    cleaned = hex_str.lstrip("#")
    if len(cleaned) == 3:
        cleaned = "".join([c * 2 for c in cleaned])
    if len(cleaned) != 6:
        return RGBColor(17, 24, 39)
    try:
        r = int(cleaned[0:2], 16)
        g = int(cleaned[2:4], 16)
        b = int(cleaned[4:6], 16)
        return RGBColor(r, g, b)
    except ValueError:
        return RGBColor(17, 24, 39)


class ResumeDocxGenerator:
    """
    Builds clean, editable, ATS-friendly Word documents (.docx) matching
    the selected template's font pairing, accent color, and column layout.
    """

    def __init__(
        self,
        profile: Dict[str, Any],
        template_id: str = "editorial_serif",
        accent_color: Optional[str] = None,
    ) -> None:
        self.profile = profile or {}
        self.template_id = template_id or "editorial_serif"

        meta = next((t for t in TEMPLATES_METADATA if t["id"] == self.template_id), None)
        self.meta = meta or TEMPLATES_METADATA[0]

        raw_accent = accent_color or self.meta.get("accentColor", "#111827")
        self.accent_rgb = _hex_to_rgb(raw_accent)
        self.dark_rgb = RGBColor(26, 32, 44)
        self.muted_rgb = RGBColor(100, 116, 139)
        self.border_rgb = RGBColor(203, 213, 225)

        serif_templates = {"editorial_serif", "classic_executive", "clean_minimalist", "editorial_warmth"}
        self.font_name = "Georgia" if self.template_id in serif_templates else "Calibri"
        self.is_two_col = self.template_id in {"editorial_serif", "swiss_modern", "timeline_studio", "emerald_sidebar"}
        self.is_center_header = self.template_id in {"classic_executive"}

    def _apply_run_font(self, run: Any, size_pt: float, bold: bool = False, italic: bool = False, color: Optional["RGBColor"] = None) -> None:
        run.font.name = self.font_name
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color or self.dark_rgb

    def _add_section_heading(self, container: Any, title: str) -> None:
        p = container.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title.upper())
        self._apply_run_font(r, size_pt=11.5, bold=True, color=self.accent_rgb)

    def _add_bullet_item(self, container: Any, text: str) -> None:
        if not text or not str(text).strip():
            return
        p = container.add_paragraph()
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Inches(0.2)
        r_bullet = p.add_run("•  ")
        self._apply_run_font(r_bullet, size_pt=9.5, color=self.accent_rgb)
        r_text = p.add_run(str(text).strip())
        self._apply_run_font(r_text, size_pt=9.5, color=self.dark_rgb)

    def _add_experience_block(self, container: Any, exp: Dict[str, Any]) -> None:
        role = exp.get("role", "")
        company = exp.get("company", "")
        duration = exp.get("duration") or exp.get("end_date") or ""
        location = exp.get("location", "")

        p = container.add_paragraph()
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.keep_with_next = True

        r_role = p.add_run(role)
        self._apply_run_font(r_role, size_pt=10.5, bold=True, color=self.dark_rgb)

        if company:
            r_comp = p.add_run(f" — {company}")
            self._apply_run_font(r_comp, size_pt=10.5, bold=False, color=self.dark_rgb)

        meta_parts = [m for m in [duration, location] if m]
        if meta_parts:
            p_meta = container.add_paragraph()
            p_meta.paragraph_format.space_before = Pt(0)
            p_meta.paragraph_format.space_after = Pt(2.5)
            p_meta.paragraph_format.keep_with_next = True
            r_meta = p_meta.add_run(" | ".join(meta_parts))
            self._apply_run_font(r_meta, size_pt=9, italic=True, color=self.muted_rgb)

        bullets = exp.get("bullets") or exp.get("highlights") or []
        for b in bullets:
            self._add_bullet_item(container, b)

    def _add_education_block(self, container: Any, edu: Dict[str, Any]) -> None:
        deg = edu.get("degree", "")
        inst = edu.get("institution", "")
        yr = edu.get("year") or edu.get("end_date") or ""
        score = edu.get("gpa") or edu.get("score") or ""

        p = container.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True

        r_deg = p.add_run(deg)
        self._apply_run_font(r_deg, size_pt=10, bold=True, color=self.dark_rgb)

        if inst:
            r_inst = p.add_run(f", {inst}")
            self._apply_run_font(r_inst, size_pt=10, color=self.dark_rgb)

        meta_parts = [m for m in [yr, f"GPA/Score: {score}" if score else ""] if m]
        if meta_parts:
            p_meta = container.add_paragraph()
            p_meta.paragraph_format.space_before = Pt(0)
            p_meta.paragraph_format.space_after = Pt(2)
            r_meta = p_meta.add_run(" | ".join(meta_parts))
            self._apply_run_font(r_meta, size_pt=9, italic=True, color=self.muted_rgb)

    def _add_project_block(self, container: Any, proj: Dict[str, Any]) -> None:
        title = proj.get("name") or proj.get("title") or ""
        stack = proj.get("tech_stack") or (", ".join(proj.get("techStack", [])) if isinstance(proj.get("techStack"), list) else "")
        links = [l for l in [proj.get("github_link"), proj.get("live_link")] if l]

        p = container.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True

        r_title = p.add_run(title)
        self._apply_run_font(r_title, size_pt=10, bold=True, color=self.dark_rgb)

        if stack:
            r_stack = p.add_run(f" [{stack}]")
            self._apply_run_font(r_stack, size_pt=9, italic=True, color=self.muted_rgb)

        if links:
            p_lnk = container.add_paragraph()
            p_lnk.paragraph_format.space_before = Pt(0)
            p_lnk.paragraph_format.space_after = Pt(2)
            r_lnk = p_lnk.add_run(" · ".join(links))
            self._apply_run_font(r_lnk, size_pt=8.5, color=self.accent_rgb)

        bullets = proj.get("bullets") or []
        if not bullets and proj.get("description"):
            bullets = [proj["description"]]
        for b in bullets:
            self._add_bullet_item(container, b)

    def build_docx_bytes(self) -> bytes:
        if docx is None:
            raise RuntimeError("python-docx is not installed.")

        doc = docx.Document()

        sec = doc.sections[0]
        margin_size = 0.5 if self.template_id in {"ats_compact_pro", "swiss_modern"} else 0.6
        sec.top_margin = Inches(margin_size)
        sec.bottom_margin = Inches(margin_size)
        sec.left_margin = Inches(margin_size)
        sec.right_margin = Inches(margin_size)

        p_info = self.profile.get("personalInfo") or self.profile.get("personal_info") or self.profile.get("basics") or {}
        full_name = p_info.get("full_name") or p_info.get("name") or "Candidate Name"
        headline = p_info.get("headline") or ""

        contact_items = []
        for key in ["email", "phone", "location", "linkedin", "github", "portfolio"]:
            val = p_info.get(key)
            if val and str(val).strip():
                contact_items.append(str(val).strip())

        p_name = doc.add_paragraph()
        p_name.paragraph_format.space_before = Pt(0)
        p_name.paragraph_format.space_after = Pt(2)
        if self.is_center_header:
            p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER

        r_name = p_name.add_run(full_name)
        self._apply_run_font(r_name, size_pt=20, bold=True, color=self.accent_rgb)

        if headline:
            p_head = doc.add_paragraph()
            p_head.paragraph_format.space_before = Pt(0)
            p_head.paragraph_format.space_after = Pt(3)
            if self.is_center_header:
                p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_head = p_head.add_run(headline)
            self._apply_run_font(r_head, size_pt=11, italic=True, color=self.muted_rgb)

        if contact_items:
            p_contact = doc.add_paragraph()
            p_contact.paragraph_format.space_before = Pt(0)
            p_contact.paragraph_format.space_after = Pt(8)
            if self.is_center_header:
                p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_contact = p_contact.add_run("  •  ".join(contact_items))
            self._apply_run_font(r_contact, size_pt=9, color=self.dark_rgb)

        summary = self.profile.get("summary") or ""
        if isinstance(summary, list):
            summary = " ".join(summary)

        exp_list = self.profile.get("workExperience") or self.profile.get("experience") or []
        edu_list = self.profile.get("education") or []
        proj_list = self.profile.get("projects") or []

        skills = self.profile.get("technicalSkills") or []
        if isinstance(skills, dict):
            skills = skills.get("technical", [])
        soft_skills = self.profile.get("softSkills") or []
        if isinstance(soft_skills, dict):
            soft_skills = soft_skills.get("soft", [])

        certs = self.profile.get("certifications") or []
        achievements = self.profile.get("achievements") or []
        languages = self.profile.get("languages") or []

        if self.is_two_col:
            table = doc.add_table(rows=1, cols=2)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            tblPr = table._tbl.tblPr
            tblBorders = OxmlElement("w:tblBorders")
            for b in ["top", "left", "bottom", "right", "insideH", "insideV"]:
                border_elem = OxmlElement(f"w:{b}")
                border_elem.set(qn("w:val"), "none")
                tblBorders.append(border_elem)
            tblPr.append(tblBorders)

            cell_left = table.cell(0, 0)
            cell_right = table.cell(0, 1)
            cell_left.width = Inches(2.3)
            cell_right.width = Inches(4.8)

            if skills:
                self._add_section_heading(cell_left, "Technical Skills")
                p_sk = cell_left.add_paragraph()
                p_sk.paragraph_format.space_before = Pt(2)
                p_sk.paragraph_format.space_after = Pt(4)
                sk_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
                r_sk = p_sk.add_run(sk_str)
                self._apply_run_font(r_sk, size_pt=9.5, color=self.dark_rgb)

            if soft_skills:
                self._add_section_heading(cell_left, "Core Strengths")
                p_soft = cell_left.add_paragraph()
                p_soft.paragraph_format.space_before = Pt(2)
                p_soft.paragraph_format.space_after = Pt(4)
                r_soft = p_soft.add_run(", ".join(soft_skills))
                self._apply_run_font(r_soft, size_pt=9.5, color=self.dark_rgb)

            if edu_list:
                self._add_section_heading(cell_left, "Education")
                for edu in edu_list:
                    self._add_education_block(cell_left, edu)

            if certs:
                self._add_section_heading(cell_left, "Certifications")
                for c in certs:
                    c_name = c.get("name") if isinstance(c, dict) else str(c)
                    self._add_bullet_item(cell_left, c_name)

            if languages:
                self._add_section_heading(cell_left, "Languages")
                for l in languages:
                    l_name = l.get("name") if isinstance(l, dict) else str(l)
                    self._add_bullet_item(cell_left, l_name)

            if summary and len(str(summary).strip()) >= 15:
                self._add_section_heading(cell_right, "Executive Summary")
                p_sum = cell_right.add_paragraph()
                p_sum.paragraph_format.space_before = Pt(2)
                p_sum.paragraph_format.space_after = Pt(6)
                r_sum = p_sum.add_run(str(summary).strip())
                self._apply_run_font(r_sum, size_pt=9.5, color=self.dark_rgb)

            if exp_list:
                self._add_section_heading(cell_right, "Work Experience")
                for exp in exp_list:
                    self._add_experience_block(cell_right, exp)

            if proj_list:
                self._add_section_heading(cell_right, "Key Projects")
                for proj in proj_list:
                    self._add_project_block(cell_right, proj)

            if achievements:
                self._add_section_heading(cell_right, "Honors & Achievements")
                for a in achievements:
                    a_text = a.get("title") if isinstance(a, dict) else str(a)
                    self._add_bullet_item(cell_right, a_text)

        else:
            if summary and len(str(summary).strip()) >= 15:
                self._add_section_heading(doc, "Professional Summary")
                p_sum = doc.add_paragraph()
                p_sum.paragraph_format.space_before = Pt(2)
                p_sum.paragraph_format.space_after = Pt(6)
                r_sum = p_sum.add_run(str(summary).strip())
                self._apply_run_font(r_sum, size_pt=10, color=self.dark_rgb)

            if exp_list:
                self._add_section_heading(doc, "Work Experience")
                for exp in exp_list:
                    self._add_experience_block(doc, exp)

            if edu_list:
                self._add_section_heading(doc, "Education")
                for edu in edu_list:
                    self._add_education_block(doc, edu)

            if proj_list:
                self._add_section_heading(doc, "Key Projects")
                for proj in proj_list:
                    self._add_project_block(doc, proj)

            if skills or soft_skills:
                self._add_section_heading(doc, "Technical Skills & Competencies")
                if skills:
                    p_sk = doc.add_paragraph()
                    p_sk.paragraph_format.space_before = Pt(2)
                    p_sk.paragraph_format.space_after = Pt(3)
                    r_lbl = p_sk.add_run("Technical Stack: ")
                    self._apply_run_font(r_lbl, size_pt=9.5, bold=True, color=self.dark_rgb)
                    sk_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
                    r_sk = p_sk.add_run(sk_str)
                    self._apply_run_font(r_sk, size_pt=9.5, color=self.dark_rgb)
                if soft_skills:
                    p_soft = doc.add_paragraph()
                    p_soft.paragraph_format.space_before = Pt(1)
                    p_soft.paragraph_format.space_after = Pt(4)
                    r_lbl_s = p_soft.add_run("Core Strengths: ")
                    self._apply_run_font(r_lbl_s, size_pt=9.5, bold=True, color=self.dark_rgb)
                    r_soft = p_soft.add_run(", ".join(soft_skills))
                    self._apply_run_font(r_soft, size_pt=9.5, color=self.dark_rgb)

            if certs:
                self._add_section_heading(doc, "Certifications")
                for c in certs:
                    c_name = c.get("name") if isinstance(c, dict) else str(c)
                    self._add_bullet_item(doc, c_name)

            if achievements:
                self._add_section_heading(doc, "Achievements & Recognition")
                for a in achievements:
                    a_text = a.get("title") if isinstance(a, dict) else str(a)
                    self._add_bullet_item(doc, a_text)

            if languages:
                self._add_section_heading(doc, "Languages")
                p_lang = doc.add_paragraph()
                p_lang.paragraph_format.space_before = Pt(2)
                p_lang.paragraph_format.space_after = Pt(4)
                lang_names = [l.get("name") if isinstance(l, dict) else str(l) for l in languages]
                r_lang = p_lang.add_run(", ".join(lang_names))
                self._apply_run_font(r_lang, size_pt=9.5, color=self.dark_rgb)

        bio = io.BytesIO()
        doc.save(bio)
        return bio.getvalue()

