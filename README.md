# CareerMatch AI

> Explainable career-readiness intelligence, deterministic skill verification, and placement benchmarking platform for engineering students and early-career software professionals.

<div align="center">

[![Live Application](https://shields.io)](https://career-match-ai-six.vercel.app/#/landing)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Rishav1002/CareerMatch)

<br/>

[![Python 3.12.8](https://img.shields.io/badge/Python-3.12.8-3776AB?logo=python&logoColor=white)](.python-version)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL / Neon](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA%20Compliant-success)](#design-system--accessibility)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<br/>

👉 **[🚀 Launch CareerMatch AI Live in Browser →](https://career-match-ai-six.vercel.app/#/landing)** 👈

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

## Production Deployment & Operational Runbook (Render + Neon)

CareerMatch AI is engineered for continuous zero-downtime deployment from GitHub to **Render Web Services** backed by serverless **Neon PostgreSQL**.

### 1. Render Service Specifications
- **Service Type**: Web Service (Python)
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT --no-server-header --proxy-headers --forwarded-allow-ips="*"`
- **Python Version**: `3.12.8` (pinned in `.python-version`)

### 2. Environment Variables Reference Table

Configure the following variables in your **Render Web Service** dashboard (**Environment** tab):

| Variable | Type | Required | Default / Description |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | String | Yes | Set to `production` in live deployments. Strict JWT length ($\ge 32$ chars) and CORS checks are enforced. |
| `DATABASE_URL` | String | Yes (Prod) | Neon PostgreSQL pooled connection string: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | String | Yes | Cryptographic secret for student JWTs. Server refuses to boot in `production` if $< 32$ chars or default. |
| `GEMINI_API_KEY` | String | Recommended | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/). Safe deterministic fallback if unset. |
| `GEMINI_MODEL` | String | Optional | Primary model: `gemini-2.0-flash` (auto-falls back to `gemini-1.5-flash` $\rightarrow$ `gemini-2.5-flash`). |
| `CORS_ORIGINS` | String | Optional | Comma-separated allowed origins (e.g. `https://careermatch-ai.onrender.com`). Strict same-origin if blank in production. |
| `HEALTH_KEY` | String | Optional | Confidential secret for viewing detailed `/api/health` database & Gemini diagnostic telemetry. |
| `GUEST_DATA_TTL_DAYS` | Integer | Optional | TTL for guest session retention (default: `30` days). Older guest records are pruned automatically. |
| `GITHUB_TOKEN` | String | Optional | Personal access token with `public_repo` scope to avoid GitHub public API rate limits. |

### 3. Google Gemini Setup & Deterministic Fallbacks
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set `GEMINI_API_KEY` in Render environment variables.
3. If `GEMINI_API_KEY` is not provided or quota limits are exceeded, CareerMatch AI functions in **deterministic fallback mode**:
   - Skills are parsed and matched deterministically against the curated catalog (`backend/resume_parser.py`).
   - Strategic bullet rewrites and courses are sourced from verified catalog mappings (`backend/resources.json`).
   - User-facing responses clearly distinguish whether advice was generated via `"ai"` or `"template"`.

### 4. Neon Database Migrations & Cold-Start Resilience
- **Additive Idempotent Migrations**: On container startup, `backend/database.py` executes additive schema updates (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). It never drops tables or deletes user data.
- **Serverless Wakeup Retry Loop**: Neon serverless databases auto-suspend after inactivity. The backend implements an exponential backoff connection loop (3 retries, 1.5s backoff) to wake the database cleanly without dropping requests.
- **Data Minimization**: Users who check "Don't save my resume" have their resumes parsed strictly in memory with zero database writes.

### 5. Troubleshooting & Rollback Runbook

#### Symptom: Buttons Show Hover Animations but Clicking Does Nothing
- **Root Cause**: An unhandled JavaScript syntax error in an imported ES module broke the module graph before event listeners attached.
- **Fix**: Run `node scripts/boot_smoke.mjs` locally to pinpoint the exact file and line number. Verify that all JavaScript modules parse cleanly.

#### Symptom: Content Security Policy (CSP) Violation in DevTools Console
- **Root Cause**: An inline `<script>` tag or inline event handler (`onclick=`, `onsubmit=`) was added to `frontend/index.html`.
- **Fix**: Never use inline scripts or handlers. Extract logic into dedicated JavaScript files (e.g. `frontend/js/theme-init.js`) and attach listeners using `addEventListener()`. Run `node scripts/verify_csp.mjs` to prove zero violations.

#### Render 1-Click Rollback Procedure
If an unexpected regression reaches production on Render:
1. Open the **Render Dashboard** and select your `careermatch-ai` Web Service.
2. Navigate to the **Events** or **Deploys** tab.
3. Locate the last known good deployment commit (e.g., `hotfix/restore-app-boot`).
4. Click the three dots `...` next to that deploy and select **Rollback to this deploy**.
5. Once rolled back, verify health immediately using the automated smoke checker:
   ```bash
   python scripts/post_deploy_smoke.py --url https://careermatch-ai.onrender.com
   ```

---

## Local Development & Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git

### 1. Clone & Set Up Virtual Environment

```bash
git clone https://github.com/Rishav1002/CareerMatch.git
cd CareerMatch

python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt -r requirements-dev.txt
npm install
```

### 3. Run the Development Server

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 3000 --no-server-header
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Test & Audit Suite

Run the complete test suite locally:

```bash
# 1. ES module syntax check & headless DOM boot smoke test:
node scripts/boot_smoke.mjs

# 2. Backend unit, isolation, and API contract test suite:
pytest tests/test_isolation.py tests/test_contract.py

# 3. Real Chrome browser CSP and security policy verification:
node scripts/verify_csp.mjs

# 4. End-to-end browser user journey test:
node scripts/journey_test.mjs

# 5. DOM ID reference and link integrity audits:
python scripts/verify_dom_ids.py
python scripts/check_links.py

# 6. Responsive multi-viewport audit (360px, 768px, 1440px):
node scripts/verify_viewports.mjs

# 7. Automated WCAG 2.1 AA color-contrast audits:
python scripts/check_contrast.py
```

---

## Security & Compliance
- **Owner-Based Isolation:** Every API endpoint verifies an `owner_id` derived either from an authenticated JWT or an HMAC-signed `cm_sid` cookie (`HttpOnly`, `SameSite=Lax`, `Secure`). Guest data and authenticated users are 100% hermetically isolated.
- **DPDP Act 2023 & GDPR Compliance:** Supports immediate single-click data export (`GET /api/profile/export`) and permanent account/data erasure (`DELETE /api/profile/delete`) directly from Settings.
- **Security Headers & Fingerprinting:** Middleware enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. Server and X-Powered-By fingerprint headers are stripped.
- **Sanitized Diagnostics:** `/api/health` returns only minimal `{"status":"ok"}` publicly; infrastructure details require secret `X-Health-Key`.
- **JWT Protection:** Production boot (`APP_ENV=production`) fails fast if `JWT_SECRET` is left as default, missing, or shorter than 32 characters.
- **Privacy Controls:** "Do not save my resume" toggle skips persistence of candidate CVs to the database (ephemeral RAM evaluation).

---

## License

CareerMatch AI is open-source software licensed under the [MIT License](LICENSE).
