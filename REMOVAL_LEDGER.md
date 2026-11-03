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

## 3. Deprecated & Unified Navigation Systems
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
- Implemented exponential backoff connection retry loop for Neon serverless auto-suspend and Render free-tier sleep cycles.
- Added `/api/health` endpoint with active `SELECT 1;` health probes, returning HTTP 200 when connected and HTTP 503 when the database is waking up.
- Added visual "Waking up server..." status banner and inline error retry buttons on all view fetches.
- Normalized all text files to LF line endings with `.gitattributes` and `.editorconfig`.
