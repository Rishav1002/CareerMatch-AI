"""
Backend Server for CareerMatch AI.
Provides REST APIs for:
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
import json
import mimetypes
import os
import traceback
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

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
    get_assessment_history,
    get_interview_history,
    get_student_profile,
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
from backend.config import PORT as DEFAULT_PORT, ROOT_DIR
from backend.roles_catalog import get_roles_catalog, get_roles_by_category
from backend.database import (
    check_and_increment_ai_usage,
    get_ai_usage,
    get_connection,
    delete_analysis_record,
    get_analysis_by_id,
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
from backend.resume_parser import (
    extract_text_from_file_bytes,
    parse_resume_text_to_profile,
    sanitize_plain_text,
    sanitize_short_field,
)

FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")


def seed_initial_sqlite_data() -> None:
    """Initialize relational tables and seed demo resumes and demo student profile."""
    init_db()
    seed_demo_user_and_profile()
    metrics = get_dashboard_metrics()
    if metrics["totalResumes"] == 0:
        for demo in SAMPLE_RESUMES:
            save_resume(demo)


# Initialize database on module load
seed_initial_sqlite_data()


# ============================================================================
# CORE CONTROLLER LOGIC (Shared by FastAPI routes & Fallback Runner)
# ============================================================================

def handle_health_check() -> tuple[Dict[str, Any], int]:
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
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
        "engine": engine,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }, status_code


def handle_ask_ai_payload(body: Dict[str, Any], user_id: str, is_auth: bool) -> tuple[Dict[str, Any], int]:
    question = sanitize_plain_text(body.get("question", ""), 1000).strip()
    if not question:
        return {"detail": "Question text is required."}, 400

    allowed, remaining, limit, reset_at = check_and_increment_ai_usage(user_id, is_auth)
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

def handle_bootstrap(user_id: Optional[str] = None) -> Dict[str, Any]:
    student_profile = get_student_profile(user_id) if user_id else None
    active_resume_id = student_profile.get("activeResumeId") if student_profile else None

    return {
        "dashboard": get_dashboard_metrics(active_resume_id),
        "roles": ROLE_TEMPLATES,
        "demos": [],
        "defaultWeights": DEFAULT_WEIGHTS,
        "defaultPriWeights": DEFAULT_PRI_WEIGHTS,
        "sampleJdText": "",
        "studentProfile": student_profile,
    }


def handle_parse_resume_payload(body: Dict[str, Any]) -> Dict[str, Any]:
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
        save_resume(profile)
    return {
        "resume": profile,
        "source": profile.get("extractionSource", "template"),
        "saved": not dont_save,
        "dashboard": get_dashboard_metrics(profile["id"] if not dont_save else None),
    }


def handle_analyze_payload(body: Dict[str, Any]) -> Dict[str, Any]:
    resume = body.get("resume")
    resume_id = body.get("resumeId")
    dont_save = bool(body.get("dontSave", False))

    if not resume and resume_id:
        resume = get_resume_by_id(str(resume_id))

    if not resume or not isinstance(resume, dict):
        raise ValueError("Candidate resume profile is required for analysis.")

    if not dont_save:
        save_resume(resume)

    role_title = sanitize_short_field(body.get("roleTitle", "Full Stack Developer"), 100)
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

    role_comparisons: List[Dict[str, Any]] = []
    for tpl in ROLE_TEMPLATES:
        r_match = match_resume_to_job(resume, tpl, weights)
        role_comparisons.append(
            {
                "id": tpl["id"],
                "title": tpl["title"],
                "overallScore": r_match["overallScore"],
                "mandatorySatisfiedPct": r_match["mandatorySatisfiedPct"],
                "missingCount": len(r_match["missingSkills"]) + len(r_match["partialSkills"]),
            }
        )

    intelligence = generate_career_intelligence(
        resume=resume,
        target_role=active_job["title"],
        goal_company=active_job["companyName"],
        missing_skills=[g["skillName"] for g in skill_gaps],
        custom_focus=custom_focus,
    )

    ats_report = evaluate_ats_resume(
        {
            "resume": resume,
            "targetRole": active_job["title"],
            "goalCompany": active_job["companyName"],
            "customJdText": custom_jd,
        }
    )

    analysis_id = None
    if persist_record:
        analysis_id = save_analysis_record(
            resume_id=resume["id"],
            candidate_name=resume["contact"]["name"],
            target_role=active_job["title"],
            goal_company=active_job["companyName"],
            match_result=match_result,
            skill_gaps=skill_gaps,
            roadmap=intelligence["stages"],
            advisor=intelligence["advisor"],
            projects=intelligence["projects"],
            improvements=intelligence["improvements"],
            ats_score=float(ats_report.get("atsScore", 0.0)),
            ats_report=ats_report,
        )

    completed_nodes = get_roadmap_progress(resume["id"], active_job["title"]) if not dont_save else {}

    return {
        "analysisId": analysis_id,
        "saved": not dont_save,
        "source": intelligence.get("source", "template"),
        "aiError": intelligence.get("aiError"),
        "resume": resume,
        "activeJob": active_job,
        "matchResult": match_result,
        "skillGaps": skill_gaps,
        "roadmapNodes": roadmap_nodes,
        "completedNodes": completed_nodes,
        "stages": intelligence["stages"],
        "advisor": intelligence["advisor"],
        "projects": intelligence["projects"],
        "improvements": intelligence["improvements"],
        "atsReport": ats_report,
        "roleComparisons": role_comparisons,
        "dashboard": get_dashboard_metrics(resume["id"] if not dont_save else None),
    }


def handle_load_history_record(analysis_id: int) -> Dict[str, Any]:
    """Reload a saved analysis record from SQLite by its ID."""
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise ValueError("Saved analysis record not found in database.")

    resume = get_resume_by_id(record["resumeId"]) or SAMPLE_RESUMES[0]
    active_job = resolve_job_profile(record["targetRole"], record["goalCompany"])
    match_result = match_resume_to_job(resume, active_job, DEFAULT_WEIGHTS)
    skill_gaps = record["skillGaps"] or build_skill_gaps(match_result, active_job["title"])
    roadmap_nodes = build_roadmap_tree_nodes(match_result, skill_gaps)
    completed_nodes = get_roadmap_progress(resume["id"], active_job["title"])

    role_comparisons: List[Dict[str, Any]] = []
    for tpl in ROLE_TEMPLATES:
        r_match = match_resume_to_job(resume, tpl, DEFAULT_WEIGHTS)
        role_comparisons.append(
            {
                "id": tpl["id"],
                "title": tpl["title"],
                "overallScore": r_match["overallScore"],
                "mandatorySatisfiedPct": r_match["mandatorySatisfiedPct"],
                "missingCount": len(r_match["missingSkills"]) + len(r_match["partialSkills"]),
            }
        )

    return {
        "analysisId": record["id"],
        "source": "sqlite_history",
        "aiError": None,
        "resume": resume,
        "activeJob": active_job,
        "matchResult": match_result,
        "skillGaps": skill_gaps,
        "roadmapNodes": roadmap_nodes,
        "completedNodes": completed_nodes,
        "stages": record["stages"],
        "advisor": record["advisor"],
        "projects": record["projects"],
        "improvements": record["improvements"],
        "roleComparisons": role_comparisons,
        "dashboard": get_dashboard_metrics(resume["id"]),
    }


def handle_update_roadmap_progress_payload(body: Dict[str, Any]) -> Dict[str, Any]:
    """Save roadmap node completion checkboxes to SQLite."""
    resume_id = sanitize_short_field(body.get("resumeId", ""), 80)
    target_role = sanitize_short_field(body.get("targetRole", ""), 100)
    completed = body.get("completedNodes", {})
    if not resume_id or not target_role or not isinstance(completed, dict):
        raise ValueError("resumeId, targetRole, and completedNodes dict are required.")
    clean_map = {sanitize_short_field(k, 80): bool(v) for k, v in list(completed.items())[:100]}
    saved = save_roadmap_progress(resume_id, target_role, clean_map)
    return {"completedNodes": saved}


def handle_update_skills_payload(body: Dict[str, Any]) -> Dict[str, Any]:
    resume_id = sanitize_short_field(body.get("resumeId", ""), 80)
    raw_skills = body.get("skills", [])
    if not isinstance(raw_skills, list):
        raise ValueError("skills must be a list of strings.")

    clean_skills: List[str] = []
    for s in raw_skills[:50]:
        cs = sanitize_short_field(s, 60)
        if cs and cs not in clean_skills:
            clean_skills.append(cs)

    updated = update_resume_skills(resume_id, clean_skills)
    if not updated:
        raise ValueError("Resume profile not found in database.")
    return {"resume": updated}


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
# FASTAPI APPLICATION DEFINITION
# ============================================================================
try:
    from fastapi import FastAPI, File, HTTPException, Request, UploadFile  # type: ignore
    from fastapi.middleware.cors import CORSMiddleware  # type: ignore
    from fastapi.responses import FileResponse, JSONResponse  # type: ignore
    from fastapi.staticfiles import StaticFiles  # type: ignore

    app = FastAPI(
        title="CareerMatch AI API",
        description="Unified AI Career Intelligence, Skill Development & Placement Readiness Platform",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next: Any) -> Any:
        if request.url.path.startswith("/api/"):
            auth_hdr = request.headers.get("Authorization")
            if auth_hdr and auth_hdr.strip():
                try:
                    _extract_user_id_from_auth_header(auth_hdr)
                except PermissionError as exc:
                    return JSONResponse({"detail": str(exc)}, status_code=401)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response

    @app.get("/api/health")
    async def api_health() -> Any:
        res, code = handle_health_check()
        return JSONResponse(res, status_code=code)

    @app.get("/api/roles")
    async def api_roles() -> Dict[str, Any]:
        return {"roles": get_roles_catalog(), "categories": get_roles_by_category()}

    @app.get("/api/ai/usage")
    async def api_ai_usage(request: Request) -> Dict[str, Any]:
        uid = None
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr:
            try:
                uid = _extract_user_id_from_auth_header(auth_hdr)
            except Exception:
                uid = None
        return get_ai_usage(uid or "guest", bool(uid))

    @app.post("/api/ai/ask")
    async def api_ai_ask(request: Request) -> Any:
        uid = None
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr:
            try:
                uid = _extract_user_id_from_auth_header(auth_hdr)
            except Exception:
                uid = None
        try:
            body = await request.json()
        except Exception:
            body = {}
        res, code = handle_ask_ai_payload(body, uid or "guest", bool(uid))
        return JSONResponse(res, status_code=code)

    @app.get("/api/bootstrap")
    async def api_bootstrap(request: Request) -> Dict[str, Any]:
        try:
            uid = _extract_user_id_from_auth_header(request.headers.get("Authorization"))
            return handle_bootstrap(uid)
        except PermissionError as exc:
            raise HTTPException(status_code=401, detail=str(exc))

    @app.get("/api/dashboard")
    async def api_dashboard(resumeId: Optional[str] = None) -> Dict[str, Any]:
        return get_dashboard_metrics(resumeId)

    @app.post("/api/resume/parse")
    async def api_parse_resume(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return handle_parse_resume_payload(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to parse resume: {exc}")

    @app.post("/api/resume/upload")
    async def api_upload_multipart(file: UploadFile = File(...)) -> Dict[str, Any]:
        try:
            file_bytes = await file.read()
            text = extract_text_from_file_bytes(file.filename or "resume.pdf", file_bytes)
            profile = parse_resume_text_to_profile(text, file.filename or "resume.pdf")
            save_resume(profile)
            return {"resume": profile, "dashboard": get_dashboard_metrics(profile["id"])}
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/analyze")
    async def api_analyze(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return handle_analyze_payload(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    @app.put("/api/resume/skills")
    async def api_update_skills(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return handle_update_skills_payload(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.put("/api/roadmap/progress")
    async def api_update_roadmap_progress(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return handle_update_roadmap_progress_payload(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.get("/api/history/{analysis_id}")
    async def api_get_history(analysis_id: int) -> Dict[str, Any]:
        try:
            return handle_load_history_record(analysis_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc))

    @app.delete("/api/history/{analysis_id}")
    async def api_delete_history(analysis_id: int) -> Dict[str, Any]:
        existing = get_analysis_by_id(analysis_id)
        res_id = existing["resumeId"] if existing else None
        delete_analysis_record(analysis_id)
        return {"dashboard": get_dashboard_metrics(res_id)}

    # ---- CareerMatch AI Endpoints ----

    @app.post("/api/auth/register")
    async def api_auth_register(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return register_user(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/auth/login")
    async def api_auth_login(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return login_user(body)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail=str(exc))

    @app.post("/api/auth/demo")
    async def api_auth_demo() -> Dict[str, Any]:
        return login_demo_user()

    @app.get("/api/profile")
    async def api_get_profile(request: Request) -> Dict[str, Any]:
        try:
            uid = _extract_user_id_from_auth_header(request.headers.get("Authorization"))
            return {"profile": get_student_profile(uid) if uid else None}
        except PermissionError as exc:
            raise HTTPException(status_code=401, detail=str(exc))

    @app.put("/api/profile")
    async def api_update_profile(request: Request) -> Dict[str, Any]:
        try:
            uid = _extract_user_id_from_auth_header(request.headers.get("Authorization"))
            body = await request.json()
            return {"profile": update_student_profile(body, uid or "user-demo-aarav")}
        except PermissionError as exc:
            raise HTTPException(status_code=401, detail=str(exc))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/jobs/market")
    async def api_jobs_market(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return fetch_job_market_intelligence(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/interview/start")
    async def api_interview_start(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return start_interview_session(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/interview/answer")
    async def api_interview_answer(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return submit_interview_answer(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.get("/api/interview/history")
    async def api_interview_history(resumeId: Optional[str] = None) -> Dict[str, Any]:
        return get_interview_history(resumeId)

    @app.post("/api/ats/evaluate")
    async def api_ats_evaluate(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return evaluate_ats_resume(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/github/analyze")
    async def api_github_analyze(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            result = analyze_github_portfolio(body)
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result["error"])
            return result
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/roadmap/adaptive")
    async def api_roadmap_adaptive(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return get_adaptive_roadmap(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/roadmap/task")
    async def api_roadmap_task(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return toggle_learning_task(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/roadmap/quiz")
    async def api_roadmap_quiz(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return submit_roadmap_stage_quiz(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/assessment/generate")
    async def api_assessment_generate(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return generate_skill_assessment(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/assessment/submit")
    async def api_assessment_submit(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return submit_skill_assessment(body)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.get("/api/assessment/history")
    async def api_assessment_history(resumeId: Optional[str] = None) -> Dict[str, Any]:
        return get_assessment_history(resumeId)

    @app.post("/api/career/compare")
    async def api_career_compare(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return compare_career_paths(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app.post("/api/readiness/index")
    async def api_readiness_index(request: Request) -> Dict[str, Any]:
        try:
            body = await request.json()
            return compute_placement_readiness_index(body)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    # Mount static frontend assets
    if os.path.isdir(FRONTEND_DIR):
        app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

    @app.get("/")
    @app.get("/index.html")
    async def serve_index() -> Any:
        frontend_html = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(frontend_html):
            return FileResponse(frontend_html)
        return FileResponse(os.path.join(ROOT_DIR, "index.html"))

except ImportError:
    app = None


# ============================================================================
# BUILT-IN PYTHON SERVER RUNNER (Fallback HTTP Server)
# ============================================================================

class CareerMatchHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_json(self, payload: Any, status: int = 200) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, private")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json_body(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8", errors="ignore")
        return json.loads(raw) if raw else {}

    def do_OPTIONS(self) -> None:
        self._send_json({"ok": True}, 200)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path.startswith("/api/"):
            auth_hdr = self.headers.get("Authorization")
            if auth_hdr and auth_hdr.strip():
                try:
                    _extract_user_id_from_auth_header(auth_hdr)
                except PermissionError as exc:
                    self._send_json({"detail": str(exc)}, 401)
                    return

        if path == "/api/health":
            res, code = handle_health_check()
            self._send_json(res, code)
            return
        if path == "/api/roles":
            self._send_json({"roles": get_roles_catalog(), "categories": get_roles_by_category()})
            return
        if path == "/api/ai/usage":
            uid = None
            auth_hdr = self.headers.get("Authorization")
            if auth_hdr:
                try:
                    uid = _extract_user_id_from_auth_header(auth_hdr)
                except Exception:
                    uid = None
            self._send_json(get_ai_usage(uid or "guest", bool(uid)))
            return
        if path == "/api/bootstrap":
            try:
                uid = _extract_user_id_from_auth_header(self.headers.get("Authorization"))
                self._send_json(handle_bootstrap(uid))
            except PermissionError as exc:
                self._send_json({"detail": str(exc)}, 401)
            return
        if path == "/api/dashboard":
            res_id = (qs.get("resumeId") or [None])[0]
            self._send_json(get_dashboard_metrics(res_id))
            return
        if path == "/api/profile":
            try:
                uid = _extract_user_id_from_auth_header(self.headers.get("Authorization"))
                self._send_json({"profile": get_student_profile(uid) if uid else None})
            except PermissionError as exc:
                self._send_json({"detail": str(exc)}, 401)
            return
        if path == "/api/interview/history":
            res_id = (qs.get("resumeId") or [None])[0]
            self._send_json(get_interview_history(res_id))
            return
        if path == "/api/assessment/history":
            res_id = (qs.get("resumeId") or [None])[0]
            self._send_json(get_assessment_history(res_id))
            return
        if path.startswith("/api/history/"):
            try:
                part = path.split("/api/history/", 1)[1]
                analysis_id = int(part)
                self._send_json(handle_load_history_record(analysis_id))
            except Exception as exc:
                self._send_json({"detail": str(exc)}, 404)
            return

        if path in ("/", "/index.html"):
            target = os.path.join(FRONTEND_DIR, "index.html")
            if not os.path.isfile(target):
                target = os.path.join(ROOT_DIR, "index.html")
            self._serve_file(target)
            return

        rel_path = path.lstrip("/")
        candidate_paths = [
            os.path.join(ROOT_DIR, rel_path),
            os.path.join(FRONTEND_DIR, rel_path),
        ]
        for cpath in candidate_paths:
            real_c = os.path.realpath(cpath)
            if real_c.startswith(ROOT_DIR) and os.path.isfile(real_c):
                self._serve_file(real_c)
                return

        self._send_json({"detail": "Not found"}, 404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        try:
            if path.startswith("/api/"):
                auth_hdr = self.headers.get("Authorization")
                if auth_hdr and auth_hdr.strip():
                    _extract_user_id_from_auth_header(auth_hdr)
                body = self._read_json_body()
            if path == "/api/resume/parse":
                self._send_json(handle_parse_resume_payload(body))
                return
            if path == "/api/analyze":
                self._send_json(handle_analyze_payload(body))
                return
            if path == "/api/ai/ask":
                uid = None
                auth_hdr = self.headers.get("Authorization")
                if auth_hdr:
                    try:
                        uid = _extract_user_id_from_auth_header(auth_hdr)
                    except Exception:
                        uid = None
                body = self._read_json_body()
                res, code = handle_ask_ai_payload(body, uid or "guest", bool(uid))
                self._send_json(res, code)
                return
            if path == "/api/auth/register":
                self._send_json(register_user(body))
                return
            if path == "/api/auth/login":
                self._send_json(login_user(body))
                return
            if path == "/api/auth/demo":
                self._send_json(login_demo_user())
                return
            if path == "/api/jobs/market":
                self._send_json(fetch_job_market_intelligence(body))
                return
            if path == "/api/interview/start":
                self._send_json(start_interview_session(body))
                return
            if path == "/api/interview/answer":
                self._send_json(submit_interview_answer(body))
                return
            if path == "/api/ats/evaluate":
                self._send_json(evaluate_ats_resume(body))
                return
            if path == "/api/github/analyze":
                self._send_json(analyze_github_portfolio(body))
                return
            if path == "/api/roadmap/adaptive":
                self._send_json(get_adaptive_roadmap(body))
                return
            if path == "/api/roadmap/task":
                self._send_json(toggle_learning_task(body))
                return
            if path == "/api/roadmap/quiz":
                self._send_json(submit_roadmap_stage_quiz(body))
                return
            if path == "/api/assessment/generate":
                self._send_json(generate_skill_assessment(body))
                return
            if path == "/api/assessment/submit":
                self._send_json(submit_skill_assessment(body))
                return
            if path == "/api/career/compare":
                self._send_json(compare_career_paths(body))
                return
            if path == "/api/readiness/index":
                self._send_json(compute_placement_readiness_index(body))
                return
            self._send_json({"detail": "Endpoint not found"}, 404)
        except PermissionError as exc:
            self._send_json({"detail": str(exc)}, 401)
        except ValueError as exc:
            self._send_json({"detail": str(exc)}, 400)
        except Exception as exc:
            traceback.print_exc()
            self._send_json({"detail": f"Server error: {exc}"}, 500)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        try:
            uid = _extract_user_id_from_auth_header(self.headers.get("Authorization"))
            body = self._read_json_body()
            if parsed.path == "/api/resume/skills":
                self._send_json(handle_update_skills_payload(body))
                return
            if parsed.path == "/api/roadmap/progress":
                self._send_json(handle_update_roadmap_progress_payload(body))
                return
            if parsed.path == "/api/profile":
                self._send_json({"profile": update_student_profile(body, uid or "user-demo-aarav")})
                return
            self._send_json({"detail": "Not found"}, 404)
        except PermissionError as exc:
            self._send_json({"detail": str(exc)}, 401)
        except ValueError as exc:
            self._send_json({"detail": str(exc)}, 400)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/history/"):
            try:
                part = parsed.path.split("/api/history/", 1)[1]
                analysis_id = int(part)
                existing = get_analysis_by_id(analysis_id)
                res_id = existing["resumeId"] if existing else None
                delete_analysis_record(analysis_id)
                self._send_json({"dashboard": get_dashboard_metrics(res_id)})
            except Exception as exc:
                self._send_json({"detail": str(exc)}, 400)
            return
        self._send_json({"detail": "Not found"}, 404)

    def _serve_file(self, filepath: str) -> None:
        try:
            with open(filepath, "rb") as f:
                data = f.read()
            ctype, _ = mimetypes.guess_type(filepath)
            self.send_response(200)
            self.send_header("Content-Type", ctype or "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
            self.end_headers()
            self.wfile.write(data)
        except Exception:
            self._send_json({"detail": "File not found"}, 404)


def run_server() -> None:
    port = int(os.environ.get("PORT", str(DEFAULT_PORT)))
    host = os.environ.get("HOST", "0.0.0.0" if "PORT" in os.environ else "127.0.0.1")
    try:
        import uvicorn  # type: ignore
        if app is not None:
            print(f"Starting CareerMatch AI (FastAPI/Uvicorn) on http://{host}:{port}")
            uvicorn.run("backend.main:app", host=host, port=port, log_level="info")
            return
    except ImportError:
        pass

    print(f"Starting CareerMatch AI Server on http://{host}:{port}")
    server = ThreadingHTTPServer((host, port), CareerMatchHTTPHandler)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
