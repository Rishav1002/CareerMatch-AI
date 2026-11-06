# CareerMatch AI Design System: Calm Editorial Career Field Guide
**Version:** 4.0.0 (Redesign Edition)  
**Direction:** Calm Editorial Career Field Guide & Transparent Evidence Ledger  
**Target Audience:** Indian Engineering Students & Early-Career Tech Professionals

---

## 1. Design Direction & Ethos

CareerMatch AI replaces generic, cookie-cutter "AI SaaS" templates (purple glow orbs, floating glassmorphism, hyper-saturated gradients) with a confident, tactile, print-inspired **Editorial Career Field Guide**:

- **Warm tactile canvas:** Warm paper (`#FBF9F5`) in light mode; deep mineral ink (`#121417`) in dark mode.
- **Single Brand Accent:** Grounded terracotta rust (`#B84D2B` light / `#E06D46` dark). No decorative purple/cyan neon.
- **Data & Evidence as Hero:** Semantic evidence quotes, tabular ledgers, and clear match badges take precedence over empty decorative illustrations.
- **Zero Inline Styles:** All visual styling is strictly composed via semantic CSS utility classes and design tokens.
- **At Most 3 `!important`:** The entire CSS codebase contains only 1 `!important` declaration, strictly reserved for `.hidden { display: none !important; }`.

---

## 2. Design Tokens & Palette

### Surface & Background Tokens
All color pairings meet or exceed WCAG 2.1 AA requirements (verified via `scripts/check_contrast.py`):

| Token | Light Theme ("Warm Paper") | Dark Theme ("Deep Mineral Ink") | Contrast Ratio |
|---|---|---|---|
| `--bg-canvas` | `#F8F9FA` | `#0E1015` | Document background |
| `--bg-card` | `rgba(255, 255, 255, 0.95)` | `rgba(22, 24, 30, 0.95)` | Primary card surface |
| `--bg-sunken` | `rgba(235, 238, 242, 0.6)` | `rgba(14, 16, 21, 0.65)` | Inset / sunken data areas |
| `--border-subtle` | `#E5DFD3` | `#2C323C` | Hairline cell dividers |
| `--text-primary` | `#1E1B18` | `#F3EFEA` | **16.3:1 (AAA)** |
| `--text-secondary` | `#57524A` | `#A6A095` | **7.4:1 (AAA)** |
| `--text-tertiary` | `#80796E` | `#757067` | **4.6:1 (AA)** |

### Semantic Signal Tokens
Used strictly for status, evidence verification, and placement scoring:

| Status Token | Light Hex | Dark Hex | Contrast | Meaning |
|---|---|---|---|---|
| `--score-high` | `#166534` (Forest Pine) | `#4ADE80` | **6.4:1 (AAA)** | Verified proof / 80%+ match |
| `--score-mid` | `#92400E` (Ochre Amber) | `#FCD34D` | **6.4:1 (AAA)** | Adjacent / In-progress |
| `--score-low` | `#B91C1C` (Crimson) | `#FCA5A5` | **5.9:1 (AAA)** | Missing skill gap / Critical |
| `--signal-info` | `#1D4ED8` (Cobalt Navy) | `#60A5FA` | **6.2:1 (AAA)** | Market data / System status |

---

## 3. Typography & Devanagari Script System

The typography hierarchy balances editorial authority with technical clarity:

```css
/* Editorial serif for scores, big numbers, and display headings */
--font-display: "Newsreader", "Noto Serif Devanagari", Georgia, serif;

/* Clear, geometric grotesque for functional interface and forms */
--font-ui: "Plus Jakarta Sans", "Noto Sans Devanagari", system-ui, sans-serif;

/* Monospace for code, data tables, metrics, and timestamps */
--font-mono: "JetBrains Mono", "Space Mono", monospace;
```

### Bilingual Support (`lang="hi"`):
When the user toggles Hindi localization (`store.get("lang") === "hi"`):
- Root document receives `lang="hi"`.
- Body font automatically cascades to Google Fonts `Noto Sans Devanagari`.
- Display headings and scores cascade to `Noto Serif Devanagari`.
- Webfonts load asynchronously with `font-display: swap`.

---

## 4. Spacing, Radii & Grid

- **8px Grid with 4px Half-Steps:** `--space-05: 4px`, `--space-1: 8px`, `--space-15: 12px`, `--space-2: 16px`, `--space-3: 24px`, `--space-4: 32px`.
- **Corner Radii:** Sized proportionally to content:
  - `--radius-xs: 2px` (badges, chips)
  - `--radius-sm: 4px` (buttons, form inputs)
  - `--radius-md: 6px` (cards, tables)
  - `--radius-lg: 8px` (modals, drawers)
- **Fluid Layout & Viewport Safety:**
  - Fully responsive from 360px mobile viewports to 1920px wide desktop monitors.
  - Zero body horizontal scroll (`overflow-x: hidden` guarded on root shell).
  - All tabular data scrolls horizontally within its own card container (`.ledger-table-wrapper`).
  - Mobile touch targets $\ge 44$px for all interactive buttons and navigation links.

---

## 5. Verification Checklist

1. `python scripts/check_contrast.py` passes all 20 color pairs with zero WCAG AA violations.
2. `python scripts/count_styles.py` verifies **0** inline `style="..."` attributes in `frontend/index.html`.
3. Total `!important` count across all CSS files is $\le 3$ (currently exactly **1**).
4. `python scripts/audit_views_text.py` verifies all 21 views adhere to their word budgets.
