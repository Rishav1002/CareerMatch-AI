"""
Backend Server for CareerMatch AI.
FastAPI Application providing REST APIs with strict owner-based data isolation:
- Existing Core Features:
  1. AI-powered resume parsing (PDF via PyMuPDF + pypdf, DOCX via python-docx, TXT)
  2. Student skill assessment & semantic skill-gap analysis
  3. Personalized Google Gemini AI career recommendations & courses (Free & Paid)
  4. Interactive roadmap node graph generation
  5. Resume improvement suggestions
  6. Relational Database Student Dashboard & analysis history
- CareerMatch AI Advanced Modules:
  - JWT Authentication & Central Student Career Profile (`/api/auth/*`, `/api/profile`)
  - Module 1: Live Job Market Intelligence (`/api/jobs/market`)
  - Module 2: AI Mock Interview Simulator (`/api/interview/*`)
  - Module 3: ATS Resume Simulator (`/api/ats/evaluate`)
  - Module 4: GitHub Skill Verification & Portfolio Analyzer (`/api/github/analyze`)
  - Module 5: Adaptive AI Learning Roadmap (`/api/roadmap/adaptive`, `/api/roadmap/task`, `/api/roadmap/quiz`)
  - Module 6: AI Skill Assessment Lab (`/api/assessment/*`)
  - Module 7: Career Path & Salary Intelligence (`/api/career/compare`)
  - Module 8: Placement Readiness Index (`/api/readiness/index`)
"""

import base64
import hashlib
import hmac
import json
import mimetypes
import os
import subprocess
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import FileResponse, JSONResponse  # type: ignore
from fastapi.staticfiles import StaticFiles  # type: ignore

from backend.ai_service import enrich_resume_profile_with_gemini, generate_career_intelligence
from backend.career_modules import (
    DEFAULT_PRI_WEIGHTS,
    analyze_github_portfolio,
    compare_career_paths,
    compute_placement_readiness_index,
    decode_jwt_token,
    evaluate_ats_resume,
    fetch_job_market_intelligence,
    generate_skill_assessment,
    get_adaptive_roadmap,
    get_assessment_hint,
    get_assessment_history,
    get_interview_history,
    get_student_profile,
    import_student_profile,
    login_demo_user,
    login_user,
    register_user,
    seed_demo_user_and_profile,
    start_interview_session,
    submit_interview_answer,
    submit_roadmap_stage_quiz,
    submit_skill_assessment,
    toggle_learning_task,
    update_student_profile,
)
from backend.config import (
    APP_ENV,
    CORS_ORIGINS,
    GUEST_DATA_TTL_DAYS,
    HEALTH_KEY,
    JWT_SECRET,
    PORT as DEFAULT_PORT,
    ROOT_DIR,
)
from backend.database import (
    check_and_increment_ai_usage,
    claim_guest_data,
    delete_analysis_record,
    delete_owner_records,
    export_owner_records,
    get_ai_usage,
    get_analysis_by_id,
    get_connection,
    get_dashboard_metrics,
    get_resume_by_id,
    get_roadmap_progress,
    init_db,
    save_analysis_record,
    save_resume,
    save_roadmap_progress,
    update_resume_skills,
)
from backend.matching_engine import (
    DEFAULT_WEIGHTS,
    ROLE_TEMPLATES,
    SAMPLE_RESUMES,
    build_roadmap_tree_nodes,
    build_skill_gaps,
    match_resume_to_job,
    resolve_job_profile,
)
from backend.rate_limiter import rate_limiter
from backend.resume_parser import (
    extract_text_from_file_bytes,
    parse_resume_text_to_profile,
    sanitize_plain_text,
    sanitize_short_field,
)
from backend.roles_catalog import get_roles_by_category, get_roles_catalog

FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")


def seed_initial_sqlite_data() -> None:
    """Initialize relational tables and purge legacy unowned rows."""
    init_db()
    seed_demo_user_and_profile()


# Initialize database on module load
seed_initial_sqlite_data()


# ============================================================================
# SECURITY & OWNERSHIP HELPERS
# ============================================================================

def _sign_cookie_val(val: str) -> str:
    sig = hmac.new(JWT_SECRET.encode("utf-8"), val.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{val}.{sig}"


def _verify_cookie_val(raw: Optional[str]) -> Optional[str]:
    if not raw or "." not in raw:
        return None
    val, sig = raw.rsplit(".", 1)
    expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), val.encode("utf-8"), hashlib.sha256).hexdigest()
    if hmac.compare_digest(sig, expected_sig):
        return val
    return None


async def get_owner(request: Request) -> Tuple[str, bool]:
    """
    FastAPI dependency returning (owner_id, is_authenticated).
    - Authenticated: extracted and verified from JWT token
    - Guest: verified signed cm_sid cookie or newly generated guest session
    Never trusts client-supplied user ID in queries, headers, or body.
    """
    # 1. Check verified JWT from Authorization header or cookie
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.strip():
        raw = auth_header.strip()
        if raw.lower().startswith("bearer "):
            token = raw[7:].strip()
        else:
            token = raw
    elif request.cookies.get("cm_jwt_token"):
        token = request.cookies.get("cm_jwt_token")

    if token:
        try:
            claims = decode_jwt_token(token)
            if claims and claims.get("sub"):
                return str(claims["sub"]), True
        except Exception:
            pass

    # 2. Check guest session from request.state (set by middleware)
    guest_id = getattr(request.state, "guest_id", None)
    if not guest_id:
        raw_cookie = request.cookies.get("cm_sid")
        verified = _verify_cookie_val(raw_cookie)
        guest_id = verified or f"guest_{uuid.uuid4().hex}"
        request.state.guest_id = guest_id

    return guest_id, False


def _extract_user_id_from_auth_header(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header or not auth_header.strip():
        return None
    raw = auth_header.strip()
    if raw.lower().startswith("bearer "):
        token = raw[7:].strip()
    else:
        token = raw
    if not token:
        raise PermissionError("Invalid or expired authentication token.")
    claims = decode_jwt_token(token)
    if claims and claims.get("sub"):
        return str(claims["sub"])
    raise PermissionError("Invalid or expired authentication token.")


# ============================================================================
# CORE CONTROLLER LOGIC
# ============================================================================

def handle_health_check(request_key: Optional[str] = None) -> tuple[Dict[str, Any], int]:
    db_ok = False
    engine = "sqlite"
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        res = cursor.fetchone()
        db_ok = bool(res)
        engine = "postgresql" if hasattr(conn, "_conn") else "sqlite"
        conn.close()
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503

    # Bug 3: Public response is sanitized to prevent infrastructure information disclosure
    # Detailed diagnostics only served when authorized with confidential X-Health-Key
    is_authorized = bool(
        HEALTH_KEY and request_key and hmac.compare_digest(str(request_key).strip(), str(HEALTH_KEY).strip())
    )
    if not is_authorized:
        return {"status": "ok" if db_ok else "unavailable"}, status_code

    return {
        "status": "ok" if db_ok else "unavailable",
        "database": "connected" if db_ok else "disconnected",
        "engine": engine,
        "version": "4.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }, status_code


def handle_ask_ai_payload(body: Dict[str, Any], owner_id: str, is_auth: bool) -> tuple[Dict[str, Any], int]:
    question = sanitize_plain_text(body.get("question", ""), 1000).strip()
    if not question:
        return {"detail": "Question text is required."}, 400

    allowed, remaining, limit, reset_at = check_and_increment_ai_usage(owner_id, is_auth)
    if not allowed:
        return {
            "detail": f"Daily AI query limit reached ({limit}/{limit}). Limit resets at midnight UTC.",
            "limit": limit,
            "remaining": 0,
            "resetAt": reset_at,
        }, 429

    resume = body.get("resume") or {}
    skills = resume.get("technicalSkills", [])
    target_role = sanitize_short_field(body.get("targetRole", "Software Engineer"), 80)
    current_view = sanitize_short_field(body.get("currentView", "dashboard"), 40)

    prompt = (
        f"You are the CareerMatch AI Advisor. Provide concise, expert, practical career advice for Indian engineers.\n"
        f"Context:\n"
        f"- Target Role: {target_role}\n"
        f"- Candidate Technical Skills: {', '.join(skills[:12]) if skills else 'None uploaded yet'}\n"
        f"- Current Context View: {current_view}\n\n"
        f"User Question: {question}\n\n"
        f"Answer in 2-3 focused, actionable paragraphs with bullet points where helpful. Be encouraging, honest, and specific to tech hiring standards in India and remote."
    )

    try:
        from backend.ai_service import _call_gemini_text
        answer = _call_gemini_text(prompt)
    except Exception:
        answer = (
            f"Here is strategic advice for **{target_role}**:\n\n"
            f"1. **Core Competencies**: Focus on fundamental system design, SQL query profiling, and clean architecture.\n"
            f"2. **ATS Impact**: Quantify accomplishments in your resume bullets using measurable impact (e.g. latency reduced by 30%, query speed improved 2x).\n"
            f"3. **Proof of Work**: Back your claims with working GitHub repositories containing clean tests and documentation."
        )

    return {
        "answer": answer,
        "remaining": remaining,
        "limit": limit,
        "resetAt": reset_at,
    }, 200


def handle_bootstrap(user_id: Optional[str] = None, owner_id: Optional[str] = None) -> Dict[str, Any]:
    student_profile = get_student_profile(user_id) if user_id else None
    active_resume_id = student_profile.get("activeResumeId") if student_profile else None

    return {
        "dashboard": get_dashboard_metrics(active_resume_id, owner_id=owner_id),
        "roles": get_roles_catalog(),
        "defaultWeights": DEFAULT_WEIGHTS,
        "defaultPriWeights": DEFAULT_PRI_WEIGHTS,
        "studentProfile": student_profile,
    }


def handle_parse_resume_payload(body: Dict[str, Any], owner_id: str = "legacy_unowned") -> Dict[str, Any]:
    filename = sanitize_short_field(body.get("filename", "Uploaded_Resume.txt"), 120)
    base64_data = body.get("base64Data", "")
    pasted_text = body.get("pastedText", "")
    dont_save = bool(body.get("dontSave", False))

    if base64_data:
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]
        raw_bytes = base64.b64decode(base64_data)
        extracted_text = extract_text_from_file_bytes(filename, raw_bytes)
    elif pasted_text and len(str(pasted_text).strip()) >= 20:
        extracted_text = sanitize_plain_text(str(pasted_text), 50000)
        filename = "Pasted_Resume.txt"
    else:
        raise ValueError("Please provide a valid PDF, DOCX, or TXT resume file or paste at least 20 characters of resume text.")

    profile = parse_resume_text_to_profile(extracted_text, filename)
    profile = enrich_resume_profile_with_gemini(extracted_text, profile)
    if not dont_save:
        save_resume(profile, owner_id=owner_id)
    return {
        "resume": profile,
        "source": profile.get("extractionSource", "template"),
        "saved": not dont_save,
        "dashboard": get_dashboard_metrics(profile["id"] if not dont_save else None, owner_id=owner_id),
    }


def handle_analyze_payload(body: Dict[str, Any], owner_id: str = "legacy_unowned") -> Dict[str, Any]:
    resume = body.get("resume")
    resume_id = body.get("resumeId")
    dont_save = bool(body.get("dontSave", False))

    if not resume and resume_id:
        resume = get_resume_by_id(str(resume_id), owner_id=owner_id)

    if not resume or not isinstance(resume, dict):
        raise ValueError("Candidate resume profile is required for analysis.")

    if not dont_save:
        save_resume(resume, owner_id=owner_id)

    raw_role = body.get("roleTitle")
    if not raw_role or not str(raw_role).strip() or str(raw_role).strip() == "Select role...":
        raise ValueError("Target role is required for career match analysis.")
    role_title = sanitize_short_field(str(raw_role).strip(), 100)
    goal_company = sanitize_short_field(body.get("goalCompany", ""), 100)
    custom_jd = sanitize_plain_text(body.get("customJdText", ""), 20000)
    job_url = sanitize_short_field(body.get("jobUrl", ""), 300)
    weights = body.get("weights") or DEFAULT_WEIGHTS
    custom_focus = sanitize_short_field(body.get("customFocus", ""), 200)
    persist_record = bool(body.get("persistRecord", True)) and not dont_save

    active_job = resolve_job_profile(role_title, goal_company, custom_jd, job_url)
    match_result = match_resume_to_job(resume, active_job, weights)
    skill_gaps = build_skill_gaps(match_result, active_job["title"])
    roadmap_nodes = build_roadmap_tree_nodes(match_result, skill_gaps)

    intelligence = generate_career_intelligence(
        resume=resume,
        target_role=active_job["title"],
        goal_company=active_job.get("companyName") or active_job.get("company", ""),
        missing_skills=[g["skillName"] for g in skill_gaps],
        custom_focus=custom_focus,
    )

    ats_eval = evaluate_ats_resume({"resume": resume, "targetRole": active_job["title"]})
    ats_score = float(ats_eval.get("atsScore", 0.0))

    analysis_id = 0
    if persist_record:
        analysis_id = save_analysis_record(
            resume_id=resume["id"],
            candidate_name=resume.get("contact", {}).get("name", "Candidate"),
            target_role=active_job["title"],
            goal_company=active_job.get("companyName") or active_job.get("company", ""),
            match_result=match_result,
            skill_gaps=skill_gaps,
            roadmap=intelligence.get("stages", roadmap_nodes),
            advisor=intelligence.get("advisor", {}),
            projects=intelligence.get("projects", []),
            improvements=intelligence.get("improvements", {}),
            ats_score=ats_score,
            ats_report=ats_eval,
            owner_id=owner_id,
        )

    return {
        "analysisId": analysis_id,
        "resume": resume,
        "job": active_job,
        "match": match_result,
        "skillGaps": skill_gaps,
        "roadmap": intelligence.get("stages", roadmap_nodes),
        "advisor": intelligence.get("advisor", {}),
        "projects": intelligence.get("projects", []),
        "improvements": intelligence.get("improvements", {}),
        "ats": ats_eval,
        "dashboard": get_dashboard_metrics(resume["id"], owner_id=owner_id),
    }


def handle_load_history_record(analysis_id: int, owner_id: str) -> Dict[str, Any]:
    record = get_analysis_by_id(analysis_id, owner_id=owner_id)
    if not record:
        raise ValueError("Analysis record not found.")
    return {
        "id": record["id"],
        "resumeId": record["resumeId"],
        "candidateName": record["candidateName"],
        "targetRole": record["targetRole"],
        "goalCompany": record["goalCompany"],
        "overallScore": record["overallScore"],
        "mandatoryMetPct": record["mandatoryMetPct"],
        "preferredMetPct": record["preferredMetPct"],
        "matchedSkills": record["matchedSkills"],
        "partialSkills": record["partialSkills"],
        "missingSkills": record["missingSkills"],
        "skillGaps": record["skillGaps"],
        "roadmap": record["stages"],
        "advisor": record["advisor"],
        "projects": record["projects"],
        "improvements": record["improvements"],
        "createdAt": record["createdAt"],
    }


def handle_update_roadmap_progress_payload(body: Dict[str, Any], owner_id: str = "legacy_unowned") -> Dict[str, Any]:
    resume_id = sanitize_short_field(body.get("resumeId", ""), 80)
    target_role = sanitize_short_field(body.get("targetRole", ""), 100)
    completed = body.get("completedNodes", {})
    if not resume_id or not target_role or not isinstance(completed, dict):
        raise ValueError("resumeId, targetRole, and completedNodes dict are required.")
    clean_map = {sanitize_short_field(k, 80): bool(v) for k, v in list(completed.items())[:100]}
    saved = save_roadmap_progress(resume_id, target_role, clean_map, owner_id=owner_id)
    return {"completedNodes": saved}


def handle_update_skills_payload(body: Dict[str, Any], owner_id: str = "legacy_unowned") -> Dict[str, Any]:
    resume_id = sanitize_short_field(body.get("resumeId", ""), 80)
    raw_skills = body.get("skills", [])
    if not isinstance(raw_skills, list):
        raise ValueError("skills must be a list of strings.")

    clean_skills: List[str] = []
    for s in raw_skills[:50]:
        cs = sanitize_short_field(s, 60)
        if cs and cs not in clean_skills:
            clean_skills.append(cs)

    updated = update_resume_skills(resume_id, clean_skills, owner_id=owner_id)
    if not updated:
        raise ValueError("Resume profile not found in database.")
    return {"resume": updated}


# ============================================================================
# FASTAPI APPLICATION DEFINITION
# ============================================================================

app = FastAPI(
    title="CareerMatch AI API",
    description="Unified AI Career Intelligence, Skill Development & Placement Readiness Platform",
    version="4.0.0",
)

# Parse CORS origins from environment
if CORS_ORIGINS:
    allowed_origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
elif APP_ENV == "production":
    allowed_origins = []  # Strict same-origin in production
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)


@app.middleware("http")
async def session_and_security_middleware(request: Request, call_next: Any) -> Any:
    # 1. Resolve or establish guest identity
    raw_cookie = request.cookies.get("cm_sid")
    verified_guest = _verify_cookie_val(raw_cookie)
    need_new_cookie = False

    if verified_guest:
        request.state.guest_id = verified_guest
    else:
        new_guest_id = f"guest_{uuid.uuid4().hex}"
        request.state.guest_id = new_guest_id
        need_new_cookie = True

    # 2. Process request
    response = await call_next(request)

    # 3. Attach signed cm_sid cookie if new or missing
    if need_new_cookie:
        is_secure = request.url.scheme == "https" or APP_ENV == "production"
        signed_val = _sign_cookie_val(request.state.guest_id)
        response.set_cookie(
            key="cm_sid",
            value=signed_val,
            httponly=True,
            samesite="lax",
            secure=is_secure,
            max_age=GUEST_DATA_TTL_DAYS * 86400,
            path="/",
        )

    # 4. Enforce strict production security headers and strip server fingerprints
    if "Server" in response.headers:
        del response.headers["Server"]
    if "X-Powered-By" in response.headers:
        del response.headers["X-Powered-By"]

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none';"
    )

    if request.url.scheme == "https" or APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"

    return response


# ============================================================================
# API ROUTE DEFINITIONS
# ============================================================================

@app.get("/api/health")
@app.head("/api/health")
async def api_health(request: Request) -> Any:
    key = request.headers.get("X-Health-Key")
    res, code = handle_health_check(key)
    return JSONResponse(res, status_code=code)


@app.get("/api/roles")
async def api_roles() -> Dict[str, Any]:
    return {"roles": get_roles_catalog(), "categories": get_roles_by_category()}


@app.get("/api/bootstrap")
async def api_bootstrap(owner_info: Tuple[str, bool] = Depends(get_owner)) -> Dict[str, Any]:
    owner_id, is_auth = owner_info
    user_id = owner_id if is_auth else None
    return handle_bootstrap(user_id=user_id, owner_id=owner_id)


@app.get("/api/dashboard")
async def api_dashboard(
    resumeId: Optional[str] = None,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    return get_dashboard_metrics(resumeId, owner_id=owner_id)


@app.post("/api/resume/parse")
async def api_parse_resume(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    allowed, retry = rate_limiter.is_allowed(f"parse_{owner_id}", max_requests=15, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Resume parse rate limit reached. Please wait {retry}s.")

    try:
        body = await request.json()
        return handle_parse_resume_payload(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {exc}")


@app.post("/api/resume/upload")
async def api_upload_multipart(
    file: UploadFile = File(...),
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    allowed, retry = rate_limiter.is_allowed(f"upload_{owner_id}", max_requests=10, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Upload rate limit reached. Please wait {retry}s.")

    try:
        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise ValueError("Uploaded file exceeds maximum allowed size of 5 MB.")
        safe_filename = os.path.basename(file.filename or "resume.pdf")
        text = extract_text_from_file_bytes(safe_filename, file_bytes)
        profile = parse_resume_text_to_profile(text, safe_filename)
        save_resume(profile, owner_id=owner_id)
        return {"resume": profile, "dashboard": get_dashboard_metrics(profile["id"], owner_id=owner_id)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/analyze")
async def api_analyze(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    allowed, retry = rate_limiter.is_allowed(f"analyze_{owner_id}", max_requests=10, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Analysis rate limit reached. Please wait {retry}s.")

    try:
        body = await request.json()
        return handle_analyze_payload(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")


@app.put("/api/resume/skills")
async def api_update_skills(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return handle_update_skills_payload(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.put("/api/roadmap/progress")
async def api_update_roadmap_progress(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return handle_update_roadmap_progress_payload(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/history/{analysis_id}")
async def api_get_history(
    analysis_id: int,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        return handle_load_history_record(analysis_id, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.delete("/api/history/{analysis_id}")
async def api_delete_history(
    analysis_id: int,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    existing = get_analysis_by_id(analysis_id, owner_id=owner_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    res_id = existing.get("resumeId")
    delete_analysis_record(analysis_id, owner_id=owner_id)
    return {"dashboard": get_dashboard_metrics(res_id, owner_id=owner_id)}


# ---- CareerMatch AI Authentication & Modules ----

@app.post("/api/auth/register")
async def api_auth_register(request: Request) -> Dict[str, Any]:
    client_ip = request.client.host if request.client and request.client.host else "unknown"
    allowed, retry = rate_limiter.is_allowed(f"auth_reg_{client_ip}", max_requests=5, window_seconds=3600)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many registration attempts. Please try again later.")

    try:
        body = await request.json()
        return register_user(body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/auth/login")
async def api_auth_login(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    client_ip = request.client.host if request.client and request.client.host else "unknown"
    allowed, retry = rate_limiter.is_allowed(f"auth_login_{client_ip}", max_requests=5, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many login attempts. Please try again in {retry} seconds.")

    try:
        body = await request.json()
        login_res = login_user(body, client_ip=client_ip)
        # Attach current browser's guest data to the user account on sign-in
        guest_id, _ = owner_info
        if guest_id and guest_id.startswith("guest_"):
            user_id = login_res.get("user", {}).get("id")
            if user_id:
                claim_guest_data(guest_id, user_id)
        return login_res
    except PermissionError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@app.post("/api/profile/import")
async def api_profile_import(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, is_auth = owner_info
    if not is_auth:
        raise HTTPException(status_code=401, detail="Authentication required.")
    try:
        body = await request.json()
        return import_student_profile(owner_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/profile")
async def api_get_profile(owner_info: Tuple[str, bool] = Depends(get_owner)) -> Dict[str, Any]:
    owner_id, is_auth = owner_info
    return {"profile": get_student_profile(owner_id) if is_auth else None}


@app.put("/api/profile")
async def api_update_profile(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, is_auth = owner_info
    try:
        body = await request.json()
        return {"profile": update_student_profile(body, owner_id if is_auth else "guest")}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/profile/export")
async def api_profile_export(
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Response:
    """Export complete user data payload for data portability under DPDP Act & GDPR."""
    owner_id, is_auth = owner_info
    data = export_owner_records(owner_id, is_authenticated=is_auth)
    content = json.dumps(data, indent=2, ensure_ascii=False)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"careermatch_data_export_{timestamp}.json"
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )


@app.delete("/api/profile/delete")
async def api_profile_delete(
    response: Response,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    """Permanently delete all user records from database (Right to Erasure)."""
    owner_id, is_auth = owner_info
    result = delete_owner_records(owner_id, is_authenticated=is_auth)
    response.delete_cookie(key="cm_sid", path="/")
    return result


@app.post("/api/auth/logout")
async def api_auth_logout(response: Response) -> Dict[str, Any]:
    """Clear session cookies and authenticate status."""
    response.delete_cookie(key="cm_sid", path="/")
    return {"status": "ok", "message": "Signed out successfully."}


@app.post("/api/jobs/market")
async def api_jobs_market(request: Request) -> Dict[str, Any]:
    try:
        body = await request.json()
        return fetch_job_market_intelligence(body)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/interview/start")
async def api_interview_start(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return start_interview_session(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/interview/answer")
async def api_interview_answer(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return submit_interview_answer(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/interview/history")
async def api_interview_history(
    resumeId: Optional[str] = None,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    return get_interview_history(resumeId, owner_id=owner_id)


@app.post("/api/ats/evaluate")
async def api_ats_evaluate(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return evaluate_ats_resume(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/github/analyze")
async def api_github_analyze(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        result = analyze_github_portfolio(body, owner_id=owner_id)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/roadmap/adaptive")
async def api_roadmap_adaptive(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return get_adaptive_roadmap(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/roadmap/task")
async def api_roadmap_task(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return toggle_learning_task(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/api/roadmap/quiz")
async def api_roadmap_quiz(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return submit_roadmap_stage_quiz(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/api/assessment/generate")
async def api_assessment_generate(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return generate_skill_assessment(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/assessment/submit")
async def api_assessment_submit(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return submit_skill_assessment(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/assessment/hint")
async def api_assessment_hint(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    """Provide on-demand tiered hint with score penalty."""
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return get_assessment_hint(body, owner_id=owner_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/assessment/history")
async def api_assessment_history(
    resumeId: Optional[str] = None,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    return get_assessment_history(resumeId, owner_id=owner_id)


@app.post("/api/career/compare")
async def api_career_compare(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return compare_career_paths(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/readiness/index")
async def api_readiness_index(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Dict[str, Any]:
    owner_id, _ = owner_info
    try:
        body = await request.json()
        return compute_placement_readiness_index(body, owner_id=owner_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/ai/usage")
async def api_ai_usage(owner_info: Tuple[str, bool] = Depends(get_owner)) -> Dict[str, Any]:
    owner_id, is_auth = owner_info
    return get_ai_usage(owner_id, is_auth)


@app.post("/api/ai/ask")
async def api_ai_ask(
    request: Request,
    owner_info: Tuple[str, bool] = Depends(get_owner),
) -> Any:
    owner_id, is_auth = owner_info
    try:
        body = await request.json()
    except Exception:
        body = {}
    res, code = handle_ask_ai_payload(body, owner_id, is_auth)
    return JSONResponse(res, status_code=code)


# Mount static frontend assets
if os.path.isdir(FRONTEND_DIR):
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.isdir(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.isdir(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
@app.head("/")
@app.get("/index.html")
@app.head("/index.html")
async def serve_index() -> Any:
    frontend_html = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(frontend_html):
        return FileResponse(frontend_html)
    return FileResponse(os.path.join(ROOT_DIR, "index.html"))


@app.get("/favicon.ico")
@app.head("/favicon.ico")
async def serve_favicon() -> Any:
    fav_path = os.path.join(FRONTEND_DIR, "assets", "favicon.svg")
    if os.path.isfile(fav_path):
        return FileResponse(fav_path, media_type="image/svg+xml")
    return Response(status_code=204)


def run_server() -> None:
    port = int(os.environ.get("PORT", str(DEFAULT_PORT)))
    host = os.environ.get("HOST", "0.0.0.0" if "PORT" in os.environ else "127.0.0.1")
    import uvicorn  # type: ignore

    print(f"Starting CareerMatch AI (FastAPI/Uvicorn) on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, log_level="info")


if __name__ == "__main__":
    run_server()
