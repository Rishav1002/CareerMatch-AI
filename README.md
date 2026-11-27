&lt;div align=&quot;center&quot;&gt;

&lt;img
  src=&quot;https://raw.githubusercontent.com/Rishav1002/CareerMatch-AI/main/frontend/assets/favicon.svg&quot;
  alt=&quot;CareerMatch AI Logo&quot;
  width=&quot;56&quot;
  height=&quot;56&quot;
/&gt;

&lt;h1&gt;CareerMatch AI&lt;/h1&gt;

&lt;p&gt;&lt;strong&gt;Evidence-First Career Intelligence, Resume Studio &amp;amp; Placement Readiness Platform&lt;/strong&gt;&lt;/p&gt;

&lt;p&gt;
  &lt;strong&gt;Live App:&lt;/strong&gt;
  &lt;a href=&quot;https://career-match-ai-six.vercel.app/#/landing&quot;&gt;
    &lt;strong&gt;career-match-ai-six.vercel.app&lt;/strong&gt; ↗
  &lt;/a&gt;
&lt;/p&gt;

&lt;p&gt;
  &lt;a href=&quot;https://career-match-ai-six.vercel.app/#/landing&quot;&gt;
    &lt;img src=&quot;https://img.shields.io/badge/Launch%20Live%20Website-CareerMatch%20AI-B84D2B?style=for-the-badge&amp;logo=vercel&amp;logoColor=white&quot; alt=&quot;Launch Live Website&quot; /&gt;
  &lt;/a&gt;
&lt;/p&gt;

&lt;p&gt;
  &lt;a href=&quot;.python-version&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/Python-3.12-3776AB?logo=python&amp;logoColor=white&quot; alt=&quot;Python 3.12&quot; /&gt;&lt;/a&gt;
  &lt;a href=&quot;https://fastapi.tiangolo.com/&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&amp;logoColor=white&quot; alt=&quot;FastAPI&quot; /&gt;&lt;/a&gt;
  &lt;a href=&quot;https://neon.tech/&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?logo=postgresql&amp;logoColor=111827&quot; alt=&quot;Neon PostgreSQL&quot; /&gt;&lt;/a&gt;
  &lt;a href=&quot;https://ai.google.dev/&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=googlegemini&amp;logoColor=white&quot; alt=&quot;Google Gemini&quot; /&gt;&lt;/a&gt;
  &lt;a href=&quot;https://vercel.com/&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/Hosted%20on-Vercel-000000?logo=vercel&amp;logoColor=white&quot; alt=&quot;Hosted on Vercel&quot; /&gt;&lt;/a&gt;
  &lt;a href=&quot;LICENSE&quot;&gt;&lt;img src=&quot;https://img.shields.io/badge/License-MIT-blue.svg&quot; alt=&quot;License: MIT&quot; /&gt;&lt;/a&gt;
&lt;/p&gt;

&lt;/div&gt;

---

## Tech Stack & Tools

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | Vanilla ES Modules (JavaScript), Modular Tokenized CSS (`tokens.css`, `layout.css`, `views.css`), PWA Manifest & Service Worker (`sw.js`), Zero-Build Architecture |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **AI & Document Engine** | Google Gemini API (with deterministic fallback), PyMuPDF (`fitz`), `pypdf`, `python-docx`, ReportLab / HTML-to-PDF Resume Renderer |
| **Database & Auth** | Neon Serverless PostgreSQL (`psycopg2`), Automatic SQLite Fallback, JWT Auth & HMAC-Signed Guest Sessions (`HttpOnly` cookies) |
| **Job Market Providers** | Remotive, Arbeitnow, Adzuna, Himalayas, RemoteOK, The Muse (24-hour Neon TTL cache) |
| **Deployment & Hosting** | Vercel Serverless Functions (`api/`, `vercel.json`) + Neon PostgreSQL |
| **Testing & CI/CD** | GitHub Actions (`.github/workflows/test.yml`), Pytest, Node.js 20, JSDOM, Playwright (Chromium) |

---

## Architecture & System Overview

CareerMatch AI combines deterministic resume parsing and skill-gap scoring with grounded Gemini AI coaching, a live side-by-side Resume Builder, real-time multi-provider job aggregation, and placement readiness indexing.

```text
                      ┌──────────────────────────────────────────────┐
                      │           Vanilla ES-Module Client           │
                      │  Collapsible Rail · Router · Live Builder    │
                      │  Auto/Light/Dark Theme · PWA Service Worker  │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTPS / JSON (REST)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │         FastAPI on Vercel Serverless         │
                      │    Security Headers · Strict CSP · JWT Auth  │
                      └───────┬──────────────┬──────────────┬────────┘
                              │              │              │
           ┌──────────────────┘              │              └──────────────────┐
           ▼                                 ▼                                 ▼
┌────────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────────┐
│  Matching & Builder Engine │   │   Live Market Aggregator   │   │   Serverless Data Layer    │
│  · Deterministic Scoring   │   │  · Remotive & RemoteOK     │   │  · Neon PostgreSQL         │
│  · Evidence Ledger Quotes  │   │  · Arbeitnow & Himalayas   │   │  · SQLite Auto-Fallback    │
│  · 41+ Tech Roles          │   │  · Adzuna & The Muse       │   │  · Cold-Start Retry Loop   │
│  · 10 ATS Resume Templates │   │  · 24h Neon Cache (TTL)    │   │  · Owner-Based Isolation   │
└────────────────────────────┘   └────────────────────────────┘   └────────────────────────────┘
```

---

## Key Modules & Capabilities

### 1. Navigation, Layout & Design System
- **Collapsible Left Rail (`#appRail`)**: Hover-to-expand circular brand trigger with floating pill tooltips in collapsed mode, grouped into 5 workflow stages:
  - **Overview**: Dashboard metrics, score hero, and quick actions (`#/dashboard`).
  - **Diagnose**: Resume Analyzer (`#/analyzer`), Evidence & Gaps (`#/report`), ATS Simulator (`#/ats`), Resume Builder (`#/builder`).
  - **Prepare**: Branching Skill Roadmap (`#/roadmap`), Study Planner (`#/planner`), Skill Assessment (`#/skills`), Mock Interview (`#/interview`).
  - **Prove**: Live GitHub Repository Verification (`#/github`).
  - **Decide**: Placement Readiness Index (`#/readiness`), Live Jobs (`#/market`), Career & Salary Bridge (`#/compare`), Job Tracker (`#/tracker`).
- **Responsive Mobile Experience**: Fixed bottom navigation bar, right-sliding More drawer, persistent top-left brand logo, and shimmer skeleton loaders across async views.
- **Zero-FOUC Theme System**: Single-icon theme switcher cycling between **Device (Auto)**, **Light**, and **Dark** modes via `frontend/js/theme-init.js`.

### 2. Resume Analyzer, ATS Simulator & Evidence Ledger
- Parses **PDF**, **DOCX**, and plain text while stripping formatting artifacts and stray symbols.
- Evaluates resumes across **41+ technology roles** with live adjustable scoring weights, exact quote evidence, and 4-pillar ATS compatibility checks.
- Includes a **Skill Learning Hub** drawer surfacing curated free courses, paid certifications, and hands-on projects for every missing skill.

### 3. Live Resume Builder (10 Verified Templates)
- Side-by-side sticky **A4 Live Preview** (left) and **Resume Profile Editor** (right) on desktop, with an on-demand **Edit Resume** toggle on mobile/tablet.
- Includes 10 ATS-tested templates, interactive template carousel, live zoom (`Fit width`, `100%`, `85%`, `70%`), and a unified **Download** modal for **PDF** and **DOCX** export.

### 4. Branching Skill Roadmap & Skill Assessment
- Interactive branching roadmap tree with live progress spine and step completion checkboxes.
- IDE-styled Skill Assessment workspace with syntax-styled code editor, MCQ verification, and on-demand hints.

### 5. Live Job Market Intelligence (`/api/jobs/market`)
- Aggregates active roles across **Remotive**, **Arbeitnow**, **Adzuna**, **Himalayas**, **RemoteOK**, and **The Muse**.
- Caches listings in Neon PostgreSQL (`job_listings`, 24-hour TTL) for fast, resilient filtering by role, work mode, location, and skill match.

### 6. Context-Aware Ask AI Advisor (`/api/ai/ask`)
- Slide-out career advisor grounded in the active resume and target role, with database-backed daily quotas (**5 queries/day** for guests, **20 queries/day** for registered accounts).

---

## Production Deployment (Vercel + Neon PostgreSQL)

CareerMatch AI deploys continuously from GitHub to **Vercel** using `vercel.json` and the serverless FastAPI entrypoint in `api/`, backed by serverless **Neon PostgreSQL**.

### Environment Variables

Configure these in your **Vercel Project Settings → Environment Variables** (or `.env` locally):

| Variable | Required | Description |
| :--- | :--- | :--- |
| `APP_ENV` | Yes | Set to `production` in live deployments (enforces strict JWT and CORS rules). |
| `DATABASE_URL` | Yes (Prod) | Neon PostgreSQL pooled connection string (`postgresql://...?sslmode=require`). |
| `JWT_SECRET` | Yes | Cryptographic secret ($\ge 32$ chars) for signing authentication JWTs. |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key from [Google AI Studio](https://www.google.com/search?q=https%3A%2F%2Faistudio.google.com%2Fapp%2Fapikey). Falls back deterministically if unset. |
| `GEMINI_MODEL` | Optional | Primary Gemini model (default: `gemini-1.5-flash` with automatic fallback). |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins for production requests. |
| `HEALTH_KEY` | Optional | Secret header (`X-Health-Key`) for detailed `/api/health` diagnostics. |
| `GITHUB_TOKEN` | Optional | GitHub PAT (`public_repo`) to avoid public API rate limits in GitHub Check. |
| `GUEST_DATA_TTL_DAYS` | Optional | Retention window for guest sessions (default: `30` days). |

---

## Local Development & Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ (only required if running JS/Playwright tests)
- Git

### 1. Clone & Create a Virtual Environment

```bash
git clone https://github.com/Rishav1002/CareerMatch-AI.git
cd CareerMatch-AI

python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

### 3. Run Locally

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 3000 --no-server-header
```

Open [http://127.0.0.1:3000](https://www.google.com/search?q=http%3A%2F%2F127.0.0.1%3A3000) in your browser.

---

## Automated CI & Test Suite

GitHub Actions (`.github/workflows/test.yml`) runs automatically on pushes and pull requests to `main`:

```bash
# Backend unit, isolation, and API contract tests
pytest tests/test_isolation.py tests/test_contract.py

# Headless DOM boot smoke test (JSDOM)
node scripts/boot_smoke.mjs

# Real Chromium CSP & end-to-end journey tests (Playwright)
node scripts/verify_csp.mjs
node scripts/journey_test.mjs

# Post-deploy health & asset audit
python scripts/post_deploy_smoke.py --url http://127.0.0.1:3000
```

---

## Security & Privacy
- **Owner-Based Isolation**: Every endpoint scopes data to an authenticated JWT user or an HMAC-signed `cm_sid` cookie (`HttpOnly`, `SameSite=Lax`, `Secure`).
- **Strict CSP**: Zero inline `<script>` blocks or inline `on*=` event handlers in `frontend/index.html`.
- **Privacy Controls**: Supports single-click JSON data export, permanent account/data deletion, and ephemeral in-memory resume parsing ("Don't save my resume").

---

## License

CareerMatch AI is open-source software licensed under the [MIT License](https://www.google.com/search?q=LICENSE).
