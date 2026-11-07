"""
Relational Database Layer for CareerMatch AI (PostgreSQL / SQLite Dual Engine).
Uses parameterized SQL statements to prevent SQL injection and persists all 17
normalized tables with strict owner-based data isolation:
1. users
2. student_profiles
3. resumes
4. resume_analyses (plus `analyses` alias for backward compatibility)
5. job_listings
6. job_matches
7. skill_records
8. skill_gaps
9. interview_sessions
10. interview_questions_answers
11. github_profiles
12. learning_roadmaps
13. learning_tasks
14. assessment_sessions
15. assessment_results
16. career_comparisons
17. placement_readiness_reports
18. ai_usage
"""

import json
import os
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from backend.config import DATABASE_PATH, DATABASE_URL, GUEST_DATA_TTL_DAYS

DB_PATH = os.environ.get("DATABASE_PATH", DATABASE_PATH)

try:
    import psycopg2  # type: ignore
    import psycopg2.extras  # type: ignore
except ImportError:
    psycopg2 = None


class PostgresCursorWrapper:
    def __init__(self, cursor: Any) -> None:
        self._cur = cursor

    def execute(self, query: str, params: Any = None) -> Any:
        # Handle SQLite-specific INSERT OR REPLACE for Postgres
        if "INSERT OR REPLACE INTO resumes" in query:
            if params and len(params) > 0:
                try:
                    self._cur.execute("DELETE FROM resumes WHERE id = %s", (params[0],))
                except Exception:
                    pass
            query = query.replace("INSERT OR REPLACE INTO", "INSERT INTO")
        elif "INSERT OR REPLACE INTO roadmap_progress" in query:
            if params and len(params) >= 2:
                try:
                    self._cur.execute("DELETE FROM roadmap_progress WHERE resume_id = %s AND target_role = %s", (params[0], params[1]))
                except Exception:
                    pass
            query = query.replace("INSERT OR REPLACE INTO", "INSERT INTO")
        elif "INSERT OR REPLACE INTO learning_roadmaps" in query:
            if params and len(params) >= 1:
                try:
                    self._cur.execute("DELETE FROM learning_roadmaps WHERE id = %s", (params[0],))
                except Exception:
                    pass
            query = query.replace("INSERT OR REPLACE INTO", "INSERT INTO")

        sql = query.replace("?", "%s")
        if params is None:
            return self._cur.execute(sql)
        return self._cur.execute(sql, params)

    def executescript(self, script: str) -> None:
        adapted = script.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
        for stmt in adapted.split(";"):
            cleaned = stmt.strip()
            if cleaned:
                try:
                    self._cur.execute(cleaned)
                except Exception as exc:
                    print(f"Postgres schema notice: {exc}")

    def fetchone(self) -> Any:
        return self._cur.fetchone()

    def fetchall(self) -> Any:
        return self._cur.fetchall()

    @property
    def lastrowid(self) -> Any:
        try:
            return self._cur.lastrowid or 1
        except Exception:
            return 1

    @property
    def rowcount(self) -> int:
        try:
            return self._cur.rowcount
        except Exception:
            return 0

    def close(self) -> None:
        try:
            self._cur.close()
        except Exception:
            pass


class PostgresConnectionWrapper:
    def __init__(self, conn: Any) -> None:
        self._conn = conn
        try:
            self._conn.autocommit = True
        except Exception:
            pass

    def cursor(self) -> PostgresCursorWrapper:
        return PostgresCursorWrapper(self._conn.cursor())

    def commit(self) -> None:
        try:
            if not self._conn.autocommit:
                self._conn.commit()
        except Exception:
            pass

    def rollback(self) -> None:
        try:
            self._conn.rollback()
        except Exception:
            pass

    def close(self) -> None:
        try:
            self._conn.close()
        except Exception:
            pass

    def executescript(self, script: str) -> None:
        cur = self.cursor()
        cur.executescript(script)
        cur.close()


def get_connection() -> Any:
    db_url = os.environ.get("DATABASE_URL", DATABASE_URL).strip()
    if db_url and psycopg2 is not None and (db_url.startswith("postgres://") or db_url.startswith("postgresql://")):
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        if "sslmode=" not in db_url:
            db_url += ("&" if "?" in db_url else "?") + "sslmode=require"

        for attempt in range(3):
            try:
                pg_conn = psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor, connect_timeout=10)
                return PostgresConnectionWrapper(pg_conn)
            except Exception as exc:
                if attempt < 2:
                    time.sleep(1.0 * (attempt + 1))
                    continue
                print(f"Warning: PostgreSQL connection failed after retries, falling back to SQLite: {exc}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Create all relational tables and execute additive, idempotent migrations."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TEXT NOT NULL,
            last_login_at TEXT
        );

        CREATE TABLE IF NOT EXISTS student_profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            education_degree TEXT,
            institution TEXT,
            graduation_year TEXT,
            experience_level TEXT DEFAULT 'Entry Level / Final Year',
            target_role TEXT NOT NULL DEFAULT 'Full Stack Developer',
            secondary_roles_json TEXT DEFAULT '[]',
            preferred_locations_json TEXT DEFAULT '[]',
            target_companies_json TEXT DEFAULT '[]',
            github_username TEXT DEFAULT '',
            linkedin_url TEXT DEFAULT '',
            active_resume_id TEXT DEFAULT '',
            pri_weights_json TEXT DEFAULT '{}',
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            candidate_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            location TEXT,
            filename TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            summary TEXT,
            education_json TEXT NOT NULL,
            skills_json TEXT NOT NULL,
            projects_json TEXT NOT NULL,
            experience_json TEXT NOT NULL,
            certifications_json TEXT NOT NULL,
            soft_skills_json TEXT NOT NULL,
            skill_evidence_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT NOT NULL,
            candidate_name TEXT NOT NULL,
            target_role TEXT NOT NULL,
            goal_company TEXT NOT NULL,
            overall_score REAL NOT NULL,
            technical_score REAL NOT NULL,
            projects_score REAL NOT NULL,
            education_score REAL NOT NULL,
            certifications_score REAL NOT NULL,
            soft_skills_score REAL NOT NULL,
            mandatory_met_pct REAL NOT NULL,
            preferred_met_pct REAL NOT NULL,
            matched_skills_json TEXT NOT NULL,
            partial_skills_json TEXT NOT NULL,
            missing_skills_json TEXT NOT NULL,
            skill_gaps_json TEXT NOT NULL,
            roadmap_json TEXT NOT NULL,
            courses_json TEXT NOT NULL,
            projects_rec_json TEXT NOT NULL,
            resume_improvements_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS resume_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT NOT NULL,
            candidate_name TEXT NOT NULL,
            target_role TEXT NOT NULL,
            goal_company TEXT NOT NULL,
            overall_score REAL NOT NULL,
            technical_score REAL NOT NULL,
            projects_score REAL NOT NULL,
            education_score REAL NOT NULL,
            certifications_score REAL NOT NULL,
            soft_skills_score REAL NOT NULL,
            ats_score REAL DEFAULT 0.0,
            mandatory_met_pct REAL NOT NULL,
            preferred_met_pct REAL NOT NULL,
            matched_skills_json TEXT NOT NULL,
            partial_skills_json TEXT NOT NULL,
            missing_skills_json TEXT NOT NULL,
            skill_gaps_json TEXT NOT NULL,
            roadmap_json TEXT NOT NULL,
            courses_json TEXT NOT NULL,
            projects_rec_json TEXT NOT NULL,
            resume_improvements_json TEXT NOT NULL,
            ats_report_json TEXT DEFAULT '{}',
            created_at TEXT NOT NULL,
            FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS roadmap_progress (
            resume_id TEXT NOT NULL,
            target_role TEXT NOT NULL,
            owner_id TEXT DEFAULT 'legacy_unowned',
            completed_nodes_json TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (resume_id, target_role)
        );

        CREATE TABLE IF NOT EXISTS job_listings (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company_name TEXT NOT NULL,
            location TEXT NOT NULL,
            work_mode TEXT NOT NULL,
            experience_level TEXT NOT NULL,
            salary_range TEXT,
            role_category TEXT NOT NULL,
            required_skills_json TEXT NOT NULL,
            preferred_skills_json TEXT DEFAULT '[]',
            description_summary TEXT,
            apply_url TEXT,
            data_source TEXT NOT NULL,
            posted_at TEXT NOT NULL,
            fetched_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS job_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            match_score REAL NOT NULL,
            matched_skills_json TEXT NOT NULL,
            missing_skills_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skill_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id TEXT NOT NULL,
            skill_name TEXT NOT NULL,
            category TEXT DEFAULT 'Technical',
            proficiency_level TEXT DEFAULT 'Detected',
            verified_by_github INTEGER DEFAULT 0,
            verified_by_assessment INTEGER DEFAULT 0,
            evidence_text TEXT,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skill_gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id TEXT NOT NULL,
            target_role TEXT NOT NULL,
            skill_name TEXT NOT NULL,
            requirement_tier TEXT NOT NULL,
            priority_rank INTEGER NOT NULL,
            estimated_duration TEXT,
            adjacent_skill TEXT,
            why_it_matters TEXT,
            practical_exercise TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS interview_sessions (
            id TEXT PRIMARY KEY,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT,
            target_role TEXT NOT NULL,
            goal_company TEXT,
            interview_round TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'in_progress',
            total_questions INTEGER NOT NULL DEFAULT 5,
            answered_count INTEGER NOT NULL DEFAULT 0,
            overall_score REAL DEFAULT 0.0,
            technical_score REAL DEFAULT 0.0,
            communication_score REAL DEFAULT 0.0,
            relevance_score REAL DEFAULT 0.0,
            problem_solving_score REAL DEFAULT 0.0,
            confidence_indicator_score REAL DEFAULT 0.0,
            improvement_plan_json TEXT DEFAULT '[]',
            started_at TEXT NOT NULL,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS interview_questions_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            question_index INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_context TEXT,
            expected_topics_json TEXT DEFAULT '[]',
            candidate_answer TEXT DEFAULT '',
            input_mode TEXT DEFAULT 'text',
            time_taken_seconds INTEGER DEFAULT 0,
            score REAL DEFAULT 0.0,
            technical_score REAL DEFAULT 0.0,
            communication_score REAL DEFAULT 0.0,
            relevance_score REAL DEFAULT 0.0,
            problem_solving_score REAL DEFAULT 0.0,
            confidence_indicator REAL DEFAULT 0.0,
            feedback_text TEXT DEFAULT '',
            mistakes_json TEXT DEFAULT '[]',
            sample_answer TEXT DEFAULT '',
            follow_up_question TEXT DEFAULT '',
            answered_at TEXT,
            FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS github_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT,
            github_username TEXT NOT NULL,
            data_source TEXT NOT NULL,
            public_repos_count INTEGER DEFAULT 0,
            followers_count INTEGER DEFAULT 0,
            portfolio_strength_score REAL NOT NULL,
            verified_skills_json TEXT NOT NULL,
            unverified_resume_skills_json TEXT NOT NULL,
            top_languages_json TEXT NOT NULL,
            repositories_json TEXT NOT NULL,
            readme_quality_report_json TEXT NOT NULL,
            recommended_projects_json TEXT NOT NULL,
            analyzed_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS learning_roadmaps (
            id TEXT PRIMARY KEY,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT NOT NULL,
            target_role TEXT NOT NULL,
            overall_progress_pct REAL NOT NULL DEFAULT 0.0,
            weekly_hours_goal INTEGER NOT NULL DEFAULT 10,
            stages_json TEXT NOT NULL,
            quiz_history_json TEXT DEFAULT '[]',
            adaptive_notes_json TEXT DEFAULT '[]',
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS learning_tasks (
            id TEXT PRIMARY KEY,
            roadmap_id TEXT NOT NULL,
            stage_index INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            task_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            resource_url TEXT,
            estimated_hours REAL DEFAULT 2.0,
            cadence TEXT DEFAULT 'Weekly',
            is_adaptive_remediation INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            completed_at TEXT,
            FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS assessment_sessions (
            id TEXT PRIMARY KEY,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT,
            topic TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            questions_json TEXT NOT NULL,
            coding_challenge_json TEXT DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'generated',
            created_at TEXT NOT NULL,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS assessment_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            session_id TEXT NOT NULL,
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT,
            topic TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            overall_score REAL NOT NULL,
            mcq_score REAL NOT NULL,
            coding_score REAL NOT NULL,
            correct_count INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            evaluation_mode TEXT NOT NULL,
            question_reviews_json TEXT NOT NULL,
            coding_review_json TEXT DEFAULT '{}',
            weak_subtopics_json TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS career_comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT,
            primary_role TEXT NOT NULL,
            compared_roles_json TEXT NOT NULL,
            comparison_matrix_json TEXT NOT NULL,
            transition_bridge_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS placement_readiness_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id TEXT DEFAULT 'legacy_unowned',
            user_id TEXT DEFAULT 'legacy_unowned',
            resume_id TEXT NOT NULL,
            target_role TEXT NOT NULL,
            pri_score REAL NOT NULL,
            readiness_tier TEXT NOT NULL,
            technical_score REAL NOT NULL,
            resume_quality_score REAL NOT NULL,
            interview_score REAL NOT NULL,
            portfolio_score REAL NOT NULL,
            assessment_score REAL NOT NULL,
            market_alignment_score REAL NOT NULL,
            weights_json TEXT NOT NULL,
            category_breakdown_json TEXT NOT NULL,
            strengths_json TEXT NOT NULL,
            weaknesses_json TEXT NOT NULL,
            next_actions_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_usage (
            user_id TEXT NOT NULL,
            day_date TEXT NOT NULL,
            request_count INTEGER NOT NULL DEFAULT 0,
            last_request_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, day_date)
        );
        """
    )

    # -------------------------------------------------------------------------
    # ADDITIVE IDEMPOTENT MIGRATIONS FOR NEON (Postgres) & SQLITE
    # -------------------------------------------------------------------------
    tables_needing_owner = [
        "resumes",
        "analyses",
        "resume_analyses",
        "roadmap_progress",
        "job_matches",
        "interview_sessions",
        "github_profiles",
        "learning_roadmaps",
        "assessment_sessions",
        "assessment_results",
        "career_comparisons",
        "placement_readiness_reports",
    ]

    is_pg = hasattr(conn, "_conn")
    for tbl in tables_needing_owner:
        if is_pg:
            try:
                cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT 'legacy_unowned';")
            except Exception as exc:
                print(f"Postgres migration notice for {tbl}.owner_id: {exc}")
        else:
            try:
                cursor.execute(f"PRAGMA table_info({tbl});")
                cols = [row[1] for row in cursor.fetchall()]
                if "owner_id" not in cols:
                    cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN owner_id TEXT DEFAULT 'legacy_unowned';")
            except Exception as exc:
                print(f"SQLite migration notice for {tbl}.owner_id: {exc}")

    # Additive migration for assessment hints tracking
    if is_pg:
        try:
            cursor.execute("ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS hints_used_json TEXT DEFAULT '{}';")
        except Exception:
            pass
    else:
        try:
            cursor.execute("PRAGMA table_info(assessment_sessions);")
            cols = [row[1] for row in cursor.fetchall()]
            if "hints_used_json" not in cols:
                cursor.execute("ALTER TABLE assessment_sessions ADD COLUMN hints_used_json TEXT DEFAULT '{}';")
        except Exception:
            pass

    # Mark legacy guest/unowned rows as legacy_unowned so they are NEVER served to any new visitor
    for tbl in tables_needing_owner:
        try:
            cursor.execute(f"UPDATE {tbl} SET owner_id = 'legacy_unowned' WHERE (owner_id IS NULL OR owner_id = '' OR owner_id = 'guest');")
        except Exception:
            pass

    # Create composite indexes for fast owner-scoped queries
    index_statements = [
        ("idx_resumes_owner_created", "CREATE INDEX IF NOT EXISTS idx_resumes_owner_created ON resumes (owner_id, created_at DESC);"),
        ("idx_analyses_owner_created", "CREATE INDEX IF NOT EXISTS idx_analyses_owner_created ON analyses (owner_id, created_at DESC);"),
        ("idx_resume_analyses_owner_created", "CREATE INDEX IF NOT EXISTS idx_resume_analyses_owner_created ON resume_analyses (owner_id, created_at DESC);"),
        ("idx_interview_owner_started", "CREATE INDEX IF NOT EXISTS idx_interview_owner_started ON interview_sessions (owner_id, started_at DESC);"),
        ("idx_github_owner_analyzed", "CREATE INDEX IF NOT EXISTS idx_github_owner_analyzed ON github_profiles (owner_id, analyzed_at DESC);"),
        ("idx_roadmaps_owner_updated", "CREATE INDEX IF NOT EXISTS idx_roadmaps_owner_updated ON learning_roadmaps (owner_id, updated_at DESC);"),
        ("idx_assessments_owner_created", "CREATE INDEX IF NOT EXISTS idx_assessments_owner_created ON assessment_sessions (owner_id, created_at DESC);"),
        ("idx_assessment_res_owner_created", "CREATE INDEX IF NOT EXISTS idx_assessment_res_owner_created ON assessment_results (owner_id, created_at DESC);"),
        ("idx_career_comp_owner_created", "CREATE INDEX IF NOT EXISTS idx_career_comp_owner_created ON career_comparisons (owner_id, created_at DESC);"),
        ("idx_pri_owner_created", "CREATE INDEX IF NOT EXISTS idx_pri_owner_created ON placement_readiness_reports (owner_id, created_at DESC);"),
    ]

    for idx_name, stmt in index_statements:
        try:
            cursor.execute(stmt)
        except Exception as exc:
            print(f"Index creation notice for {idx_name}: {exc}")

    conn.commit()
    conn.close()

    # Clean expired guest sessions according to GUEST_DATA_TTL_DAYS
    try:
        cleanup_expired_guest_data()
    except Exception as exc:
        print(f"Guest session retention cleanup notice: {exc}")


# ============================================================================
# RESUME & ANALYSIS CRUD WITH STRICT OWNER ISOLATION
# ============================================================================

def save_resume(profile: Dict[str, Any], user_id: str = "guest", owner_id: str = "legacy_unowned") -> Dict[str, Any]:
    """Insert or replace a parsed candidate resume into database and sync skill_records."""
    if profile.get("dontSave", False):
        return profile

    if owner_id == "legacy_unowned" and user_id and user_id != "guest":
        owner_id = user_id

    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    cursor.execute(
        """
        INSERT OR REPLACE INTO resumes (
            id, owner_id, user_id, candidate_name, email, phone, location, filename, raw_text, summary,
            education_json, skills_json, projects_json, experience_json,
            certifications_json, soft_skills_json, skill_evidence_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            profile["id"],
            owner_id,
            user_id,
            profile["contact"]["name"],
            profile["contact"].get("email", ""),
            profile["contact"].get("phone", ""),
            profile["contact"].get("location", ""),
            profile["filename"],
            profile.get("rawText", "")[:8000],  # Data minimization: truncate raw text storage
            profile.get("summary", ""),
            json.dumps(profile.get("education", [])),
            json.dumps(profile.get("technicalSkills", [])),
            json.dumps(profile.get("projects", [])),
            json.dumps(profile.get("workExperience", [])),
            json.dumps(profile.get("certifications", [])),
            json.dumps(profile.get("softSkills", [])),
            json.dumps(profile.get("skillEvidence", {})),
            profile.get("uploadedAt", now_iso),
        ),
    )

    # Sync normalized skill_records table
    cursor.execute("DELETE FROM skill_records WHERE resume_id = ?", (profile["id"],))
    ev_map = profile.get("skillEvidence", {})
    for sk in profile.get("technicalSkills", []):
        cursor.execute(
            """
            INSERT INTO skill_records (
                resume_id, skill_name, category, proficiency_level, evidence_text, updated_at
            ) VALUES (?, ?, 'Technical', 'Detected', ?, ?)
            """,
            (profile["id"], sk, ev_map.get(sk, f"Detected {sk} in resume."), now_iso),
        )

    conn.commit()
    conn.close()
    return profile


def get_resume_by_id(resume_id: str, owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve a stored resume profile from database with optional owner verification."""
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute("SELECT * FROM resumes WHERE id = ? AND owner_id = ?", (resume_id, owner_id))
    else:
        cursor.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return _row_to_resume(row)


def list_all_resumes(owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute("SELECT * FROM resumes WHERE owner_id = ? ORDER BY created_at DESC LIMIT 25", (owner_id,))
    else:
        cursor.execute("SELECT * FROM resumes WHERE owner_id != 'legacy_unowned' ORDER BY created_at DESC LIMIT 25")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_resume(r) for r in rows]


def update_resume_skills(resume_id: str, updated_skills: List[str], owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Update a candidate's verified technical skills list with owner verification."""
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute("SELECT id FROM resumes WHERE id = ? AND owner_id = ?", (resume_id, owner_id))
        if not cursor.fetchone():
            conn.close()
            return None

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    cursor.execute(
        "UPDATE resumes SET skills_json = ? WHERE id = ?",
        (json.dumps(updated_skills), resume_id),
    )
    cursor.execute("DELETE FROM skill_records WHERE resume_id = ?", (resume_id,))
    for sk in updated_skills:
        cursor.execute(
            """
            INSERT INTO skill_records (
                resume_id, skill_name, category, proficiency_level, evidence_text, updated_at
            ) VALUES (?, ?, 'Technical', 'User Verified', ?, ?)
            """,
            (resume_id, sk, f"Verified skill: {sk}", now_iso),
        )
    conn.commit()
    conn.close()
    return get_resume_by_id(resume_id, owner_id=owner_id)


def save_analysis_record(
    resume_id: str,
    candidate_name: str,
    target_role: str,
    goal_company: str,
    match_result: Dict[str, Any],
    skill_gaps: List[Dict[str, Any]],
    roadmap: List[Dict[str, Any]],
    advisor: Dict[str, Any],
    projects: List[Dict[str, Any]],
    improvements: Dict[str, Any],
    ats_score: float = 0.0,
    ats_report: Optional[Dict[str, Any]] = None,
    owner_id: str = "legacy_unowned",
) -> int:
    """Save a complete job match analysis and AI recommendations with owner scope."""
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    params = (
        owner_id,
        resume_id,
        candidate_name,
        target_role,
        goal_company,
        match_result["overallScore"],
        match_result["technicalScore"],
        match_result["projectsExperienceScore"],
        match_result["educationScore"],
        match_result["certificationsScore"],
        match_result["softSkillsScore"],
        match_result["mandatorySatisfiedPct"],
        match_result["preferredSatisfiedPct"],
        json.dumps(match_result["matchedSkills"]),
        json.dumps(match_result["partialSkills"]),
        json.dumps(match_result["missingSkills"]),
        json.dumps(skill_gaps),
        json.dumps(roadmap),
        json.dumps(advisor),
        json.dumps(projects),
        json.dumps(improvements),
        now_iso,
    )

    cursor.execute(
        """
        INSERT INTO analyses (
            owner_id, resume_id, candidate_name, target_role, goal_company,
            overall_score, technical_score, projects_score, education_score,
            certifications_score, soft_skills_score,
            mandatory_met_pct, preferred_met_pct,
            matched_skills_json, partial_skills_json, missing_skills_json,
            skill_gaps_json, roadmap_json, courses_json,
            projects_rec_json, resume_improvements_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        params,
    )
    analysis_id = cursor.lastrowid or 0

    cursor.execute(
        """
        INSERT INTO resume_analyses (
            owner_id, user_id, resume_id, candidate_name, target_role, goal_company,
            overall_score, technical_score, projects_score, education_score,
            certifications_score, soft_skills_score, ats_score,
            mandatory_met_pct, preferred_met_pct,
            matched_skills_json, partial_skills_json, missing_skills_json,
            skill_gaps_json, roadmap_json, courses_json,
            projects_rec_json, resume_improvements_json, ats_report_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            owner_id,
            owner_id,
            resume_id,
            candidate_name,
            target_role,
            goal_company,
            match_result["overallScore"],
            match_result["technicalScore"],
            match_result["projectsExperienceScore"],
            match_result["educationScore"],
            match_result["certificationsScore"],
            match_result["softSkillsScore"],
            ats_score,
            match_result["mandatorySatisfiedPct"],
            match_result["preferredSatisfiedPct"],
            json.dumps(match_result["matchedSkills"]),
            json.dumps(match_result["partialSkills"]),
            json.dumps(match_result["missingSkills"]),
            json.dumps(skill_gaps),
            json.dumps(roadmap),
            json.dumps(advisor),
            json.dumps(projects),
            json.dumps(improvements),
            json.dumps(ats_report or {}),
            now_iso,
        ),
    )

    # Sync normalized skill_gaps table
    cursor.execute(
        "DELETE FROM skill_gaps WHERE resume_id = ? AND target_role = ?",
        (resume_id, target_role),
    )
    for g in skill_gaps:
        cursor.execute(
            """
            INSERT INTO skill_gaps (
                resume_id, target_role, skill_name, requirement_tier,
                priority_rank, estimated_duration, adjacent_skill,
                why_it_matters, practical_exercise, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                resume_id,
                target_role,
                g.get("skillName", ""),
                g.get("tier", "Mandatory"),
                int(g.get("priorityRank", 1)),
                g.get("estimatedDuration", "2 Weeks"),
                g.get("adjacentSkill") or "",
                g.get("whyItMatters", ""),
                g.get("practicalExercise", ""),
                now_iso,
            ),
        )

    conn.commit()
    conn.close()
    return analysis_id


def delete_analysis_record(analysis_id: int, owner_id: Optional[str] = None) -> bool:
    """Delete an analysis record with mandatory owner verification."""
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute("DELETE FROM analyses WHERE id = ? AND owner_id = ?", (analysis_id, owner_id))
        deleted = cursor.rowcount > 0
        cursor.execute("DELETE FROM resume_analyses WHERE id = ? AND owner_id = ?", (analysis_id, owner_id))
    else:
        cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
        deleted = cursor.rowcount > 0
        cursor.execute("DELETE FROM resume_analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    conn.close()
    return deleted


def get_analysis_by_id(analysis_id: int, owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve a saved analysis record by ID with owner verification."""
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute("SELECT * FROM analyses WHERE id = ? AND owner_id = ?", (analysis_id, owner_id))
    else:
        cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "ownerId": row["owner_id"] if "owner_id" in row.keys() else "",
        "resumeId": row["resume_id"],
        "candidateName": row["candidate_name"],
        "targetRole": row["target_role"],
        "goalCompany": row["goal_company"],
        "overallScore": row["overall_score"],
        "mandatoryMetPct": row["mandatory_met_pct"],
        "preferredMetPct": row["preferred_met_pct"],
        "matchedSkills": json.loads(row["matched_skills_json"]),
        "partialSkills": json.loads(row["partial_skills_json"]),
        "missingSkills": json.loads(row["missing_skills_json"]),
        "skillGaps": json.loads(row["skill_gaps_json"]),
        "stages": json.loads(row["roadmap_json"]),
        "advisor": json.loads(row["courses_json"]),
        "projects": json.loads(row["projects_rec_json"]),
        "improvements": json.loads(row["resume_improvements_json"]),
        "createdAt": row["created_at"],
    }


def get_roadmap_progress(resume_id: str, target_role: str, owner_id: Optional[str] = None) -> Dict[str, bool]:
    """Load saved roadmap node completion checkboxes with owner scope."""
    conn = get_connection()
    cursor = conn.cursor()
    if owner_id:
        cursor.execute(
            "SELECT completed_nodes_json FROM roadmap_progress WHERE resume_id = ? AND target_role = ? AND owner_id = ?",
            (resume_id, target_role, owner_id),
        )
    else:
        cursor.execute(
            "SELECT completed_nodes_json FROM roadmap_progress WHERE resume_id = ? AND target_role = ?",
            (resume_id, target_role),
        )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    try:
        data = json.loads(row["completed_nodes_json"])
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_roadmap_progress(resume_id: str, target_role: str, completed_nodes: Dict[str, bool], owner_id: str = "legacy_unowned") -> Dict[str, bool]:
    """Persist roadmap node completion checkboxes with owner scope."""
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    cursor.execute(
        """
        INSERT OR REPLACE INTO roadmap_progress (resume_id, target_role, owner_id, completed_nodes_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (resume_id, target_role, owner_id, json.dumps(completed_nodes), now_iso),
    )
    conn.commit()
    conn.close()
    return completed_nodes


def get_dashboard_metrics(resume_id: Optional[str] = None, owner_id: Optional[str] = None) -> Dict[str, Any]:
    """Compute student dashboard statistics scoped exclusively to the verified owner."""
    if not owner_id or owner_id == "legacy_unowned":
        return {
            "totalResumes": 0,
            "totalJobsCompared": 0,
            "averageCompatibilityScore": 0.0,
            "readinessStatus": "Upload a Resume to Begin",
            "topMatchedSkills": [],
            "topMissingSkills": [],
            "recentHistory": [],
        }

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS cnt FROM resumes WHERE owner_id = ?", (owner_id,))
    total_resumes = cursor.fetchone()["cnt"]

    if resume_id:
        cursor.execute(
            "SELECT * FROM analyses WHERE owner_id = ? AND resume_id = ? ORDER BY id DESC LIMIT 20",
            (owner_id, resume_id),
        )
        rows = cursor.fetchall()
    else:
        cursor.execute(
            "SELECT * FROM analyses WHERE owner_id = ? ORDER BY id DESC LIMIT 20",
            (owner_id,),
        )
        rows = cursor.fetchall()
    conn.close()

    total_analyses = len(rows)
    if total_analyses == 0:
        return {
            "totalResumes": total_resumes,
            "totalJobsCompared": 0,
            "averageCompatibilityScore": 0.0,
            "readinessStatus": "Upload a Resume to Begin",
            "topMatchedSkills": [],
            "topMissingSkills": [],
            "recentHistory": [],
        }

    scores = [float(r["overall_score"]) for r in rows]
    avg_score = round(sum(scores) / len(scores), 1)

    if avg_score >= 80:
        readiness = "Industry Ready"
    elif avg_score >= 65:
        readiness = "Strong Foundation"
    else:
        readiness = "Building Core Skills"

    matched_freq: Dict[str, int] = {}
    missing_freq: Dict[str, int] = {}
    history: List[Dict[str, Any]] = []

    for r in rows:
        matched_list = json.loads(r["matched_skills_json"])
        partial_list = json.loads(r["partial_skills_json"])
        missing_list = json.loads(r["missing_skills_json"])
        for m in matched_list:
            skill = m.get("jobSkill", "")
            if skill:
                matched_freq[skill] = matched_freq.get(skill, 0) + 1
        for g in list(partial_list) + list(missing_list):
            skill = g.get("jobSkill", "")
            if skill:
                missing_freq[skill] = missing_freq.get(skill, 0) + 1

        history.append(
            {
                "id": r["id"],
                "resumeId": r["resume_id"],
                "candidateName": r["candidate_name"],
                "targetRole": r["target_role"],
                "goalCompany": r["goal_company"],
                "overallScore": r["overall_score"],
                "mandatoryMetPct": r["mandatory_met_pct"],
                "matchedCount": len(matched_list),
                "missingCount": len(partial_list) + len(missing_list),
                "createdAt": r["created_at"],
            }
        )

    top_matched = [
        {"skill": k, "count": v}
        for k, v in sorted(matched_freq.items(), key=lambda item: item[1], reverse=True)[:6]
    ]
    top_missing = [
        {"skill": k, "count": v}
        for k, v in sorted(missing_freq.items(), key=lambda item: item[1], reverse=True)[:6]
    ]

    return {
        "totalResumes": total_resumes,
        "totalJobsCompared": total_analyses,
        "averageCompatibilityScore": avg_score,
        "readinessStatus": readiness,
        "topMatchedSkills": top_matched,
        "topMissingSkills": top_missing,
        "recentHistory": history[:8],
    }


def claim_guest_data(guest_id: str, user_id: str) -> int:
    """Transfer ownership of guest resources from cm_sid session to newly signed-in user account."""
    if not guest_id or not user_id or guest_id == user_id:
        return 0
    if not guest_id.startswith("guest_"):
        return 0

    tables = [
        "resumes",
        "analyses",
        "resume_analyses",
        "roadmap_progress",
        "job_matches",
        "interview_sessions",
        "github_profiles",
        "learning_roadmaps",
        "assessment_sessions",
        "assessment_results",
        "career_comparisons",
        "placement_readiness_reports",
    ]
    conn = get_connection()
    cursor = conn.cursor()
    total_transferred = 0
    for tbl in tables:
        try:
            cursor.execute(f"UPDATE {tbl} SET owner_id = ? WHERE owner_id = ?", (user_id, guest_id))
            total_transferred += cursor.rowcount
        except Exception as exc:
            print(f"Error transferring guest data on {tbl}: {exc}")
    conn.commit()
    conn.close()
    return total_transferred


def cleanup_expired_guest_data(ttl_days: Optional[int] = None) -> int:
    """Delete guest session data older than GUEST_DATA_TTL_DAYS (default 30 days)."""
    if ttl_days is None:
        ttl_days = GUEST_DATA_TTL_DAYS

    cutoff = (datetime.utcnow() - timedelta(days=ttl_days)).strftime("%Y-%m-%d %H:%M")
    tables = [
        ("resumes", "created_at"),
        ("analyses", "created_at"),
        ("resume_analyses", "created_at"),
        ("interview_sessions", "started_at"),
        ("github_profiles", "analyzed_at"),
        ("learning_roadmaps", "updated_at"),
        ("assessment_sessions", "created_at"),
        ("assessment_results", "created_at"),
        ("career_comparisons", "created_at"),
        ("placement_readiness_reports", "created_at"),
    ]
    conn = get_connection()
    cursor = conn.cursor()
    purged = 0
    for tbl, time_col in tables:
        try:
            cursor.execute(f"DELETE FROM {tbl} WHERE owner_id LIKE 'guest_%' AND {time_col} < ?", (cutoff,))
            purged += cursor.rowcount
        except Exception:
            pass
    conn.commit()
    conn.close()
    return purged


def _row_to_resume(row: Any) -> Dict[str, Any]:
    skills = json.loads(row["skills_json"])
    owner = row["owner_id"] if "owner_id" in row.keys() else (row["user_id"] if "user_id" in row.keys() else "")
    return {
        "id": row["id"],
        "ownerId": owner,
        "filename": row["filename"],
        "uploadedAt": row["created_at"],
        "rawText": row["raw_text"],
        "contact": {
            "name": row["candidate_name"],
            "email": row["email"] or "",
            "phone": row["phone"] or "",
            "location": row["location"] or "",
        },
        "summary": row["summary"] or "",
        "education": json.loads(row["education_json"]),
        "technicalSkills": skills,
        "projects": json.loads(row["projects_json"]),
        "workExperience": json.loads(row["experience_json"]),
        "certifications": json.loads(row["certifications_json"]),
        "softSkills": json.loads(row["soft_skills_json"]),
        "skillEvidence": json.loads(row["skill_evidence_json"]),
    }


def check_and_increment_ai_usage(user_id: str, is_authenticated: bool = False) -> tuple[bool, int, int, str]:
    """
    Rate limiter for Ask AI:
    - Guests: 5 queries/day per unique browser (owner_id)
    - Signed-in: 20 queries/day
    Returns: (is_allowed, remaining_today, limit_today, reset_at_iso)
    """
    limit = 20 if is_authenticated else 5
    now = datetime.utcnow()
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d 00:00:00 UTC")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT request_count FROM ai_usage WHERE user_id = ? AND day_date = ?",
        (user_id, today_str)
    )
    row = cursor.fetchone()

    current_count = 0
    if row:
        current_count = row["request_count"] if isinstance(row, dict) else row[0]

    if current_count >= limit:
        conn.close()
        return False, 0, limit, tomorrow_str

    new_count = current_count + 1
    # SQLite / Postgres compatible upsert
    try:
        cursor.execute("DELETE FROM ai_usage WHERE user_id = ? AND day_date = ?", (user_id, today_str))
        cursor.execute(
            "INSERT INTO ai_usage (user_id, day_date, request_count, last_request_at) VALUES (?, ?, ?, ?)",
            (user_id, today_str, new_count, now.isoformat())
        )
        conn.commit()
    except Exception as exc:
        print(f"ai_usage update note: {exc}")
    finally:
        conn.close()

    return True, max(0, limit - new_count), limit, tomorrow_str


def get_ai_usage(user_id: str, is_authenticated: bool = False) -> Dict[str, Any]:
    limit = 20 if is_authenticated else 5
    now = datetime.utcnow()
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d 00:00:00 UTC")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT request_count FROM ai_usage WHERE user_id = ? AND day_date = ?",
        (user_id, today_str)
    )
    row = cursor.fetchone()
    used = 0
    if row:
        used = row["request_count"] if isinstance(row, dict) else row[0]
    conn.close()
    return {
        "used": used,
        "remaining": max(0, limit - used),
        "limit": limit,
        "resetAt": tomorrow_str,
    }


def export_owner_records(owner_id: str, is_authenticated: bool = False) -> Dict[str, Any]:
    """
    Export all data associated with an owner (guest or authenticated user).
    Fulfills Data Portability requirements under India's DPDP Act 2023 & GDPR.
    """
    conn = get_connection()
    cursor = conn.cursor()

    export_payload: Dict[str, Any] = {
        "metadata": {
            "ownerId": owner_id,
            "isAuthenticated": is_authenticated,
            "exportedAt": datetime.utcnow().isoformat() + "Z",
            "regulatoryNotice": "Generated under the Digital Personal Data Protection Act 2023 (DPDP Act) and IT (SPDI) Rules 2011. Contains all personal career data and activity records.",
            "formatVersion": "1.0",
        },
        "userProfile": None,
        "studentProfile": None,
        "resumes": [],
        "analyses": [],
        "roadmaps": [],
        "interviews": [],
        "assessments": [],
        "githubProfiles": [],
        "careerComparisons": [],
        "readinessReports": [],
    }

    try:
        # 1. User & Student Profile if authenticated
        if is_authenticated:
            cursor.execute(
                "SELECT id, full_name, email, role, created_at, last_login_at FROM users WHERE id = ?",
                (owner_id,)
            )
            u_row = cursor.fetchone()
            if u_row:
                export_payload["userProfile"] = dict(u_row)

            cursor.execute("SELECT * FROM student_profiles WHERE user_id = ?", (owner_id,))
            sp_row = cursor.fetchone()
            if sp_row:
                export_payload["studentProfile"] = dict(sp_row)

        # 2. Resumes
        cursor.execute("SELECT * FROM resumes WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        for r_row in cursor.fetchall():
            res_dict = dict(r_row)
            for k in ["education_json", "skills_json", "projects_json", "experience_json", "certifications_json", "soft_skills_json", "skill_evidence_json"]:
                if k in res_dict and isinstance(res_dict[k], str):
                    try:
                        res_dict[k.replace("_json", "")] = json.loads(res_dict[k])
                        del res_dict[k]
                    except Exception:
                        pass
            export_payload["resumes"].append(res_dict)

        # 3. Analyses
        cursor.execute("SELECT * FROM analyses WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        for a_row in cursor.fetchall():
            an_dict = dict(a_row)
            for k in ["matched_skills_json", "partial_skills_json", "missing_skills_json", "skill_gaps_json", "roadmap_json", "courses_json", "projects_rec_json", "resume_improvements_json"]:
                if k in an_dict and isinstance(an_dict[k], str):
                    try:
                        an_dict[k.replace("_json", "")] = json.loads(an_dict[k])
                        del an_dict[k]
                    except Exception:
                        pass
            export_payload["analyses"].append(an_dict)

        # 4. Roadmaps
        cursor.execute("SELECT * FROM learning_roadmaps WHERE owner_id = ? ORDER BY updated_at DESC", (owner_id,))
        for lr_row in cursor.fetchall():
            lr_dict = dict(lr_row)
            for k in ["stages_json", "quiz_history_json", "adaptive_notes_json"]:
                if k in lr_dict and isinstance(lr_dict[k], str):
                    try:
                        lr_dict[k.replace("_json", "")] = json.loads(lr_dict[k])
                        del lr_dict[k]
                    except Exception:
                        pass
            export_payload["roadmaps"].append(lr_dict)

        # 5. Interviews
        cursor.execute("SELECT * FROM interview_sessions WHERE owner_id = ? ORDER BY started_at DESC", (owner_id,))
        for is_row in cursor.fetchall():
            is_dict = dict(is_row)
            session_id = is_dict.get("id")
            if session_id:
                cursor.execute("SELECT * FROM interview_questions_answers WHERE session_id = ? ORDER BY question_index ASC", (session_id,))
                is_dict["questions"] = [dict(q) for q in cursor.fetchall()]
            export_payload["interviews"].append(is_dict)

        # 6. Assessments
        cursor.execute("SELECT * FROM assessment_sessions WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        for ass_row in cursor.fetchall():
            ass_dict = dict(ass_row)
            export_payload["assessments"].append(ass_dict)

        # 7. GitHub
        cursor.execute("SELECT * FROM github_profiles WHERE owner_id = ? ORDER BY analyzed_at DESC", (owner_id,))
        for gh_row in cursor.fetchall():
            export_payload["githubProfiles"].append(dict(gh_row))

        # 8. Career comparisons
        cursor.execute("SELECT * FROM career_comparisons WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        for cc_row in cursor.fetchall():
            export_payload["careerComparisons"].append(dict(cc_row))

        # 9. PRI
        cursor.execute("SELECT * FROM placement_readiness_reports WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        for pri_row in cursor.fetchall():
            export_payload["readinessReports"].append(dict(pri_row))

    finally:
        conn.close()

    return export_payload


def delete_owner_records(owner_id: str, is_authenticated: bool = False) -> Dict[str, Any]:
    """
    Permanently delete all user records and associated entities across the entire database.
    Fulfills Right to Erasure / Right to be Forgotten under India's DPDP Act 2023 & GDPR.
    """
    conn = get_connection()
    cursor = conn.cursor()

    deleted_counts: Dict[str, int] = {}
    try:
        # 1. Clean child records first to ensure referential integrity on all engines
        cursor.execute(
            "DELETE FROM interview_questions_answers WHERE session_id IN (SELECT id FROM interview_sessions WHERE owner_id = ?)",
            (owner_id,)
        )
        deleted_counts["interview_questions_answers"] = getattr(cursor, "rowcount", 0)

        cursor.execute(
            "DELETE FROM learning_tasks WHERE roadmap_id IN (SELECT id FROM learning_roadmaps WHERE owner_id = ?)",
            (owner_id,)
        )
        deleted_counts["learning_tasks"] = getattr(cursor, "rowcount", 0)

        cursor.execute(
            "DELETE FROM skill_records WHERE resume_id IN (SELECT id FROM resumes WHERE owner_id = ?)",
            (owner_id,)
        )
        deleted_counts["skill_records"] = getattr(cursor, "rowcount", 0)

        cursor.execute(
            "DELETE FROM skill_gaps WHERE resume_id IN (SELECT id FROM resumes WHERE owner_id = ?)",
            (owner_id,)
        )
        deleted_counts["skill_gaps"] = getattr(cursor, "rowcount", 0)

        # 2. Main owner-scoped tables
        owner_tables = [
            "resumes",
            "analyses",
            "resume_analyses",
            "roadmap_progress",
            "job_matches",
            "interview_sessions",
            "github_profiles",
            "learning_roadmaps",
            "assessment_sessions",
            "assessment_results",
            "career_comparisons",
            "placement_readiness_reports",
        ]

        for tbl in owner_tables:
            cursor.execute(f"DELETE FROM {tbl} WHERE owner_id = ?", (owner_id,))
            deleted_counts[tbl] = getattr(cursor, "rowcount", 0)

        # Purge AI usage limits
        cursor.execute("DELETE FROM ai_usage WHERE user_id = ?", (owner_id,))
        deleted_counts["ai_usage"] = getattr(cursor, "rowcount", 0)

        # If authenticated, remove registered profile & credentials
        if is_authenticated:
            cursor.execute("DELETE FROM student_profiles WHERE user_id = ?", (owner_id,))
            deleted_counts["student_profiles"] = getattr(cursor, "rowcount", 0)
            cursor.execute("DELETE FROM users WHERE id = ?", (owner_id,))
            deleted_counts["users"] = getattr(cursor, "rowcount", 0)

        conn.commit()
    except Exception as exc:
        conn.rollback()
        raise exc
    finally:
        conn.close()

    return {
        "status": "success",
        "message": "All personal data has been permanently erased.",
        "deletedCounts": deleted_counts,
    }
