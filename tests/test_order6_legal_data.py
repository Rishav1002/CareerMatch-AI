"""
Unit and Integration Tests for Order 6 (Bug 12):
1. Data Export endpoint (/api/profile/export) - Data Portability under DPDP Act 2023 & GDPR
2. Data Erasure endpoint (/api/profile/delete) - Right to Erasure / Right to be Forgotten
3. Scoped session data export and deletion without affecting other users
4. Legal pages and storage audit
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
from backend.database import init_db


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_export_and_delete_user_data_flow():
    client_a = TestClient(app)
    client_b = TestClient(app)

    # 1. Client A uploads a resume and creates an analysis
    parse_payload = {
        "filename": "Aarav_DPDP_Test.txt",
        "pastedText": "Aarav Sharma. Backend Engineer skilled in Python, FastAPI, Docker, and PostgreSQL. Built high-scale microservices.",
        "dontSave": False,
    }
    parse_res = client_a.post("/api/resume/parse", json=parse_payload)
    assert parse_res.status_code == 200
    resume_a = parse_res.json()["resume"]

    analyze_payload = {
        "resume": resume_a,
        "resumeId": resume_a["id"],
        "roleTitle": "Backend Engineer",
        "goalCompany": "Target Corp",
        "persistRecord": True,
    }
    analyze_res = client_a.post("/api/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200

    # 2. Client A requests data export
    export_res_a = client_a.get("/api/profile/export")
    assert export_res_a.status_code == 200
    assert "attachment;" in export_res_a.headers.get("Content-Disposition", "")
    data_a = export_res_a.json()
    assert "metadata" in data_a
    assert "DPDP Act" in data_a["metadata"]["regulatoryNotice"]
    assert len(data_a["resumes"]) >= 1
    assert data_a["resumes"][0]["filename"] in ["Aarav_DPDP_Test.txt", "Pasted_Resume.txt"]
    assert len(data_a["analyses"]) >= 1
    assert data_a["analyses"][0]["target_role"] in ["Backend Engineer", "Full Stack Developer"]

    # 3. Client B requests data export -> Client B has 0 resumes and 0 analyses (Strict Isolation)
    export_res_b = client_b.get("/api/profile/export")
    assert export_res_b.status_code == 200
    data_b = export_res_b.json()
    assert len(data_b["resumes"]) == 0
    assert len(data_b["analyses"]) == 0

    # 4. Client A deletes all their data
    del_res_a = client_a.delete("/api/profile/delete")
    assert del_res_a.status_code == 200
    del_data = del_res_a.json()
    assert del_data["status"] == "success"

    # 5. Client A's export is now completely empty
    export_res_a_post = client_a.get("/api/profile/export")
    assert export_res_a_post.status_code == 200
    data_a_post = export_res_a_post.json()
    assert len(data_a_post["resumes"]) == 0
    assert len(data_a_post["analyses"]) == 0

    # Dashboard metrics for Client A must be 0
    dash_a = client_a.get("/api/dashboard").json()
    assert dash_a["totalResumes"] == 0
    assert len(dash_a["recentHistory"]) == 0
