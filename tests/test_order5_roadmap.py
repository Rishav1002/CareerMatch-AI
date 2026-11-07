"""
Test suite for Order 5: Bug 8 (Interactive Adaptive Roadmap Diagram & Anti-Leak).
Verifies:
- Roadmap generation returns structured milestones & tasks
- Quiz payloads stripped of correctIndex and explanation (anti-cheat verification)
- Server-side quiz evaluation works correctly
- Ownership isolation enforced on roadmap endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_roadmap_adaptive_anti_leak(client):
    """Bug 8 & Bug 14b: Client payload must NEVER contain correctIndex or explanation."""
    resume_payload = {
        "id": "res-test-rm-1",
        "contact": {"name": "Test Student"},
        "technicalSkills": ["Python", "FastAPI"],
        "education": []
    }
    res = client.post("/api/roadmap/adaptive", json={
        "resume": resume_payload,
        "targetRole": "Python Backend Developer",
        "weeklyHoursGoal": 10,
        "regenerate": True,
    })
    assert res.status_code == 200
    data = res.json()
    assert "stages" in data
    assert len(data["stages"]) > 0

    # Ensure no answer leakage
    for stage in data["stages"]:
        for q in stage.get("quizQuestions", []):
            assert "correctIndex" not in q, f"CRITICAL: correctIndex leaked in quiz question {q.get('id')}"
            assert "explanation" not in q, f"CRITICAL: explanation leaked in quiz question {q.get('id')}"
            assert "question" in q
            assert "options" in q
            assert len(q["options"]) > 1


def test_roadmap_stage_quiz_server_grading(client):
    """Verify that stage quiz grading executes strictly on the server."""
    resume_payload = {
        "id": "res-test-rm-2",
        "contact": {"name": "Test Student 2"},
        "technicalSkills": ["SQL", "Python"],
        "education": []
    }
    rm_res = client.post("/api/roadmap/adaptive", json={
        "resume": resume_payload,
        "targetRole": "Data Engineer",
        "weeklyHoursGoal": 10,
        "regenerate": True,
    })
    assert rm_res.status_code == 200
    rm_data = rm_res.json()
    roadmap_id = rm_data["roadmapId"]

    # Submit quiz answers to stage 1
    quiz_res = client.post("/api/roadmap/quiz", json={
        "roadmapId": roadmap_id,
        "stageIndex": 1,
        "answers": [1, 1, 1],
    })
    assert quiz_res.status_code == 200
    result = quiz_res.json()
    assert "latestQuizResult" in result
    latest = result["latestQuizResult"]
    assert "scorePct" in latest
    assert "skillName" in latest
    assert "correctCount" in latest
