# CareerMatch AI Design System: Frosted Liquid Glass & Career Field Guide

> **Design Direction**: A calm editorial tool for engineers making high-stakes career decisions. Minimal frosted "liquid glass" surface architecture over faint contour backdrops, confident typography, terracotta and pine accents, data as the hero, and mathematical explainability.

---

## 1. Design Tokens

### Color & Surface Palette

| Token | Light Theme ("Warm Paper Glass") | Dark Theme ("Mineral Ink Glass") | Purpose |
|---|---|---|---|
| `--bg-canvas` | `#FBF9F5` (Warm Cream) | `#121417` (Deep Slate Ink) | Base document canvas |
| `--glass-bg` | `rgba(255, 255, 255, 0.65)` | `rgba(24, 27, 32, 0.65)` | Frosted glass surfaces |
| `--glass-border` | `rgba(255, 255, 255, 0.45)` | `rgba(255, 255, 255, 0.08)` | Glass panel perimeter |
| `--glass-highlight` | `inset 0 1px 0 rgba(255, 255, 255, 0.65)` | `inset 0 1px 0 rgba(255, 255, 255, 0.12)` | 3D top specular edge |
| `--glass-shadow` | `0 4px 20px rgba(0, 0, 0, 0.06)` | `0 4px 24px rgba(0, 0, 0, 0.35)` | Layered soft shadow |
| `--blur` | `blur(16px) saturate(160%)` | `blur(18px) saturate(170%)` | Frosted backdrop filter |
| `--brand-accent` | `#B84D2B` (Terracotta Rust) | `#E06D46` (Bright Terracotta) | Primary actions & accents |
| `--score-high` | `#15803D` (Forest Pine) | `#4ADE80` (Bright Pine) | High match / Verified proof |
| `--score-mid` | `#B45309` (Ochre Amber) | `#FBBF24` (Bright Amber) | Partial match / In-progress |
| `--score-low` | `#B91C1C` (Crimson) | `#F87171` (Bright Crimson) | Missing skills / Gaps |

### Radii Scale

- `--r-sm: 10px` (buttons, inputs, selects, chips, tags)
- `--r-md: 14px` (cards, panels, toasts, accordions)
- `--r-lg: 20px` (modals, command palette, dialogs, drawers)
- `--r-xl: 28px` (hero glass card, primary containers)

> **Shape Rule**: EVERY button, chip, and input is a rounded rectangle sized to its content (radius about 28% of height, max 16px). Icon-only buttons are rounded SQUARES (min 44px touch target). No pills, no circles.

---

## 2. Component Architecture

### Buttons
- **Primary**: Terracotta accent glass with pointer-following specular highlight (`--mx`, `--my`) and layered 3D inset highlight.
- **Secondary**: Neutral frosted glass with subtle border.
- **Ghost**: Transparent neutral text.
- **Danger**: Crimson tinted frosted glass.
- **Press physics**: 2px translateY travel down with spring release.

### Form Inputs & Controls
- Frosted rounded-rectangle surfaces with `--r-sm: 10px`.
- Solid tinted fallback under `prefers-reduced-transparency: reduce`.
- Category-grouped selects with "Other: type your own role" option.
- Explicit placeholder selections with disabled generator buttons until required fields are completed.

### Modals & Drawers
- Deep scrim with backdrop blur.
- Focus trap and Escape key dismissal.
- Full viewport safety on mobile devices (`min-width: 0`, `overflow-wrap: anywhere`).

---

## 3. Accessibility & Performance Guards

- All text sits on high-contrast scrims passing WCAG 2.1 AA (tested automatically via `scripts/check_contrast.py`).
- Automatic fallback to solid tinted surfaces when `prefers-reduced-transparency: reduce` or `no-backdrop-filter` is active.
- Reduced motion pauses background carousel and eliminates transitions when `prefers-reduced-motion: reduce` is detected.
- Never stack more than 2 blur layers on screen; list items use translucent solids to guarantee 60fps scrolling.
