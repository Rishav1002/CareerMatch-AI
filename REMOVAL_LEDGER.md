# CareerMatch AI — Architecture Cleanup & Removal Ledger

This ledger records all deprecated files, hardcoded mock profiles, legacy navigation structures, and test-data leakages removed during the production-hardening upgrade.

---

## 1. Purged Files and Test Directories
- **`samples/` Directory**: Purged completely from root.
  - `samples/sample_resume_aarav_sharma.txt` removed.
  - `samples/sample_jd_data_engineer.txt` removed.
  - Test suites refactored to read from hermetic, isolated test fixtures in `tests/fixtures/` (`test_resume.txt`, `test_jd.txt`).

---

## 2. Purged Demo Controls & UI Placeholders
- **Analyzer Demo Pills**:
  - Removed `#demoAaravBtn` ("Aarav Data Eng"), `#demoPriyaBtn` ("Priya ML Eng"), and `#demoRohanBtn` ("Rohan Java Dev").
  - Replaced with an honest first-run guidance state advising the user to upload PDF/DOCX/TXT or paste their resume.
- **Landing Page Hardcoded CTA**:
  - Removed "Try Sample Profile (Aarav Sharma) →" button (`#landingTryDemoBtn`).
  - Replaced with direct CTA "Analyze Your Resume →" leading to `#/analyzer`.
  - Replaced hardcoded Aarav Sharma target in the landing preview card with a generalized engineering benchmark.
- **Authentication Modal Demo Fast-Path**:
  - Removed `#tabDemoQuickBtn` ("1-Click Demo") and `#switchDemoAccountBtn`.
  - Auth modal now cleanly offers standard "Sign In" and "Create Account" flows with secure bcrypt password hashing and JWT issuance.
- **Pre-filled Form Inputs**:
  - Cleared `#goalCompanyInput` default value `"NexusCloud Commerce India"` (now defaults to `""` with placeholder `e.g. Infosys, TCS, Google, Startup`).
  - Cleared `#profFullName`, `#profEmail`, and `#profGithub` pre-filled student inputs.
  - Cleared `sample_jd_text` injection on `GET /api/bootstrap`.

---

## 6. Dead Python Built-in HTTP Fallback
- **`CareerMatchHTTPHandler` in `backend/main.py` (260 lines)**: Removed entirely.
  - Reason: Legacy fallback duplicating FastAPI route definitions without parity, lacking dependency injection, ownership resolution, and modern async middleware. Replaced by standard Uvicorn/FastAPI runtime pinned in production.
- **Global Insecure Wildcard CORS**: Replaced with strict environment-configured `CORS_ORIGINS`.
- **Legacy Duplicate Token Keys (`cm:v1:token`, `careermatch_jwt_token`)**: Consolidated into single standard key `cm_jwt_token`.

- **`frontend/js/app.js` (3,172 lines)**: Removed entirely.
  - Reason: Dual-architecture collision with modular ES pipeline (`main.js`). Contained 16 window globals, outdated workspace switching, and cold-boot module linking races.
  - Replaced by: 11 focused ES feature modules in `frontend/js/modules/` (`dashboard.js`, `analyzer.js`, `report.js`, `ats.js`, `roadmap.js`, `interview.js`, `assessment.js`, `github.js`, `market.js`, `career.js`, `pri.js`) exporting standard `init()`, `load()`, and `render()` contracts called directly by `router.js`.
- **`window.switchWorkspaceView`**: Retired. All navigation is driven through canonical hash routes and `router.navigate()`.

---

## 4. Duplicate Ask AI Consolidation
- **`frontend/js/components/floatingAskAi.js`**: Removed entirely.
  - Reason: Redundant second implementation that injected competing floating buttons, duplicate backdrops, separate drawers, and duplicate quota counters. Consolidated into a single unified `askAi.js` component controlled via topbar button `#askAiTopBtn` and `Ctrl/Cmd+J`.
Six competing, redundant navigation schemes were replaced by a single, canonical navigation architecture:

1. **Legacy Horizontal Topbar Links (`#topbarNav`)**: Removed in favor of the Left Rail.
2. **"More Tools" Mega-Drawer (`#moreToolsDrawer`, `#moreToolsBackdrop`)**: Removed entirely.
3. **Legacy Workspace View Switcher (`switchWorkspaceView`)**: Retired in favor of `ROUTE_REGISTRY` in `router.js`.
4. **Legacy Mobile Drawer (`#mobileDrawer`)**: Consolidated into the responsive Left Rail slide-out drawer with `#railBackdrop`.
5. **Legacy Tools Dropdown Menu (`#toolsDropdownMenu`)**: Removed.
6. **Scattered Mobile Tab Navigation**: Replaced with a unified 4-item bottom navigation bar (`<nav class="mobile-bottom-nav">`) providing instant mobile access to Dashboard, Analyzer, Roadmap, and a slide-out "More" drawer trigger (`#mobileMoreBtn`).

### Replaced By:
- **Collapsible Desktop Left Rail (`#appRail`)**:
  - Organized hierarchically into 5 functional career-readiness stages:
    - **Overview**: Dashboard (`#/dashboard`)
    - **Diagnose**: Resume Matcher (`#/analyzer`), Evidence & Gaps (`#/report`), ATS Simulator (`#/ats`)
    - **Prepare**: Adaptive Roadmap (`#/roadmap`), Study Planner (`#/planner`), Skill Assessment (`#/skills`), Mock Interview (`#/interview`)
    - **Prove**: GitHub Verification (`#/github`)
    - **Decide**: Placement Readiness Index (`#/readiness`), Live Job Market (`#/market`), Career & Salary Bridge (`#/compare`), Application Tracker (`#/tracker`)
  - Rail can be collapsed into an icon rail on desktop (`#collapseRailBtn`) and acts as a smooth slide-out drawer on tablets and mobile screens (`#mobileRailTriggerBtn`).
- **Minimal Topbar (`#appTopbar`)**:
  - Page Title / Breadcrumb (`#topbarViewTitle`).
  - Universal Search & Command Palette trigger (`#cmdPaletteTrigger` / ⌘K).
  - Context-Aware Ask AI Advisor (`#askAiTopBtn`) with real-time usage meter badge (`#askAiUsageMeter`).
  - Notification drawer trigger (`#notifTriggerBtn`).
  - User Avatar menu with Theme toggle, Hindi/English language toggle, My Profile link, and Sign In / Sign Out (`#userAvatarMenuBtn`).

---

## 4. 40+ Categorized Role Catalog & Custom Roles
- Replaced the rigid 6-role hardcoded selector with 41 comprehensively modeled tech roles across 8 domains:
  - Software Engineering (Backend Python, Java, Go, Full Stack, .NET Core, Frontend React/TS)
  - Data & AI (Data Engineer, ML Engineer, GenAI / LLM, Data Scientist, Computer Vision, NLP, MLOps, Data Analyst & BI, DBA)
  - Cloud & DevOps (Cloud/DevOps, SRE, Cloud Platform Architect, Platform/DevEx Engineer)
  - Systems & Embedded (Embedded Systems & Firmware, Rust Systems, C++ High Performance)
  - Cyber Security (Security Analyst, AppSec Engineer, Penetration Tester, SOC Analyst)
  - Mobile Engineering (Android Kotlin, iOS Swift, Cross-Platform Flutter/React Native)
  - Quality Assurance (SDET, QA Automation, Performance & Load Testing)
  - Product & Design (Technical Product Manager, UI/UX Designer, Solutions Architect)
  - Emerging Tech (Blockchain/Web3 Developer, Robotics Software Engineer)
- Added an "Other (Custom Role)..." option that reveals `#customRoleInputContainer` allowing students targeting specialized, non-standard titles to analyze custom skill requirements.

---

## 5. Live Market Data Architecture
- Replaced mock job listings with provider-adapter architecture (`backend/jobs/providers/`):
  - `RemotiveJobsProvider`: Live remote software and data engineering jobs.
  - `ArbeitnowJobsProvider`: Live tech listings with visa and remote sponsorship flags.
  - `AdzunaJobsProvider`: Live high-volume market queries with salary and location grounding.
- Neon Postgres / SQLite database caching in `job_listings` table with 24-hour TTL to prevent rate limit exhaustion and ensure fast query times.

---

## 6. Cold-Start & Database Reliability Hardening

---

## 7. Launch Hardening & Bug Fix Removals (Build 4.1)

- **Technical Cold-Start Banners (`#serverColdStartBanner`, `#apiWakeUpBanner`)**:
  - Removed technical callouts explicitly naming Render, Neon, free tier compute, database wake-up, and server instances. Replaced with unobtrusive inline skeleton loaders and quiet backoff retries.
- **Footer Build SHA Display (`#appBuildSha`) & Stack Disclosure**:
  - Removed build hash text (`Build: 1baf0b6`) and provider text from the footer. Footer now contains strictly brand, copyright, and three legal navigation links (`Privacy Policy`, `Terms of Service`, `Cookie Policy`).
- **Hardcoded Fake Study Planner Tasks & Streaks (`DEFAULT_PLANNER_TASKS`)**:
  - Purged 7 hardcoded tasks (three pre-marked completed) and fake 3-day streak with decorative fire emoji (`🔥`). Replaced with an honest empty state, dynamic Plan Builder, real timestamped streaks, and `.ICS` calendar export.
- **Client-Side Answer Leakage (`correctIndex`, `explanation`) in Assessment & Roadmap Quizzes**:
  - Stripped correct answer keys, options indexes, and full explanatory rubrics from `/api/assessment/generate` and `/api/roadmap/adaptive` quiz payloads. All grading is now strictly verified server-side.
- **Sample Resume Fallback (`SAMPLE_RESUMES[0]`) in Career Modules**:
  - Eliminated silent fallback to Aarav Sharma's resume in `start_interview_session`, `evaluate_ats_resume`, `get_adaptive_roadmap`, `compare_career_paths`, and `compute_placement_readiness_index`. Unanalyzed users are no longer evaluated against sample data.
- **Top Bar Ask AI Button (`#askAiTopBtn`)**:
  - Retired in favor of unified 3D bottom-right Floating Action Button (FAB). Slot replaced by topbar light/dark theme toggle button.
- **Native Browser Alert() Popups in Market & Settings**:
  - Replaced native modal blocking `alert()` dialogs with non-blocking toast notifications.
- Implemented exponential backoff connection retry loop for Neon serverless auto-suspend and Render free-tier sleep cycles.
- Added `/api/health` endpoint with active `SELECT 1;` health probes, returning HTTP 200 when connected and HTTP 503 when the database is waking up.
- Added visual "Waking up server..." status banner and inline error retry buttons on all view fetches.
- Normalized all text files to LF line endings with `.gitattributes` and `.editorconfig`.

---

## 6. Phase 2 & 3: Inline Styles, Specificity Clutter, and AI Slop Purge (v4.0.0)
- **427 Inline `style="..."` Attributes**:
  - Removed completely from `frontend/index.html` (count reduced from 427 to **0**).
  - Replaced with tokenized semantic CSS classes and utilities in `frontend/css/components.css`.
- **49 `!important` Overrides**:
  - Eliminated redundant `!important` overrides across `base.css` (22 removed), `layout.css` (19 removed), and `styles.css` (8 removed).
  - Total `!important` count across all CSS reduced from 50 to **1** (strictly `.hidden { display: none !important; }`).
- **AI-Slop Phrases & Invented Statistics**:
  - Purged hollow marketing buzzwords: *"Unlock your potential"*, *"Supercharge your career"*, *"Seamlessly"*, *"AI-powered"*, *"Revolutionary"*, *"10x"*.
  - Replaced with clear, verifiable technical descriptions (e.g., *"Deterministic semantic matching"*, *"Evidence quotes"*).
- **Template Seed Data**:
  - Removed hardcoded template table rows and placeholder metrics from `view-dashboard`, `view-analyzer`, and `view-interview`.
  - Empty states now render clear, clean instructions.

---

## 7. Phase 4: Production Restoration & Dev-Tools Archival (`hotfix/restore-app-boot`)
- **Archival of 26 One-off Codemod & Scratch Scripts**:
  - Moved from `scripts/` to `scripts/dev-tools/` to ensure the root `scripts/` directory only contains authoritative test runners and verified lifecycle utilities.
  - Archived files:
    - `all_style_lines.py`, `append_audit_section_8.py`, `append_utilities.py`
    - `audit_views_text.py`, `check_escaping.py`, `check_github_actions.py`
    - `clean_important.py`, `count_styles.py`, `eliminate_inline_styles.py`
    - `final_trim_budgets.py`, `fine_tune_view_budgets.py`, `fix_toast_style.py`
    - `generate_logo.py`, `inspect_unique_styles.py`, `list_all_styles.py`, `list_views.py`
    - `scan_component_ids.py`, `scan_module_ids.py`, `trim_analyzer.py`
    - `trim_view_word_budgets.py`, `update_build_tag.py`, `update_ledger.py`
    - `update_readme.py`, `update_tokens_devanagari.py`, `view_line_locations.py`
    - `browser_test_step1.mjs`
- **Active Canonical Scripts Retained in `scripts/`**:
  - `boot_smoke.mjs`: Syntax validator and JSDOM headless boot runner.
  - `journey_test.mjs`: Real-browser Chromium end-to-end user journey test.
  - `verify_csp.mjs`: Strict Content Security Policy violation detector.
  - `verify_dom_ids.py`: Comprehensive DOM ID and route reference auditor.
  - `verify_viewports.mjs`: Multi-viewport (360px, 768px, 1440px) responsive layout tester.
  - `post_deploy_smoke.py`: Production staging health, CSP, and deployed JS syntax validator.
  - `check_contrast.py`: WCAG 2.1 AA automated color contrast audit.
  - `check_links.py`: Course URL and DOM hash link verifier.
  - `run_tests.py`: Python unit and endpoint test suite runner.
