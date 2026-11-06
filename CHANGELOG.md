# CHANGELOG: CareerMatch AI "Field Guide" Redesign

## [4.0.0] - 2026-11-06

### Architecture & Modularity
- **Monolith Deconstruction:** Deleted legacy 3,172-line `frontend/js/app.js` and consolidated into 11 focused ES modules in `frontend/js/modules/` (`dashboard.js`, `analyzer.js`, `report.js`, `ats.js`, `roadmap.js`, `interview.js`, `assessment.js`, `github.js`, `market.js`, `career.js`, `pri.js`).
- **Decoupled Hash Router:** Router dispatches directly to ES modules without `window.*` globals, enforcing scroll reset `(0, 0)`, focus management to headings, and empty state fallbacks for `requiresResume` views.
- **Ask AI Drawer Consolidation:** Unified Ask AI drawer into single authoritative assistant (`frontend/js/components/askAi.js`), bound to topbar button and `Ctrl+J` shortcut. Removed obsolete `floatingAskAi.js`.
- **Backend Model Fallback Cascade:** Resilient multi-model Gemini fallbacks in `backend/ai_service.py` (`gemini-2.5-flash` $\rightarrow$ `gemini-1.5-flash`), calibrated rubric scoring, and clean configuration.

### Design System & Zero Inline Styles
- **Zero Inline Styles:** Replaced all 427 inline `style="..."` attributes in `frontend/index.html` with clean semantic CSS utility classes (`frontend/css/components.css`). Current count: **0**.
- **CSS Specificity Cleanup:** Reduced `!important` occurrences from 50 across `base.css`, `layout.css`, and `styles.css` down to exactly **1** (strictly reserved for `.hidden { display: none !important; }`).
- **Devanagari Webfonts:** Added Google Fonts `Noto Sans Devanagari` and `Noto Serif Devanagari` (`font-display: swap`) with CSS font-family cascade under `[lang="hi"]`.
- **WCAG 2.1 AA Contrast:** All 20 light and dark color pairs pass WCAG 2.1 AA contrast verification (`scripts/check_contrast.py`), with text-to-canvas contrast reaching 16.3:1 (AAA).

### Page-by-Page Redesign & Text Density
- **All 21 Views Within Word Budgets:** Designed single-purpose, uncluttered layouts with strictly bounded word budgets:
  - `view-landing`: 179 words (budget $\le 200$, $\le 90$ above fold)
  - `view-login`: 37 words (budget $\le 40$)
  - `view-dashboard`: 58 words (budget $\le 60$)
  - `view-analyzer`: 59 words (budget $\le 70$)
  - `view-report`: 21 words/tab across 6 tabs (budget $\le 60$/tab)
  - `view-ats` (33w), `view-roadmap` (29w), `view-planner` (22w), `view-interview` (60w), `view-assessment` (37w), `view-github` (34w), `view-jobs` (36w), `view-tracker` (16w), `view-career` (31w), `view-pri` (40w), `view-profile` (47w), `view-settings` (40w), `view-privacy` (120w), `view-terms` (52w), `view-cookies` (41w), `view-404` (32w).
- **Anti-Slop Copy Sweep:** Purged AI marketing clichés ("Unlock your potential", "Supercharge your career", "Seamless", "10x", invented statistics).
- **Authoritative Editorial Guide:** Created `COPY_GUIDE.md` defining voice, banned phrases, approved action verbs, and bilingual localization rules.

### Localization & A11y
- **Bilingual i18n Parity:** Complete string parity in `frontend/js/i18n.js` for English and Hindi, with dynamic HTML `lang` attribute binding and topbar language toggle button (`#langToggleBtn`).
- **Safe DOM Rendering:** Verified strict HTML escaping (`escapeHtml()`) across all dynamic module renderings.
- **Accessible Landmarks:** Added skip link (`#mainContent`), proper heading hierarchies, and aria-live announcements.

---

## [3.0.0] - 2026-11-03

### Core Concept & Visual Identity Redesign
- **Transitioned from generic "AI SaaS" to calm "Career Field Guide" & Editorial Ledger**:
  - Eliminated purple-to-blue gradients, blurred glowing orbs, glassmorphism cards, and emoji icons.
  - Adopted warm paper neutrals (`#FBF9F5` light default) and deep mineral ink (`#121417` dark mode).
  - Single brand accent: Terracotta Rust (`#B84D2B` light / `#E06D46` dark).
