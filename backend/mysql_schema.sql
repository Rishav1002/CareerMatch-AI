-- ============================================================================
-- CareerMatch AI — Normalized Relational Database Schema
-- Includes all 17 core tables with foreign keys, JSON columns, and indexes.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS careermatch_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE careermatch_ai;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL DEFAULT 'student',
    created_at VARCHAR(40) NOT NULL,
    last_login_at VARCHAR(40),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. student_profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    education_degree VARCHAR(160),
    institution VARCHAR(160),
    graduation_year VARCHAR(20),
    experience_level VARCHAR(60) DEFAULT 'Entry Level / Final Year',
    target_role VARCHAR(120) NOT NULL DEFAULT 'Full Stack Developer',
    secondary_roles_json JSON,
    preferred_locations_json JSON,
    target_companies_json JSON,
    github_username VARCHAR(100),
    linkedin_url VARCHAR(255),
    active_resume_id VARCHAR(64),
    pri_weights_json JSON,
    updated_at VARCHAR(40) NOT NULL,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. resumes
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    candidate_name VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    phone VARCHAR(60),
    location VARCHAR(120),
    filename VARCHAR(160) NOT NULL,
    raw_text LONGTEXT NOT NULL,
    summary TEXT,
    education_json JSON NOT NULL,
    skills_json JSON NOT NULL,
    projects_json JSON NOT NULL,
    experience_json JSON NOT NULL,
    certifications_json JSON NOT NULL,
    soft_skills_json JSON NOT NULL,
    skill_evidence_json JSON NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_resumes_user (user_id),
    INDEX idx_resumes_created (created_at)
) ENGINE=InnoDB;

-- 4. resume_analyses (also mapped to analyses for backward compatibility)
CREATE TABLE IF NOT EXISTS resume_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64) NOT NULL,
    candidate_name VARCHAR(120) NOT NULL,
    target_role VARCHAR(120) NOT NULL,
    goal_company VARCHAR(120) NOT NULL,
    overall_score DOUBLE NOT NULL,
    technical_score DOUBLE NOT NULL,
    projects_score DOUBLE NOT NULL,
    education_score DOUBLE NOT NULL,
    certifications_score DOUBLE NOT NULL,
    soft_skills_score DOUBLE NOT NULL,
    ats_score DOUBLE DEFAULT 0.0,
    mandatory_met_pct DOUBLE NOT NULL,
    preferred_met_pct DOUBLE NOT NULL,
    matched_skills_json JSON NOT NULL,
    partial_skills_json JSON NOT NULL,
    missing_skills_json JSON NOT NULL,
    skill_gaps_json JSON NOT NULL,
    roadmap_json JSON NOT NULL,
    courses_json JSON NOT NULL,
    projects_rec_json JSON NOT NULL,
    resume_improvements_json JSON NOT NULL,
    ats_report_json JSON,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_analyses_resume (resume_id),
    INDEX idx_analyses_user (user_id),
    CONSTRAINT fk_analysis_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. job_listings
CREATE TABLE IF NOT EXISTS job_listings (
    id VARCHAR(80) PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    company_name VARCHAR(160) NOT NULL,
    location VARCHAR(120) NOT NULL,
    work_mode VARCHAR(40) NOT NULL,
    experience_level VARCHAR(60) NOT NULL,
    salary_range VARCHAR(120),
    role_category VARCHAR(100) NOT NULL,
    required_skills_json JSON NOT NULL,
    preferred_skills_json JSON,
    description_summary TEXT,
    apply_url VARCHAR(500),
    data_source VARCHAR(120) NOT NULL,
    posted_at VARCHAR(40) NOT NULL,
    fetched_at VARCHAR(40) NOT NULL,
    INDEX idx_jobs_role (role_category),
    INDEX idx_jobs_mode (work_mode)
) ENGINE=InnoDB;

-- 6. job_matches
CREATE TABLE IF NOT EXISTS job_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(80) NOT NULL,
    match_score DOUBLE NOT NULL,
    matched_skills_json JSON NOT NULL,
    missing_skills_json JSON NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_job_matches_resume (resume_id),
    CONSTRAINT fk_jm_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. skill_records
CREATE TABLE IF NOT EXISTS skill_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(60) DEFAULT 'Technical',
    proficiency_level VARCHAR(40) DEFAULT 'Detected',
    verified_by_github TINYINT(1) DEFAULT 0,
    verified_by_assessment TINYINT(1) DEFAULT 0,
    evidence_text TEXT,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_skills_resume (resume_id),
    CONSTRAINT fk_sr_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. skill_gaps
CREATE TABLE IF NOT EXISTS skill_gaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    target_role VARCHAR(120) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    requirement_tier VARCHAR(40) NOT NULL,
    priority_rank INT NOT NULL,
    estimated_duration VARCHAR(60),
    adjacent_skill VARCHAR(100),
    why_it_matters TEXT,
    practical_exercise TEXT,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_gaps_resume (resume_id)
) ENGINE=InnoDB;

-- 9. interview_sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64),
    target_role VARCHAR(120) NOT NULL,
    goal_company VARCHAR(120),
    interview_round VARCHAR(60) NOT NULL,
    difficulty VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
    total_questions INT NOT NULL DEFAULT 5,
    answered_count INT NOT NULL DEFAULT 0,
    overall_score DOUBLE DEFAULT 0.0,
    technical_score DOUBLE DEFAULT 0.0,
    communication_score DOUBLE DEFAULT 0.0,
    relevance_score DOUBLE DEFAULT 0.0,
    problem_solving_score DOUBLE DEFAULT 0.0,
    confidence_indicator_score DOUBLE DEFAULT 0.0,
    improvement_plan_json JSON,
    started_at VARCHAR(40) NOT NULL,
    completed_at VARCHAR(40),
    INDEX idx_interview_user (user_id),
    INDEX idx_interview_resume (resume_id)
) ENGINE=InnoDB;

-- 10. interview_questions_answers
CREATE TABLE IF NOT EXISTS interview_questions_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    question_index INT NOT NULL,
    question_text TEXT NOT NULL,
    question_context VARCHAR(255),
    expected_topics_json JSON,
    candidate_answer TEXT,
    input_mode VARCHAR(30) DEFAULT 'text',
    time_taken_seconds INT DEFAULT 0,
    score DOUBLE DEFAULT 0.0,
    technical_score DOUBLE DEFAULT 0.0,
    communication_score DOUBLE DEFAULT 0.0,
    relevance_score DOUBLE DEFAULT 0.0,
    problem_solving_score DOUBLE DEFAULT 0.0,
    confidence_indicator DOUBLE DEFAULT 0.0,
    feedback_text TEXT,
    mistakes_json JSON,
    sample_answer TEXT,
    follow_up_question TEXT,
    answered_at VARCHAR(40),
    INDEX idx_iqa_session (session_id),
    CONSTRAINT fk_iqa_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. github_profiles
CREATE TABLE IF NOT EXISTS github_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64),
    github_username VARCHAR(100) NOT NULL,
    data_source VARCHAR(80) NOT NULL,
    public_repos_count INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    portfolio_strength_score DOUBLE NOT NULL,
    verified_skills_json JSON NOT NULL,
    unverified_resume_skills_json JSON NOT NULL,
    top_languages_json JSON NOT NULL,
    repositories_json JSON NOT NULL,
    readme_quality_report_json JSON NOT NULL,
    recommended_projects_json JSON NOT NULL,
    analyzed_at VARCHAR(40) NOT NULL,
    INDEX idx_gh_user (github_username),
    INDEX idx_gh_resume (resume_id)
) ENGINE=InnoDB;

-- 12. learning_roadmaps
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64) NOT NULL,
    target_role VARCHAR(120) NOT NULL,
    overall_progress_pct DOUBLE NOT NULL DEFAULT 0.0,
    weekly_hours_goal INT NOT NULL DEFAULT 10,
    stages_json JSON NOT NULL,
    quiz_history_json JSON,
    adaptive_notes_json JSON,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_lr_resume (resume_id, target_role)
) ENGINE=InnoDB;

-- 13. learning_tasks
CREATE TABLE IF NOT EXISTS learning_tasks (
    id VARCHAR(80) PRIMARY KEY,
    roadmap_id VARCHAR(64) NOT NULL,
    stage_index INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    estimated_hours DOUBLE DEFAULT 2.0,
    cadence VARCHAR(30) DEFAULT 'Weekly',
    is_adaptive_remediation TINYINT(1) DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    completed_at VARCHAR(40),
    INDEX idx_lt_roadmap (roadmap_id),
    CONSTRAINT fk_lt_roadmap FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. assessment_sessions
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64),
    topic VARCHAR(80) NOT NULL,
    difficulty VARCHAR(40) NOT NULL,
    questions_json JSON NOT NULL,
    coding_challenge_json JSON,
    status VARCHAR(40) NOT NULL DEFAULT 'generated',
    created_at VARCHAR(40) NOT NULL,
    completed_at VARCHAR(40),
    INDEX idx_as_resume (resume_id)
) ENGINE=InnoDB;

-- 15. assessment_results
CREATE TABLE IF NOT EXISTS assessment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    resume_id VARCHAR(64),
    topic VARCHAR(80) NOT NULL,
    difficulty VARCHAR(40) NOT NULL,
    overall_score DOUBLE NOT NULL,
    mcq_score DOUBLE NOT NULL,
    coding_score DOUBLE NOT NULL,
    correct_count INT NOT NULL,
    total_questions INT NOT NULL,
    evaluation_mode VARCHAR(120) NOT NULL,
    question_reviews_json JSON NOT NULL,
    coding_review_json JSON,
    weak_subtopics_json JSON,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_ar_resume (resume_id),
    CONSTRAINT fk_ar_session FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. career_comparisons
CREATE TABLE IF NOT EXISTS career_comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64),
    primary_role VARCHAR(120) NOT NULL,
    compared_roles_json JSON NOT NULL,
    comparison_matrix_json JSON NOT NULL,
    transition_bridge_json JSON NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_cc_resume (resume_id)
) ENGINE=InnoDB;

-- 17. placement_readiness_reports
CREATE TABLE IF NOT EXISTS placement_readiness_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    resume_id VARCHAR(64) NOT NULL,
    target_role VARCHAR(120) NOT NULL,
    pri_score DOUBLE NOT NULL,
    readiness_tier VARCHAR(80) NOT NULL,
    technical_score DOUBLE NOT NULL,
    resume_quality_score DOUBLE NOT NULL,
    interview_score DOUBLE NOT NULL,
    portfolio_score DOUBLE NOT NULL,
    assessment_score DOUBLE NOT NULL,
    market_alignment_score DOUBLE NOT NULL,
    weights_json JSON NOT NULL,
    category_breakdown_json JSON NOT NULL,
    strengths_json JSON NOT NULL,
    weaknesses_json JSON NOT NULL,
    next_actions_json JSON NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_pri_resume (resume_id)
) ENGINE=InnoDB;
