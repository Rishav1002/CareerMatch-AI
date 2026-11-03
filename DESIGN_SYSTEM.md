# CareerMatch AI Design System: "Career Field Guide"

> **Design Direction**: A calm editorial tool for people making high-stakes career decisions. Think a well-set atlas or architectural ledger: confident typography, warm paper neutrals, deep mineral ink, data as the hero, and mathematical explainability.

---

## 1. Design Tokens

### Color Palette

| Token | Light Theme ("Warm Paper") | Dark Theme ("Mineral Ink") | Contrast (WCAG AA) | Purpose |
|---|---|---|---|---|
| `--bg-canvas` | `#FBF9F5` (Warm Cream) | `#121417` (Deep Slate Ink) | — | Document canvas |
| `--bg-card` | `#FFFFFF` (Pure White) | `#181B20` (Ink Card) | 14.5:1 (AAA) | Surface containers |
| `--bg-raised` | `#F5F2EB` (Warm Parchment) | `#20242B` (Layer 2 Surface) | 12:1 (AAA) | Table headers, toolbars |
| `--bg-sunken` | `#EFEBE1` (Sunken Paper) | `#15181D` (Well Container) | — | Inputs, code blocks |
| `--border-subtle` | `#E5DFD3` (Hairline Rule) | `#2C323C` (Steel Rule) | 3.1:1 | Dividers, card edges |
| `--text-primary` | `#1E1B18` (Charcoal Ink) | `#F3EFEA` (Warm Parchment) | 14.5:1 (AAA) | Headings, large scores |
| `--text-secondary` | `#57524A` (Warm Graphite) | `#A6A095` (Warm Ash) | 6.2:1 (AA) | Body, explanations |
| `--brand-accent` | `#B84D2B` (Terracotta Rust) | `#E06D46` (Bright Terracotta) | 4.8:1 (AA) | Primary CTA, links, focus |
| `--brand-subtle` | `#FDF1ED` | `#2B1D17` | — | Accent fill & active tabs |

### Status Signals (Differentiated by Icon, Shape & Hue)

| Status | Icon Prefix | Shape | Light Hex | Dark Hex |
|---|---|---|---|---|
| **Matched Requirement** | `● [✓]` | Solid Circle / Pill | `#15803D` (Pine) | `#4ADE80` |
| **Partial / Adjacent Skill** | `◆ [▲]` | Chamfered Diamond / Square | `#B45309` (Ochre) | `#FBBF24` |
| **Missing / Skill Gap** | `⬡ [✕]` | Sharp Box / Octagon | `#B91C1C` (Crimson) | `#F87171` |
| **Informational Note** | `■ [ℹ]` | Square | `#1D4ED8` (Navy) | `#60A5FA` |

### Typography Scale

- **Display Serif**: `Newsreader`, `Fraunces`, `Georgia`, serif (for display titles, score numerals, report hero).
- **UI Grotesque**: `Plus Jakarta Sans`, system-ui, sans-serif (for navigation, tables, forms, UI elements).
- **Data Mono**: `JetBrains Mono`, monospace (for IDs, metrics, code, scores with `font-variant-numeric: tabular-nums`).

Scale via `clamp()`:
- Display: `clamp(2rem, 3.2vw + 1rem, 3.25rem)`
- H1: `clamp(1.6rem, 2.2vw + 0.8rem, 2.25rem)`
- H2: `clamp(1.3rem, 1.4vw + 0.6rem, 1.65rem)`
- Body: `clamp(0.95rem, 0.2vw + 0.9rem, 1rem)` (15-16px, 60-72ch measure)
- Captions: `0.875rem` (min 14px)

### Radii & Spacing Grid

- Grid: 8px rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`)
- Radii: strictly 2-3 radii max:
  - `--radius-sm: 4px` (chips, code, badges)
  - `--radius-md: 6px` (buttons, inputs)
  - `--radius-lg: 10px` (cards, dialogs)
- Elevation: Hairline borders (`1px solid var(--border-subtle)`) over heavy drop shadows.

---

## 2. Component Guidelines

### Buttons
- **Primary**: Terracotta background (`#B84D2B`), white text, crisp 1px border. Reserved for primary flow progression (e.g., "Run Explainable Match", "Save Profile").
- **Secondary**: Card white background, subtle hairline border, dark text.
- **Ghost**: Transparent background, text only, subtle hover tint.
- **Danger**: Crimson tint and border.

### Ledger Data Tables
- Every numeric metric must use `font-variant-numeric: tabular-nums` to maintain vertical alignment.
- Alternating subtle row backgrounds on hover.
- On screens under 768px, tables automatically transform into stacked card-cells with accessible labels.

### Gauges & Data Viz
- Custom inline SVG elements with accessible text fallbacks (`role="img" aria-label="..."`).
- Color coding matches the signal system (Forest Pine for 70%+, Ochre Amber for 40-69%, Crimson for <40%).

---

## 3. Do's and Don'ts

| Do | Don't |
|---|---|
| **DO** show the mathematical formulas and evidence quotes behind every score. | **DON'T** display arbitrary, unexplained percentages. |
| **DO** use warm paper neutrals and deep mineral ink with hairline rules. | **DON'T** use purple-to-blue gradients, glowing orbs, or glassmorphism. |
| **DO** differentiate status badges by icon and shape (Circle, Diamond, Octagon). | **DON'T** rely solely on color hue to communicate status. |
| **DO** respect `prefers-reduced-motion` and disable all non-essential animation. | **DON'T** use heavy 3D transforms or bouncing entrance animations. |
| **DO** write plain, encouraging, and specific copy with quantifiable next steps. | **DON'T** use marketing slogans, lorem filler copy, or rocket illustrations. |
| **DO** maintain 44px minimum touch targets on mobile devices. | **DON'T** cram desktop multi-column tables onto mobile screens without wrapping. |
