"""
CareerMatch AI: Comprehensive API Contract Test Suite
Validates that every endpoint consumed by the frontend adheres to the exact shape,
canonical keys, and types required by the UI modules.
"""

import os
import sys
import unittest.mock
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
from backend.database import init_db
from backend.schemas import (
    AnalyzeResponseSchema,
    HistoryItemResponseSchema,
    AtsEvaluateResponseSchema,
    ReadinessIndexResponseSchema,
    CareerCompareResponseSchema,
    JobMarketResponseSchema,
    AssessmentGenerateResponseSchema,
    AssessmentSubmitResponseSchema,
    AssessmentHintResponseSchema,
    InterviewStartResponseSchema,
    InterviewAnswerResponseSchema,
    GithubAnalyzeResponseSchema,
)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_full_guest_flow_api_contracts():
    client = TestClient(app)

    # 1. Parse Resume Fixture
    fixture_path = os.path.join(ROOT_DIR, "tests", "fixtures", "test_resume.txt")
    with open(fixture_path, "r", encoding="utf-8") as f:
        resume_text = f.read()

    parse_res = client.post("/api/resume/parse", json={
        "filename": "test_resume.txt",
        "pastedText": resume_text,
        "dontSave": False,
    })
    assert parse_res.status_code == 200, f"Parse failed: {parse_res.text}"
    parse_data = parse_res.json()
    assert "resume" in parse_data, "Parse response missing 'resume'"
    resume = parse_data["resume"]
    assert isinstance(resume, dict)
    assert "id" in resume and isinstance(resume["id"], str)
    assert "technicalSkills" in resume and isinstance(resume["technicalSkills"], list)
    assert "contact" in resume and isinstance(resume["contact"], dict)

    # 2. Run Match Analysis (/api/analyze)
    analyze_payload = {
        "resume": resume,
        "roleTitle": "Backend Developer",
        "goalCompany": "Razorpay",
        "customJdText": "Seeking a Backend Developer with Python, FastAPI, PostgreSQL, Redis, and Docker.",
        "dontSave": False,
    }
    analyze_res = client.post("/api/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, f"Analyze failed: {analyze_res.text}"
    analyze_data = analyze_res.json()

    # Validate against Pydantic Contract
    validated_analyze = AnalyzeResponseSchema.model_validate(analyze_data)
    assert validated_analyze.analysisId is not None

    # Strict UI assertions for analyzer.js & report.js & historyDiff.js
    assert "matchResult" in analyze_data, "Missing canonical key 'matchResult'"
    assert "activeJob" in analyze_data, "Missing canonical key 'activeJob'"
    assert "stages" in analyze_data, "Missing canonical key 'stages'"
    assert "skillGaps" in analyze_data, "Missing canonical key 'skillGaps'"
    assert "roadmapNodes" in analyze_data, "Missing canonical key 'roadmapNodes'"
    assert "completedNodes" in analyze_data, "Missing canonical key 'completedNodes'"
    assert "atsReport" in analyze_data, "Missing canonical key 'atsReport'"
    assert "advisor" in analyze_data, "Missing canonical key 'advisor'"
    assert "projects" in analyze_data, "Missing canonical key 'projects'"
    assert "improvements" in analyze_data, "Missing canonical key 'improvements'"
    assert "dashboard" in analyze_data, "Missing canonical key 'dashboard'"

    # Backward-compatible aliases
    assert "job" in analyze_data, "Missing backward-compatible alias 'job'"
    assert "match" in analyze_data, "Missing backward-compatible alias 'match'"
    assert "roadmap" in analyze_data, "Missing backward-compatible alias 'roadmap'"
    assert "ats" in analyze_data, "Missing backward-compatible alias 'ats'"

    # Type & property assertions for report.js
    mr = analyze_data["matchResult"]
    assert isinstance(mr["overallScore"], (int, float))
    assert isinstance(mr["mandatorySatisfiedPct"], (int, float))
    assert isinstance(mr["preferredSatisfiedPct"], (int, float))
    assert isinstance(mr["matchedSkills"], list)
    assert isinstance(mr["partialSkills"], list)
    assert isinstance(mr["missingSkills"], list)

    aj = analyze_data["activeJob"]
    assert "title" in aj
    assert "companyName" in aj or "company" in aj

    analysis_id = analyze_data["analysisId"]

    # 3. Reload History (/api/history/{id})
    hist_res = client.get(f"/api/history/{analysis_id}")
    assert hist_res.status_code == 200, f"History load failed: {hist_res.text}"
    hist_data = hist_res.json()

    validated_hist = HistoryItemResponseSchema.model_validate(hist_data)
    assert validated_hist.analysisId == analysis_id
    assert "matchResult" in hist_data, "History item missing canonical 'matchResult'"
    assert "activeJob" in hist_data, "History item missing canonical 'activeJob'"
    assert "resume" in hist_data, "History item missing 'resume'"
    assert "stages" in hist_data, "History item missing 'stages'"
    assert hist_data["matchResult"]["overallScore"] == mr["overallScore"]

    # 4. Dashboard Metrics (/api/dashboard)
    dash_res = client.get("/api/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "totalResumes" in dash_data
    assert "totalJobsCompared" in dash_data
    assert "recentHistory" in dash_data
    assert isinstance(dash_data["recentHistory"], list)
    assert len(dash_data["recentHistory"]) >= 1

    # 5. Adaptive Roadmap (/api/roadmap/adaptive)
    adaptive_res = client.post("/api/roadmap/adaptive", json={
        "resumeId": resume["id"],
        "targetRole": "Backend Developer",
        "currentPace": "balanced",
    })
    assert adaptive_res.status_code == 200
    adaptive_data = adaptive_res.json()
    assert "stages" in adaptive_data or "roadmap" in adaptive_data

    # 6. ATS Evaluation (/api/ats/evaluate)
    ats_res = client.post("/api/ats/evaluate", json={
        "resume": resume,
        "targetRole": "Backend Developer",
    })
    assert ats_res.status_code == 200
    ats_data = ats_res.json()
    validated_ats = AtsEvaluateResponseSchema.model_validate(ats_data)
    assert isinstance(validated_ats.atsScore, (int, float))
    assert isinstance(validated_ats.recommendations, list)
    assert isinstance(validated_ats.keywordsFound, list)
    assert isinstance(validated_ats.keywordsMissing, list)

    # 7. Placement Readiness Index (/api/readiness/index)
    pri_res = client.post("/api/readiness/index", json={
        "resumeId": resume["id"],
        "targetRole": "Backend Developer",
    })
    assert pri_res.status_code == 200
    pri_data = pri_res.json()
    validated_pri = ReadinessIndexResponseSchema.model_validate(pri_data)
    assert isinstance(validated_pri.readinessIndex, (int, float))
    assert isinstance(validated_pri.tier, str)

    # 8. Career Role Comparison (/api/career/compare)
    career_res = client.post("/api/career/compare", json={
        "resumeId": resume["id"],
        "roleTitles": ["Backend Developer", "Full Stack Developer"],
    })
    assert career_res.status_code == 200
    career_data = career_res.json()
    validated_career = CareerCompareResponseSchema.model_validate(career_data)
    assert isinstance(validated_career.comparisons, list)

    # 9. Jobs Market Intelligence (/api/jobs/market)
    jobs_res = client.post("/api/jobs/market", json={
        "resumeId": resume["id"],
        "roleFilter": "Backend Developer",
    })
    assert jobs_res.status_code == 200
    jobs_data = jobs_res.json()
    validated_jobs = JobMarketResponseSchema.model_validate(jobs_data)
    assert isinstance(validated_jobs.jobs, list)
    assert isinstance(validated_jobs.totalListings, int)

    # 10. Assessment Lab Flow
    gen_res = client.post("/api/assessment/generate", json={
        "topic": "Python",
        "difficulty": "Intermediate",
    })
    assert gen_res.status_code == 200, f"Assessment generate failed: {gen_res.text}"
    gen_data = gen_res.json()
    validated_gen = AssessmentGenerateResponseSchema.model_validate(gen_data)
    assert len(validated_gen.questions) > 0

    # Hint check
    hint_res = client.post("/api/assessment/hint", json={
        "sessionId": validated_gen.sessionId,
        "questionIndex": 0,
        "tier": 1,
    })
    assert hint_res.status_code == 200, f"Assessment hint failed: {hint_res.text}"
    validated_hint = AssessmentHintResponseSchema.model_validate(hint_res.json())
    assert isinstance(validated_hint.hint, str)

    # Submit check
    submit_res = client.post("/api/assessment/submit", json={
        "sessionId": validated_gen.sessionId,
        "mcqAnswers": {0: 1},
        "codeSubmission": "def process(): return True",
    })
    assert submit_res.status_code == 200, f"Assessment submit failed: {submit_res.text}"
    validated_submit = AssessmentSubmitResponseSchema.model_validate(submit_res.json())
    assert isinstance(validated_submit.overallScore, (int, float))
    assert isinstance(validated_submit.mcqScore, (int, float))

    # 11. Interview Simulator Flow
    int_start_res = client.post("/api/interview/start", json={
        "resumeId": resume["id"],
        "targetRole": "Backend Developer",
        "goalCompany": "Razorpay",
    })
    assert int_start_res.status_code == 200
    int_start_data = int_start_res.json()
    validated_int_start = InterviewStartResponseSchema.model_validate(int_start_data)
    assert validated_int_start.totalQuestions > 0
    assert "question" in validated_int_start.currentQuestion

    int_ans_res = client.post("/api/interview/answer", json={
        "sessionId": validated_int_start.sessionId,
        "questionIndex": 1,
        "answerText": "In Python, I use connection pools and indexed queries to optimize database latency.",
    })
    assert int_ans_res.status_code == 200, f"Interview answer failed: {int_ans_res.text}"
    validated_int_ans = InterviewAnswerResponseSchema.model_validate(int_ans_res.json())
    assert "overallScore" in validated_int_ans.questionEvaluation

    # 12. GitHub Analysis (with mock to avoid external network)
    mock_gh_data = {
        "available": True,
        "username": "octocat",
        "dataSource": "Live GitHub REST API v3",
        "portfolioStrengthScore": 85.0,
        "verificationRatePct": 75.0,
        "verifiedSkills": [{"skill": "Python", "evidence": "Used in 8 repositories"}],
        "unverifiedResumeSkills": [],
        "publicReposCount": 8,
        "followersCount": 150,
        "readmeQualityReport": {"averageDocumentationScore": 80.0},
    }
    with unittest.mock.patch("backend.main.analyze_github_portfolio", return_value=mock_gh_data):
        gh_res = client.post("/api/github/analyze", json={"githubUsername": "octocat"})
        assert gh_res.status_code == 200, f"GitHub analyze failed: {gh_res.text}"
        gh_json = gh_res.json()
        validated_gh = GithubAnalyzeResponseSchema.model_validate(gh_json)
        assert validated_gh.available is True
        assert validated_gh.portfolioStrengthScore == 85.0
