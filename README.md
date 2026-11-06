# CareerMatch AI

> Explainable career-readiness intelligence, deterministic skill verification, and placement benchmarking platform for engineering students and early-career software professionals.

<div align="center">

[![Live Application](https://img.shields.io/badge/🌐%20Live%20App-carrermatch--ai.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://carrermatch-ai.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Rishav1002/CarrerMatch)

<br/>

[![Python 3.12.8](https://img.shields.io/badge/Python-3.12.8-3776AB?logo=python&logoColor=white)](.python-version)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL / Neon](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA%20Compliant-success)](#design-system--accessibility)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<br/>

👉 **[🚀 Launch CareerMatch AI Live in Browser →](https://carrermatch-ai.onrender.com)** 👈

</div>

---

## Architecture & System Overview

CareerMatch AI combines semantic resume extraction with deterministic scoring algorithms, grounded AI coaching, real-time live market intelligence, and placement readiness indexing.

```
                              ┌──────────────────────────────────────────────┐
                              │            Vanilla ES-Module Client          │
                              │  (Tokens CSS · Router · Left Rail · Views)   │
                              └──────────────────────┬───────────────────────┘
                                                     │ HTTP / JSON (REST)
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │               FastAPI Backend                │
                              │       (Security Headers · JWT Auth)          │
                              └───────┬──────────────┬──────────────┬────────┘
                                      │              │              │
                   ┌──────────────────┘              │              └──────────────────┐
                   ▼                                 ▼                                 ▼
   ┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌──────────────────────────────┐
   │       Matching Engine        │   │    Live Market Aggregator    │   │      Cold-Start Resilient    │
   │  · Deterministic Scoring     │   │  · Remotive API              │   │         Database Layer       │
   │  · Evidence Ledger Quotes    │   │  · Arbeitnow API             │   │  · Neon PostgreSQL (psycopg2)│
   │  · 41+ Categorized Roles     │   │  · Adzuna Provider Adapter   │   │  · SQLite Auto-Fallback      │
   │  · AST Python Verification   │   │  · 24h Neon Cache (TTL)      │   │  · Reconnect Retry Loop      │
   └──────────────────────────────┘   └──────────────────────────────┘   └──────────────────────────────┘
```

---

## Key Modules & Capabilities

### 1. Unified Navigation Shell & Routing
- **Authoritative Route Registry (`router.js`)**: Maps every route cleanly to its view panel, document title, and data loader.
- **Empty State Integrity**: Prevents broken calculations or blank states when no resume has been uploaded; renders a clean action card guiding users to upload their CV.
- **Desktop Collapsible Left Rail (`#appRail`)**: Grouped into 5 logical stages:
  - **Overview**: Central metrics, profile summary, quick-action cards (`#/dashboard`).
  - **Diagnose**: Multi-format Resume Matcher (`#/analyzer`), Evidence Ledger & Gaps (`#/report`), ATS Scanner (`#/ats`).
  - **Prepare**: 4-Phase Adaptive Roadmap (`#/roadmap`), 7-Day Study Planner (`#/planner`), AST Skill Assessment (`#/skills`), AI Mock Interview Coach (`#/interview`).
  - **Prove**: Live GitHub Commit Verification (`#/github`).
  - **Decide**: 6-Pillar Placement Readiness Index (`#/readiness`), Live Job Market Intelligence (`#/market`), Career & Salary Bridge (`#/compare`), Application Kanban Tracker (`#/tracker`).
- **Minimal Topbar**: Breadcrumb title, Command Palette (⌘K), Ask AI advisor with live usage meter, and Avatar dropdown menu.
- **Mobile Bottom Navigation**: Instant thumb-reachable access to top workflows on viewports under 768px.

### 2. Multi-Format Resume & Requirement Engine
- Supports **PDF** (`PyMuPDF` / `fitz` + `pypdf`), **DOCX** (`python-docx`), and plain text.
- Extracts technical skills, projects, work experience, education, and credentials without hallucination.
- Evaluates resumes against 41 comprehensively modeled tech roles across Software Engineering, Data & AI, Cloud & DevOps, Systems & Embedded, Cyber Security, Mobile, QA, Product, and Emerging Tech.
- Supports custom user-defined roles with dynamic requirements generation.

### 3. Real, Live Job Market Intelligence (`/api/jobs/market`)
- Extensible multi-provider architecture (`backend/jobs/providers/`):
  - **Remotive Provider**: Remote engineering roles with tech tags.
  - **Arbeitnow Provider**: European and international listings with visa/remote sponsorship filters.
  - **Adzuna Provider**: High-volume market queries with salary and location grounding.
- Neon Postgres `job_listings` cache with 24-hour TTL prevents provider rate-limiting and ensures millisecond response times.

### 4. Context-Aware Ask AI Advisor (`/api/ai/ask`)
- Slide-out interactive career advisor grounded in the candidate's active resume and target role.
- Enforces atomic rate-limiting stored in the database (`ai_usage` table):
  - **5 queries / day** for guest sessions.
  - **20 queries / day** for registered students.
- Returns HTTP 429 with explicit reset timestamps when quotas are exhausted.

### 5. Design System & Accessibility
- Strict token-only theme (`frontend/css/tokens.css`) supporting Warm Paper (Light) and Deep Ink (Dark).
- Flash-of-unstyled-content (FOUC) eliminated via an inline synchronous `<head>` script.
- **100% WCAG 2.1 AA Compliant**: All text/background and button contrast ratios exceed 4.5:1 (scores reach up to 17:1), verified via automated color-contrast test suite (`scripts/check_contrast.py`).
- Fluid layout without arbitrary fixed caps; adapts gracefully from 360px mobile screens to 3440px ultrawide displays.

---

## Production Deployment (Render + Neon)

CareerMatch AI is engineered for zero-compilation, zero-breakage continuous deployment from GitHub to Render with serverless Neon Postgres.

### 1. Environment Variables Configuration

Set the following variables in your **Render Web Service** dashboard:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `GEMINI_API_KEY` | Google Gemini API Key for grounded LLM coaching | `AIzaSy...` |
| `JWT_SECRET` | Secret key for signing student JWT auth tokens | Any secure 64-char string |
| `APP_ENV` | Application environment flag | `production` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `https://carrermatch-ai.onrender.com` |
| `ADZUNA_APP_ID` | *(Optional)* Adzuna Job Market App ID | Custom API ID |
| `ADZUNA_APP_KEY` | *(Optional)* Adzuna Job Market API Key | Custom API Key |

### 2. Render Deployment Settings

- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Python Version**: Pinned to `3.12.8` via `.python-version`

### 3. Neon Cold-Start & Free-Tier Resilience
Render free-tier instances sleep when idle, and Neon serverless databases auto-suspend after periods of inactivity. CareerMatch AI handles this via:
- Built-in exponential backoff connection retry loop in `backend/database.py` (3 attempts with 1.5s backoff).
- `/api/health` connectivity probe that verifies active database queries (`SELECT 1;`).
- Frontend connection status banner notifying the user that the server is waking up instead of failing abruptly.

---

## Local Development & Setup

### Prerequisites
- Python 3.12+
- Git

### 1. Clone & Set Up Virtual Environment

```bash
git clone https://github.com/Rishav1002/CarrerMatch.git
cd CareerMatch

python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

All dependencies are pinned to pre-compiled wheels for Python 3.12:

```bash
pip install -r requirements.txt
```

### 3. Run the Development Server

```bash
uvicorn backend.main:app --reload --port 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Automated Test Suite

Run the complete test suite locally:

```bash
# Run unit, route architecture, and endpoint tests:
python scripts/run_tests.py

# Run frontend ES module and end-to-end smoke tests:
node scripts/smoke_frontend.mjs

# Run automated WCAG 2.1 AA color-contrast audits:
python scripts/check_contrast.py

# Run view text density and word budget audit:
python scripts/audit_views_text.py
```

---

## Security & Compliance
- **Security Headers**: Standard production middleware enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **JWT Protection**: Production boot fails fast if `JWT_SECRET` is left as the default placeholder.
- **Privacy Controls**: "Don't save my resume" toggle skips persistence of candidate CVs to the database.

---

## License

CareerMatch AI is open-source software licensed under the [MIT License](LICENSE).
