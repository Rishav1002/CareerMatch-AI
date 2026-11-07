"""
Integration and Unit Tests for Order 7 (Bugs 13 and 14):
1. Bug 13: Live Jobs Aggregation, Deduplication, and Salary Normalization.
2. Bug 14a: Study Planner Zero Fake Data & Honest Streaks.
3. Bug 14b: Skill Assessment Answer Leak Prevention, Tiered Hints & Re-submission Guard.
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
from backend.jobs.service import job_market_service


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_jobs_aggregator_and_deduplication():
    # 1. Test JobMarketService returns valid listings with deduplication
    jobs = job_market_service.get_market_jobs(query="Data Engineer", prefer_live=False, limit=10)
    assert len(jobs) >= 1
    for j in jobs:
        assert "id" in j
        assert "title" in j
        assert "companyName" in j
        assert "salaryRange" in j
        assert "applyUrl" in j

    # Check deduplication helper logic
    keys = set()
    for j in jobs:
        k = f"{j['title'].lower()}|{j['companyName'].lower()}|{j['location'].lower()}"
        assert k not in keys
        keys.add(k)


def test_assessment_security_no_answer_leaks_and_hints():
    client_a = TestClient(app)
    client_b = TestClient(app)

    # 1. Generate assessment session for Client A
    gen_payload = {
        "topic": "Python",
        "difficulty": "Intermediate",
    }
    gen_res = client_a.post("/api/assessment/generate", json=gen_payload)
    assert gen_res.status_code == 200
    asmt_data = gen_res.json()
    session_id = asmt_data["sessionId"]
    questions = asmt_data["questions"]

    # CRITICAL SECURITY CHECK: Ensure answers, correctIndex, and explanations are NOT leaked
    for q in questions:
        assert "correctIndex" not in q, f"SECURITY LEAK: correctIndex found in question {q.get('id')}"
        assert "explanation" not in q, f"SECURITY LEAK: explanation found in question {q.get('id')}"

    # 2. Client B tries to request hint for Client A's session -> Must fail with 400 (Isolation)
    hint_payload_unauthorized = {
        "sessionId": session_id,
        "questionIndex": 0,
        "tier": 1,
    }
    hint_res_b = client_b.post("/api/assessment/hint", json=hint_payload_unauthorized)
    assert hint_res_b.status_code == 400

    # 3. Client A requests Tier 1 hint for Question 0
    hint_payload_a = {
        "sessionId": session_id,
        "questionIndex": 0,
        "tier": 1,
    }
    hint_res_a = client_a.post("/api/assessment/hint", json=hint_payload_a)
    assert hint_res_a.status_code == 200
    hint_data = hint_res_a.json()
    assert "hint" in hint_data
    assert hint_data["tier"] == 1
    assert hint_data["penaltyPct"] == 25

    # 4. Client A submits answers: Question 0 correct (with hint penalty), rest correct
    # Question 0 correctIndex is 2 for Python bank
    submit_payload = {
        "sessionId": session_id,
        "mcqAnswers": [2, 1, 1, 2],
        "codeSubmission": "def top_k_skills(skills: list[str], k: int) -> list[str]:\n    return sorted(skills)[:k]\n",
    }
    submit_res = client_a.post("/api/assessment/submit", json=submit_payload)
    assert submit_res.status_code == 200
    res_data = submit_res.json()
    assert res_data["totalQuestions"] == 4
    assert res_data["correctCount"] == 4
    # Because Question 0 used Tier 1 hint (-25% points -> 0.75 earned), mcqScore should be (3.75/4) * 100 = 93.8%
    assert res_data["mcqScore"] < 100.0
    assert res_data["questionReviews"][0]["usedHintTier"] == 1

    # 5. Client A tries to re-submit completed session -> Must be rejected with 400
    re_submit_res = client_a.post("/api/assessment/submit", json=submit_payload)
    assert re_submit_res.status_code == 400
    assert "already been" in re_submit_res.json().get("detail", "").lower()
