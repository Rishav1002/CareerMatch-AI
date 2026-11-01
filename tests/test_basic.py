"""
Basic pytest suite for CareerMatch AI:
1. Sample resume + Data Engineer JD extracts mandatory skills (Python, SQL, Apache Spark, AWS, Data Warehousing, Git)
   and does not include unrelated skills (TypeScript, NLP).
2. A junk resume with no technical skills always scores under 10.
3. No job requirement appears in more than one status bucket (matched, adjacent/partial, missing).
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.matching_engine import match_resume_to_job, parse_jd_requirements_by_headings, resolve_job_profile  # noqa: E402
from backend.resume_parser import parse_resume_text_to_profile  # noqa: E402

SAMPLE_RESUME_PATH = os.path.join(ROOT_DIR, "samples", "sample_resume_aarav_sharma.txt")
SAMPLE_JD_PATH = os.path.join(ROOT_DIR, "samples", "sample_jd_data_engineer.txt")


def test_sample_resume_and_jd_mandatory_skills() -> None:
    with open(SAMPLE_RESUME_PATH, "r", encoding="utf-8") as rf:
        resume_text = rf.read()
    with open(SAMPLE_JD_PATH, "r", encoding="utf-8") as jf:
        jd_text = jf.read()

    resume = parse_resume_text_to_profile(resume_text, "sample_resume_aarav_sharma.txt")
    parsed_jd = parse_jd_requirements_by_headings(jd_text)
    mandatory = set(parsed_jd["mandatorySkills"])

    expected_mandatory = {"Python", "SQL", "Apache Spark", "AWS", "Data Warehousing", "Git"}
    assert expected_mandatory.issubset(mandatory)
    assert "TypeScript" not in mandatory
    assert "NLP" not in mandatory

    detected_resume_skills = set(resume["technicalSkills"])
    assert "TypeScript" not in detected_resume_skills
    assert "NLP" not in detected_resume_skills


def test_junk_resume_scores_under_10() -> None:
    junk_text = (
        "John Doe\n"
        "Motivated hard worker looking for an entry-level opportunity.\n"
        "Hobbies include reading, hiking, cooking, and gardening."
    )
    resume = parse_resume_text_to_profile(junk_text, "junk.txt")
    job = resolve_job_profile("Data Engineer")
    result = match_resume_to_job(resume, job)

    assert len(resume["technicalSkills"]) == 0
    assert result["overallScore"] < 10.0


def test_no_skill_in_two_statuses_at_once() -> None:
    with open(SAMPLE_RESUME_PATH, "r", encoding="utf-8") as rf:
        resume_text = rf.read()
    with open(SAMPLE_JD_PATH, "r", encoding="utf-8") as jf:
        jd_text = jf.read()

    resume = parse_resume_text_to_profile(resume_text, "sample_resume_aarav_sharma.txt")
    job = resolve_job_profile("Data Engineer", "NexusCloud Commerce India", jd_text)
    result = match_resume_to_job(resume, job)

    matched = {item["jobSkill"] for item in result["matchedSkills"]}
    adjacent = {item["jobSkill"] for item in result["partialSkills"]}
    missing = {item["jobSkill"] for item in result["missingSkills"]}

    assert matched.isdisjoint(adjacent)
    assert matched.isdisjoint(missing)
    assert adjacent.isdisjoint(missing)


def test_jwt_auth_and_student_profile() -> None:
    from backend.career_modules import (
        create_jwt_token,
        decode_jwt_token,
        get_student_profile,
        hash_password,
        login_demo_user,
        verify_password,
    )
    from backend.database import init_db

    init_db()
    hashed = hash_password("SecurePass123!")
    assert verify_password("SecurePass123!", hashed) is True
    assert verify_password("WrongPass", hashed) is False

    token = create_jwt_token("user-test", "test@careermatch.ai", "Test Student")
    decoded = decode_jwt_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-test"
    assert decoded["email"] == "test@careermatch.ai"

    demo = login_demo_user()
    assert "token" in demo
    assert demo["user"]["id"] == "user-demo-aarav"
    profile = get_student_profile("user-demo-aarav")
    assert profile["fullName"] == "Aarav Sharma"


def test_module_1_job_market_intelligence() -> None:
    from backend.career_modules import fetch_job_market_intelligence
    from backend.database import init_db

    init_db()
    data = fetch_job_market_intelligence(
        {
            "roleFilter": "Data Engineer",
            "locationFilter": "",
            "experienceFilter": "",
            "workModeFilter": "",
            "preferLiveApi": False,
        }
    )
    assert "jobs" in data and len(data["jobs"]) > 0
    assert "trendingSkills" in data and len(data["trendingSkills"]) > 0
    assert "companyMatrix" in data


def test_module_2_mock_interview_simulator() -> None:
    from backend.career_modules import start_interview_session, submit_interview_answer
    from backend.database import init_db

    init_db()
    session = start_interview_session(
        {
            "targetRole": "Data Engineer",
            "interviewRound": "Technical",
            "difficulty": "Intermediate",
            "goalCompany": "Product-Based Tech",
        }
    )
    assert "sessionId" in session
    assert session["currentQuestion"] is not None

    ans = submit_interview_answer(
        {
            "sessionId": session["sessionId"],
            "questionIndex": 1,
            "answerText": (
                "In our analytics pipeline, I partitioned PostgreSQL tables by date and added composite B-tree indexes "
                "on customer_id and created_at, which reduced p95 query latency from 1.8s to 210ms."
            ),
            "inputMode": "text",
        }
    )
    assert "questionEvaluation" in ans
    assert ans["questionEvaluation"]["overallScore"] > 40
    assert "confidenceNote" in ans


def test_module_3_ats_simulator() -> None:
    from backend.career_modules import evaluate_ats_resume
    from backend.database import init_db

    init_db()
    with open(SAMPLE_RESUME_PATH, "r", encoding="utf-8") as rf:
        resume_text = rf.read()
    with open(SAMPLE_JD_PATH, "r", encoding="utf-8") as jf:
        jd_text = jf.read()

    resume = parse_resume_text_to_profile(resume_text, "sample_resume_aarav_sharma.txt")
    ats = evaluate_ats_resume(
        {
            "resume": resume,
            "targetRole": "Data Engineer",
            "customJdText": jd_text,
        }
    )
    assert 0 <= ats["atsScore"] <= 100
    assert "pillars" in ats and len(ats["pillars"]) == 4
    assert "bulletRewrites" in ats
    assert "downloadableResumeText" in ats and len(ats["downloadableResumeText"]) > 100


def test_module_4_github_portfolio_analyzer(monkeypatch: object) -> None:
    import urllib.error
    import urllib.request
    from backend.career_modules import analyze_github_portfolio
    from backend.database import init_db

    init_db()

    # 1. Empty username returns a clear error
    empty_res = analyze_github_portfolio({"githubUsername": ""})
    assert empty_res["available"] is False
    assert empty_res.get("error") == "Enter a GitHub username."
    assert empty_res.get("message") == "Enter a GitHub username."

    # 2. API failure (e.g. 403 rate limit or network timeout) returns available=False with no repos/scores
    def _mock_fail(*_args: object, **_kwargs: object) -> None:
        raise urllib.error.URLError("rate limit or network failure")

    monkeypatch.setattr(urllib.request, "urlopen", _mock_fail)  # type: ignore[attr-defined]
    fail_res = analyze_github_portfolio({"githubUsername": "octocat", "targetRole": "Data Engineer"})
    assert fail_res == {
        "available": False,
        "message": "GitHub data is unavailable right now (rate limit or network). Try again later or add GITHUB_TOKEN to .env.",
    }
    assert "repositories" not in fail_res
    assert "followersCount" not in fail_res
    assert "portfolioStrengthScore" not in fail_res
    assert "verifiedSkills" not in fail_res

    # 3. 404 user not found says so clearly
    def _mock_404(*_args: object, **_kwargs: object) -> None:
        raise urllib.error.HTTPError("https://api.github.com/users/no-such-user", 404, "Not Found", {}, None)  # type: ignore[arg-type]

    monkeypatch.setattr(urllib.request, "urlopen", _mock_404)  # type: ignore[attr-defined]
    not_found_res = analyze_github_portfolio({"githubUsername": "no-such-user", "targetRole": "Data Engineer"})
    assert not_found_res["available"] is False
    assert "404" in not_found_res["message"] or "does not exist" in not_found_res["message"]
    assert "repositories" not in not_found_res


def test_module_5_adaptive_roadmap_and_remediation() -> None:
    from backend.career_modules import get_adaptive_roadmap, submit_roadmap_stage_quiz
    from backend.database import init_db

    init_db()
    rm = get_adaptive_roadmap(
        {
            "targetRole": "Data Engineer",
            "regenerate": True,
        }
    )
    assert "roadmapId" in rm
    assert len(rm["tasks"]) > 0
    assert len(rm["stages"]) > 0

    # Submit failing answers (all 3 wrong) to trigger adaptive remediation task injection
    quiz_res = submit_roadmap_stage_quiz(
        {
            "roadmapId": rm["roadmapId"],
            "stageIndex": 1,
            "answers": [3, 3, 3],
        }
    )
    assert "latestQuizResult" in quiz_res
    assert quiz_res["latestQuizResult"]["scorePct"] < 80.0
    assert quiz_res["latestQuizResult"]["remediationAdded"] is True


def test_module_6_skill_assessment_non_executing_verifier() -> None:
    from backend.career_modules import generate_skill_assessment, submit_skill_assessment
    from backend.database import init_db

    init_db()
    session = generate_skill_assessment(
        {
            "topic": "Python",
            "difficulty": "Intermediate",
        }
    )
    assert "sessionId" in session
    assert len(session["questions"]) == 4
    assert "codingChallenge" in session

    code_solution = session["codingChallenge"]["starterCode"]
    result = submit_skill_assessment(
        {
            "sessionId": session["sessionId"],
            "mcqAnswers": [2, 1, 1, 2],
            "codeSubmission": code_solution,
        }
    )
    assert "overallScore" in result and result["overallScore"] >= 80.0
    assert result["evaluationMode"].startswith("Sandboxed Non-Executing")


def test_module_7_and_8_career_compare_and_pri() -> None:
    from backend.career_modules import compare_career_paths, compute_placement_readiness_index
    from backend.database import init_db

    init_db()
    cmp_data = compare_career_paths(
        {
            "primaryRole": "Full Stack Developer",
            "secondaryRole": "Data Engineer",
        }
    )
    assert len(cmp_data["allRolesMatrix"]) == 8
    assert "transitionBridge" in cmp_data

    pri = compute_placement_readiness_index(
        {
            "targetRole": "Data Engineer",
        }
    )
    assert 0 <= pri["priScore"] <= 100
    assert len(pri["categoryBreakdown"]) == 6
    assert "nextActions" in pri and len(pri["nextActions"]) > 0


def test_guest_bootstrap_and_invalid_token_401() -> None:
    from backend.main import _extract_user_id_from_auth_header, handle_bootstrap

    guest_boot = handle_bootstrap(None)
    assert guest_boot["studentProfile"] is None

    assert _extract_user_id_from_auth_header(None) is None
    assert _extract_user_id_from_auth_header("") is None

    try:
        _extract_user_id_from_auth_header("Bearer invalid.jwt.token")
        assert False, "Expected PermissionError for invalid token"
    except PermissionError:
        pass
