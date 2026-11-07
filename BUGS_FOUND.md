# CareerMatch AI: Launch Hardening Bug Register (`BUGS_FOUND.md`)

This register documents all 14 reported core bugs and additional security, architectural, and design vulnerabilities identified during systematic codebase auditing and penetration testing.

---

## 1. Bug Registry & Fix Ledger

| ID | Area | Severity | Verified Root Cause | Remediation & Fix | Atomic Commit |
|---|---|---|---|---|---|
| **BUG-09** | Security / Data Isolation | **P0 (Critical)** | Global `SELECT COUNT(*)` and unscoped queries on `resumes`, `analyses`, `interviews`, `assessments`, `ai_usage`. Shared `'guest'` identifier leaked previous visitors' records. | Implemented HMAC-signed `cm_sid` session cookies, `get_owner` dependency, strict owner scoping across all 12 tables, and legacy guest row isolation. | `061fe98` |
| **BUG-SEC-1** | Security / Auth | **P0 (Critical)** | Sequential integer enumeration on `/api/history/{id}` allowed unauthorized read and deletion of any user's analysis. | Added verified owner matching on `get_analysis_by_id` and `delete_analysis_record`; non-owners receive 404. | `061fe98` |
| **BUG-SEC-2** | Security / Config | **P0 (Critical)** | `config.py` permitted fallback to weak public secret `careermatch-ai-2-dev-secret-key-change-in-prod`. | Added production guard refusing to boot in `APP_ENV=production` if `JWT_SECRET` is missing, default, or `< 32` characters. | `061fe98` |
| **BUG-SEC-3** | Security / CORS | **P1 (High)** | Wildcard origins `["*"]` configured by default, failing to respect `CORS_ORIGINS`. | Wired `CORS_ORIGINS` parsing; defaults to strict same-origin in production mode. | `061fe98` |
| **BUG-SEC-4** | Security / Assessment | **P1 (High)** | Assessment and stage quiz payloads sent `correctIndex` and `explanation` in client JSON, allowing dev tools answer inspection. | Stripped `correctIndex` and `explanation` from client payloads. Implemented server-side grading. | `5adadcf`, `c751e5d` |
| **BUG-03** | Security / Info Disclosure | **P1 (High)** | `/api/health` leaked database type, engine, and build SHA. Banners exposed Render and Neon infrastructure. | Sanitized `/api/health` to `{"status":"ok"}` (requires `X-Health-Key` for debug). Stripped `Server` and `X-Powered-By` headers. Purged cold-start banners. | `827b32d` |
| **BUG-01** | Core Flow / Upload | **P1 (High)** | File input nested inside `role="button"` dropzone div with delayed `startApp()` timer blocking synchronous picker gestures. | Rebuilt with dedicated `Choose file` button and visually-hidden input outside dropzone, executing `input.click()` synchronously. | `5b75550` |
| **BUG-02** | Navigation / Router | **P1 (High)** | Anchor `href="#landingHowItWorks"` routed through hash router, which found no route and rendered 404. | Replaced with smooth scrolling `data-scroll-to` handler keeping URL clean. Extended `check_links.py` to audit all DOM IDs. | `1c9bca9` |
| **BUG-06** | Core Flow / Analyzer | **P1 (High)** | Uploading or pasting resume automatically invoked `runFullAnalysis()`. | Decoupled parsing from analysis. Requires explicit "Run Match Analysis" CTA with mandatory target role selection. | `eedcb71` |
| **BUG-08** | Visual / Roadmap | **P1 (High)** | `#roadmapTreeContainer` was restricted to Report view; Roadmap view `#view-roadmap` lacked diagram element. | Built `roadmapDiagram.js` ES module supporting desktop stage columns with SVG connectors and mobile vertical timeline with guided fix drawer. | `5adadcf` |
| **BUG-12** | Legal / Compliance | **P1 (High)** | Legal pages were brief stubs (<120 words). Settings lacked genuine server-side export and data erasure under DPDP Act 2023. | Authored full DPDP Act 2023/IT Act/GDPR legal policies. Implemented `/api/profile/export` and `/api/profile/delete` with browser storage notice. | `7b9d1ff` |
| **BUG-13** | Features / Jobs | **P1 (High)** | Jobs aggregator executed slow sequential fetches without cross-provider deduplication or salary normalization. | Added RemoteOK, The Muse, and Himalayas providers with concurrent `ThreadPoolExecutor` (6s timeout), deduplication hash, and INR/LPA normalizer. | `378006d` |
| **BUG-14A** | Features / Planner | **P1 (High)** | Hardcoded `DEFAULT_PLANNER_TASKS` and fake 3-day streak with decorative fire emoji. | Purged fake data. Built dynamic Plan Builder, real completion streaks, and `.ICS` calendar export. | `c751e5d` |
| **BUG-14B** | Features / Assessment | **P1 (High)** | Lack of hints and vulnerability to double submissions on completed assessment sessions. | Added on-demand tiered hints API (`POST /api/assessment/hint`) with score deductions (-25%, -50%, -75%) and double-submission guard. | `c751e5d` |
| **BUG-04** | Responsive Design | **P2 (Medium)** | Rigid `repeat(3, 1fr)` grids and inline styles caused horizontal overflow and narrow column text collapse on mobile devices. | Fluid auto-fit grid layouts, container queries, clamp typography, touch targets $\ge 44$ px, zero horizontal scroll from 320 px to 2560 px. | `efdaa52` |
| **BUG-05** | UI Polish / Surfaces | **P2 (Medium)** | Overlay surfaces reused low-opacity `--bg-card` (alpha 0.65), causing background text bleed-through on mobile rail and bottom nav. | Created dedicated `--bg-overlay` tokens with $\ge 0.92$ alpha, 20px frosted backdrop blur, saturate(160%), and opaque fallback. | `4200c46` |
| **BUG-07** | UI Architecture | **P2 (Medium)** | Duplicate Ask AI drawer and topbar button implementations; theme toggle hidden inside avatar menu. | Moved Ask AI to 3D bottom-right FAB with quota counter; placed animated theme toggle in topbar slot. | `b15a296` |
| **BUG-10** | UI Layout / i18n | **P2 (Medium)** | Avatar dropdown shifted offscreen due to relative wrapper; placeholder fake guest identity; lack of dynamic language switching. | Right-aligned menu with mobile bottom-sheet fallback, clean guest identity, and segmented English/Hindi switch. | `efdaa52` |
| **BUG-11** | Branding | **P2 (Medium)** | Brand rendered as plain text span "CM" instead of vector mark. | Generated vector SVG sprite `<symbol id="cm-logo">` from 4-armed golden vortex design brief; applied across all navigation shells. | `eabd3cd` |
| **BUG-FUNC-1** | Functionality / Fallback | **P2 (Medium)** | Modules defaulted to `SAMPLE_RESUMES[0]` (Aarav Sharma), falsely scoring unanalyzed users against sample data. | Replaced sample resume fallbacks with honest empty states or role baseline templates across all career modules. | `c751e5d` |

---

## 2. Security & Verification Sweep Summary

- **Total Bugs Logged & Remediated:** 20 bugs (14 Core + 6 Discovered).
- **Authentication & Authorization:** 100% owner-scoped database queries; guest HMAC cookie signing; sequential integer enumeration mitigated.
- **Data Minimization:** Optional `dontSave` flag fully respected; ephemeral RAM parsing; 30-day guest retention TTL enforced.
- **A11y & Standards:** WCAG 2.1 AA compliant colors verified across both light and dark themes; zero link broken (`61/61` passed).
