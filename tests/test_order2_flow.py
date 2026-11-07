"""
Test suite for Order 2: Bugs 1, 2, and 6.
Verifies:
- Bug 1 & 6: File validation (empty, oversized, unsupported extension) and parse without auto-analyze
- Bug 2: Hash link integrity & in-page anchor validation against 404s
"""

import base64
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from scripts.check_links import check_html_links, INDEX_PATH


@pytest.fixture
def client():
    return TestClient(app)


def test_resume_parse_validation_oversized(client):
    """Bug 1: Oversized resumes (> 5MB) must be rejected with 400 Bad Request."""
    fake_huge_content = b"A" * (6 * 1024 * 1024)
    b64 = "data:text/plain;base64," + base64.b64encode(fake_huge_content).decode("ascii")
    res = client.post("/api/resume/parse", json={"filename": "huge.txt", "base64Data": b64})
    assert res.status_code == 400
    assert "exceeds" in res.json().get("detail", "").lower() or "5 mb" in res.json().get("detail", "").lower()


def test_resume_parse_validation_empty_and_extension(client):
    """Bug 1: Empty or unsupported extension files must be rejected."""
    # Unsupported extension
    b64_exe = "data:application/octet-stream;base64," + base64.b64encode(b"MZ\x90\x00").decode("ascii")
    res = client.post("/api/resume/parse", json={"filename": "malware.exe", "base64Data": b64exe if 'b64exe' in locals() else b64_exe})
    assert res.status_code == 400

    # Empty payload
    res_empty = client.post("/api/resume/parse", json={"filename": "empty.txt", "pastedText": "   "})
    assert res_empty.status_code == 400


def test_resume_parse_does_not_auto_analyze(client):
    """Bug 6: Uploading or parsing a resume returns parsed metadata ONLY without invoking match analysis."""
    sample_text = (
        "Alex Kumar\nalex@example.com\nEducation: B.Tech Computer Science\n"
        "Technical Skills: Python, FastAPI, Docker, SQL, Git, Linux, PostgreSQL\n"
        "Projects: Built scalable REST API and microservices."
    )
    res = client.post("/api/resume/parse", json={"filename": "alex_resume.txt", "pastedText": sample_text, "dontSave": True})
    assert res.status_code == 200
    data = res.json()
    assert "resume" in data
    assert data["resume"]["contact"]["name"] == "Alex Kumar"
    assert "Python" in data["resume"]["technicalSkills"]
    # Verify no matchResult, score, or intelligence is returned by /parse
    assert "matchResult" not in data
    assert "readinessIndex" not in data
    assert "overallScore" not in data


def test_analyze_requires_role_and_resume(client):
    """Bug 6: /api/analyze requires an explicit target role."""
    resume_payload = {
        "contact": {"name": "Test User"},
        "technicalSkills": ["Python", "FastAPI"],
        "education": []
    }
    # Missing roleTitle
    res = client.post("/api/analyze", json={"resume": resume_payload, "roleTitle": "", "dontSave": True})
    assert res.status_code == 400 or res.status_code == 422


def test_link_checker_passes_zero_broken_hash_links():
    """Bug 2: All links in index.html resolve to real routes or valid DOM IDs."""
    errors = check_html_links(INDEX_PATH)
    assert errors == 0
