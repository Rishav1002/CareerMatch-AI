"""
Regression Test Suite for Bug 9: Cross-User and Guest Data Isolation.
Validates:
1. Two independent guest sessions A and B have separate, zero-leaking dashboards.
2. Session B cannot view (GET) or delete (DELETE) Session A's analysis (returns 404).
3. Sequential ID enumeration 1..N returns 404 for unowned IDs.
4. Legacy unowned rows ('legacy_unowned') are never served to any user.
5. Two independent authenticated accounts are isolated identically.
6. Signing in with active cm_sid claims and transfers the guest session's data.
7. Interview and Assessment history are strictly scoped to the verified owner.
"""

import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
from backend.database import get_connection, init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_two_guest_sessions_isolated_dashboards():
    client_a = TestClient(app)
    client_b = TestClient(app)

    # Session A: establish session and verify initial 0 counts
    dash_a_initial = client_a.get("/api/dashboard").json()
    assert dash_a_initial["totalResumes"] == 0
    assert dash_a_initial["totalJobsCompared"] == 0
    assert len(dash_a_initial["recentHistory"]) == 0

    # Session A uploads a resume and runs analysis
    parse_payload = {
        "filename": "Aarav_Resume.txt",
        "pastedText": "Aarav Sharma. Software Engineer with skills in Python, FastAPI, Docker, and PostgreSQL. Built scalable distributed microservices.",
        "dontSave": False,
    }
    parse_res = client_a.post("/api/resume/parse", json=parse_payload)
    assert parse_res.status_code == 200
    res_data = parse_res.json()
    resume_a = res_data["resume"]
    resume_id_a = resume_a["id"]

    analyze_payload = {
        "resume": resume_a,
        "resumeId": resume_id_a,
        "roleTitle": "Backend Engineer",
        "goalCompany": "Target Corp",
        "persistRecord": True,
    }
    analyze_res = client_a.post("/api/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200
    analysis_id_a = analyze_res.json()["analysisId"]
    assert analysis_id_a > 0

    # Session A dashboard now shows 1 resume, 1 analysis
    dash_a = client_a.get("/api/dashboard").json()
    assert dash_a["totalResumes"] == 1
    assert dash_a["totalJobsCompared"] == 1
    assert len(dash_a["recentHistory"]) == 1
    assert dash_a["recentHistory"][0]["id"] == analysis_id_a

    # Session B (independent browser) checks dashboard -> MUST BE ZERO / EMPTY!
    dash_b = client_b.get("/api/dashboard").json()
    assert dash_b["totalResumes"] == 0
    assert dash_b["totalJobsCompared"] == 0
    assert len(dash_b["recentHistory"]) == 0

    # Session B attempts to read Session A's analysis -> MUST GET 404!
    get_res = client_b.get(f"/api/history/{analysis_id_a}")
    assert get_res.status_code == 404

    # Session B attempts to delete Session A's analysis -> MUST GET 404!
    del_res = client_b.delete(f"/api/history/{analysis_id_a}")
    assert del_res.status_code == 404

    # Session A's data remains completely intact!
    get_res_a = client_a.get(f"/api/history/{analysis_id_a}")
    assert get_res_a.status_code == 200
    assert get_res_a.json()["id"] == analysis_id_a


def test_sequential_id_enumeration_returns_404():
    client = TestClient(app)
    # Guessing IDs 1 to 25 on an unowned session must return 404, not 403 or 200
    for test_id in range(1, 26):
        res = client.get(f"/api/history/{test_id}")
        assert res.status_code == 404


def test_legacy_unowned_records_never_served():
    conn = get_connection()
    cursor = conn.cursor()
    test_resume_id = f"test-legacy-{uuid.uuid4().hex[:8]}"

    # Insert a legacy unowned row
    cursor.execute(
        """
        INSERT INTO resumes (id, owner_id, user_id, candidate_name, email, filename, raw_text, education_json, skills_json, projects_json, experience_json, certifications_json, soft_skills_json, skill_evidence_json, created_at)
        VALUES (?, 'legacy_unowned', 'guest', 'Legacy Demo', 'legacy@test.com', 'test.txt', 'raw text', '[]', '["Python"]', '[]', '[]', '[]', '[]', '{}', '2025-01-01 00:00 UTC')
        """,
        (test_resume_id,)
    )
    cursor.execute(
        """
        INSERT INTO analyses (owner_id, resume_id, candidate_name, target_role, goal_company, overall_score, technical_score, projects_score, education_score, certifications_score, soft_skills_score, mandatory_met_pct, preferred_met_pct, matched_skills_json, partial_skills_json, missing_skills_json, skill_gaps_json, roadmap_json, courses_json, projects_rec_json, resume_improvements_json, created_at)
        VALUES ('legacy_unowned', ?, 'Legacy Demo', 'Full Stack Developer', 'Company', 85.0, 80.0, 80.0, 90.0, 70.0, 80.0, 90.0, 80.0, '[]', '[]', '[]', '[]', '[]', '{}', '[]', '{}', '2025-01-01 00:00 UTC')
        """,
        (test_resume_id,)
    )
    legacy_analysis_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Any new visitor querying dashboard or history must never see this record
    client = TestClient(app)
    dash = client.get("/api/dashboard").json()
    assert dash["totalResumes"] == 0
    assert dash["totalJobsCompared"] == 0
    for h in dash["recentHistory"]:
        assert h["id"] != legacy_analysis_id

    res = client.get(f"/api/history/{legacy_analysis_id}")
    assert res.status_code == 404


def test_two_authenticated_users_are_isolated():
    client_u1 = TestClient(app)
    client_u2 = TestClient(app)

    email1 = f"user1_{uuid.uuid4().hex[:6]}@example.com"
    email2 = f"user2_{uuid.uuid4().hex[:6]}@example.com"

    r1 = client_u1.post("/api/auth/register", json={"fullName": "User One", "email": email1, "password": "Password123!"})
    assert r1.status_code == 200
    token1 = r1.json()["token"]

    r2 = client_u2.post("/api/auth/register", json={"fullName": "User Two", "email": email2, "password": "Password123!"})
    assert r2.status_code == 200
    token2 = r2.json()["token"]

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 1 parses resume and analyzes
    parse_payload = {
        "filename": "User1_Resume.txt",
        "pastedText": "User One. Full Stack Engineer. Skills in Python, React, PostgreSQL.",
        "dontSave": False,
    }
    parse_res = client_u1.post("/api/resume/parse", json=parse_payload, headers=headers1)
    assert parse_res.status_code == 200
    resume1 = parse_res.json()["resume"]

    analyze_res = client_u1.post(
        "/api/analyze",
        json={"resume": resume1, "resumeId": resume1["id"], "roleTitle": "Full Stack Developer", "persistRecord": True},
        headers=headers1
    )
    assert analyze_res.status_code == 200
    analysis1_id = analyze_res.json()["analysisId"]

    # User 1 dashboard shows 1 resume, 1 analysis
    dash1 = client_u1.get("/api/dashboard", headers=headers1).json()
    assert dash1["totalResumes"] == 1
    assert dash1["totalJobsCompared"] == 1

    # User 2 dashboard shows 0 resumes, 0 analyses
    dash2 = client_u2.get("/api/dashboard", headers=headers2).json()
    assert dash2["totalResumes"] == 0
    assert dash2["totalJobsCompared"] == 0

    # User 2 cannot access or delete User 1's record
    assert client_u2.get(f"/api/history/{analysis1_id}", headers=headers2).status_code == 404
    assert client_u2.delete(f"/api/history/{analysis1_id}", headers=headers2).status_code == 404


def test_login_attaches_guest_data():
    client = TestClient(app)

    # Guest user creates a resume and analysis
    parse_payload = {
        "filename": "Guest_Resume.txt",
        "pastedText": "Rishav Sharma. Student developer with skills in Python, SQL, Git.",
        "dontSave": False,
    }
    parse_res = client.post("/api/resume/parse", json=parse_payload)
    assert parse_res.status_code == 200
    resume = parse_res.json()["resume"]

    analyze_res = client.post(
        "/api/analyze",
        json={"resume": resume, "resumeId": resume["id"], "roleTitle": "Software Engineer", "persistRecord": True}
    )
    assert analyze_res.status_code == 200
    analysis_id = analyze_res.json()["analysisId"]

    # Now guest registers and logs in within the same browser session
    email = f"student_{uuid.uuid4().hex[:6]}@example.com"
    reg_res = client.post("/api/auth/register", json={"fullName": "Rishav Sharma", "email": email, "password": "Password123!"})
    assert reg_res.status_code == 200

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # The newly authenticated user now owns the analysis created during the guest session
    dash = client.get("/api/dashboard", headers=auth_headers).json()
    assert dash["totalResumes"] == 1
    assert dash["totalJobsCompared"] == 1
    assert dash["recentHistory"][0]["id"] == analysis_id

    # The user can read the analysis with their auth token
    get_res = client.get(f"/api/history/{analysis_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == analysis_id


def test_interview_and_assessment_isolation():
    client_a = TestClient(app)
    client_b = TestClient(app)

    # Session A starts an interview
    int_res = client_a.post("/api/interview/start", json={"targetRole": "Python Developer", "difficulty": "Entry Level"})
    assert int_res.status_code == 200
    session_id = int_res.json()["sessionId"]

    # Session A starts an assessment
    asmt_res = client_a.post("/api/assessment/generate", json={"topic": "Python Core", "difficulty": "Beginner"})
    assert asmt_res.status_code == 200

    # Session A has interview history
    hist_a = client_a.get("/api/interview/history").json()
    assert len(hist_a["sessions"]) >= 1
    assert hist_a["sessions"][0]["id"] == session_id

    # Session B (different guest) has zero interview history
    hist_b = client_b.get("/api/interview/history").json()
    assert len(hist_b["sessions"]) == 0

    # Session B cannot submit an answer to Session A's interview session
    ans_res = client_b.post("/api/interview/answer", json={"sessionId": session_id, "questionIndex": 1, "answerText": "My answer here"})
    assert ans_res.status_code == 404
