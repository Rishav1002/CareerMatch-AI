# CHANGELOG: CareerMatch AI "Field Guide" Redesign

## [3.0.0] - 2026-11-03

### Core Concept & Visual Identity Redesign
- **Transitioned from generic "AI SaaS" to calm "Career Field Guide" & Editorial Ledger**:
  - Eliminated purple-to-blue gradients, blurred glowing orbs, glassmorphism cards, and emoji icons.
  - Adopted warm paper neutrals (`#FBF9F5` light default) and deep mineral ink (`#121417` dark mode).
  - Single brand accent: Terracotta Rust (`#B84D2B` light / `#E06D46` dark).
  - Status signals now differ by icon, shape, and hue:
    - **Matched**: Solid Circle `● [✓]` in Pine Forest (`#15803D`)
    - **Partial / Adjacent**: Rounded Diamond `◆ [▲]` in Ochre Amber (`#B45309`)
    - **Missing / Gap**: Octagon / Box `⬡ [✕]` in Brick Ochre (`#B91C1C`)
  - Resolved font mismatch: Loaded and set high-character typography with `Newsreader` (display serif), `Plus Jakarta Sans` (UI grotesque), and `JetBrains Mono` (data, IDs, tabular numerals).

### Frontend Architecture & Layout Consolidation
- **Consolidated Entry Point**:
  - Deleted duplicate root `index.html`. Single source of truth is now `frontend/index.html`.
  - Replaced monolithic stylesheet with a modular, tokenized CSS architecture:
    - `tokens.css`: Color palettes, fluid typography, spacing grid, radii, elevation.
    - `base.css`: Reset, measure prose constraints, focus rings, skip link, print ledger styles.
    - `layout.css`: App shell, persistent collapsible desktop rail, mobile bottom navigation bar.
    - `components.css`: Buttons, dropzone, ledger tables, gauges, dialogs, drawers, toast.
    - `views.css`: Dedicated layouts for all 15 module views.
    - `styles.css`: Backward compatibility and bundle entry point.
- **Split JavaScript into ES Modules**:
  - `store.js`: Persistent reactive state, localStorage sync, and pub/sub event bus.
  - `api.js`: Unified API client with JWT headers, error normalization, and offline resilience.
  - `router.js`: Hash-based client router (`#/landing`, `#/dashboard`, `#/analyzer`, etc.) with bookmarkable URLs.
  - `i18n.js`: English and Hindi string tables with instant language switching.
  - `main.js`: Core orchestrator wiring shell events and components.

### 8 Priority Feature Upgrades
1. **Command Palette (`Ctrl+K` / `Cmd+K`)**: Fast modal overlay with fuzzy search across all 15 workspaces, quick actions (upload resume, load demo, toggle theme, export report), and keyboard navigation.
2. **Resume Version History & Score Diff Ledger**: Side-by-side comparison tracking resume revisions with point deltas (+14.2% pts) and newly matched skills.
3. **Application Kanban Tracker**: 4-column drag/drop pipeline (Saved, Applied, Interview, Offer) with per-job match percentages, fed directly from Job Market Intelligence.
4. **Shareable Public Scorecard & Print-Ready PDF**: Privacy-safe scorecard URL with candidate names/text scrubbed, plus bespoke `@media print` field-guide ledger printout.
5. **Weekly Study Planner**: Roadmap-derived weekly study schedule, daily completion checkboxes, and 3+ day streak tracking.
6. **Guided "Fix This" Remediation Drawers**: Slide-over drawer when clicking any skill gap in the Report or Analyzer; presents exact roadmap node, curated free & paid courses, and STAR bullet rewrites.
7. **Notifications & Field Updates Drawer**: Topbar notification bell with unread count badge, system alerts, and streak reminders.
8. **Hindi / English i18n Scaffolding**: Dual-language dictionary with live switching across all key UI landmarks.

### PWA, SEO & Security
- Added `manifest.json`, Web App Manifest icon assets (`icon-192.svg`, `icon-512.svg`), and OpenGraph meta tags.
- Implemented `sw.js` Service Worker for offline shell caching.
- Generated `sitemap.xml`.
- Added security headers (`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`) to static responses in `backend/main.py`.
