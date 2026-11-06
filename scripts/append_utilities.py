import re

with open('frontend/css/components.css', 'r', encoding='utf-8') as f:
    content = f.read()

utilities_block = """

/* ==========================================================================
   SYSTEM UTILITY CLASSES (Zero-Inline-Style Architecture)
   ========================================================================== */

/* Display & Flexbox */
.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-flex { display: inline-flex; }
.d-flex { display: flex; }
.d-grid { display: grid; }
.flex-col { display: flex; flex-direction: column; }
.flex-row { display: flex; flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-baseline { align-items: baseline; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.gap-xs { gap: 4px; }
.gap-sm { gap: var(--space-1); }
.gap-md { gap: var(--space-2); }
.gap-lg { gap: var(--space-3); }
.gap-xl { gap: var(--space-4); }

/* Grids */
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); }
.grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-3); }
.grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-3); }
.grid-auto-fit { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-2); }

@media (max-width: 768px) {
  .grid-2, .grid-3, .grid-4, .grid-1-2, .grid-2-1 {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}

/* Sizing & Max Widths */
.w-full { width: 100%; }
.w-auto { width: auto; }
.w-180 { width: 180px; }
.min-w-200 { min-width: 200px; }
.max-w-reading { max-width: var(--container-reading); margin-left: auto; margin-right: auto; }
.max-w-hero { max-width: 840px; margin-left: auto; margin-right: auto; }
.max-w-form { max-width: 480px; margin-left: auto; margin-right: auto; }
.max-w-narrow { max-width: 760px; margin-left: auto; margin-right: auto; }
.max-w-wide { max-width: 1200px; margin-left: auto; margin-right: auto; }

/* Spacing */
.m-0 { margin: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-05 { margin-top: 4px; }
.mt-1 { margin-top: var(--space-1); }
.mt-15 { margin-top: 12px; }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }
.mb-0 { margin-bottom: 0; }
.mb-05 { margin-bottom: 4px; }
.mb-1 { margin-bottom: var(--space-1); }
.mb-15 { margin-bottom: 12px; }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }
.p-0 { padding: 0; }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.p-clamp-hero { padding: clamp(24px, 4vw, 44px); }
.p-clamp-section { padding: clamp(32px, 5vw, 64px) clamp(16px, 4vw, 48px); }

/* Typography */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.85rem; }
.text-base { font-size: 0.95rem; }
.text-md { font-size: 1.05rem; }
.text-lg { font-size: 1.25rem; }
.text-xl { font-size: 1.5rem; }
.text-2xl { font-size: 2rem; }
.text-hero { font-size: clamp(2rem, 4vw, 3rem); font-weight: 600; line-height: 1.1; }
.text-score-huge { font-size: 3.5rem; font-family: var(--font-display); line-height: 1; }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.text-accent { color: var(--brand-accent); }
.text-high { color: var(--score-high); }
.text-mid { color: var(--score-mid); }
.text-low { color: var(--score-low); }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }
.font-serif { font-family: var(--font-display); }
.font-sans { font-family: var(--font-ui); }
.font-mono { font-family: var(--font-mono); }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }
.uppercase { text-transform: uppercase; }
.tracking-wide { letter-spacing: 0.05em; }
.lh-tight { line-height: 1.2; }
.lh-relaxed { line-height: 1.6; }
.link-muted { color: var(--text-secondary); text-decoration: none; }
.link-muted:hover { color: var(--brand-accent); text-decoration: underline; }
.list-unstyled { list-style: none; padding: 0; margin: 0; }

/* Surfaces, Borders & Progress */
.border-subtle { border: 1px solid var(--border-subtle); }
.border-top { border-top: 1px solid var(--border-subtle); }
.border-bottom { border-bottom: 1px solid var(--border-subtle); }
.border-none { border: none; }
.bg-sunken { background: var(--bg-sunken); }
.bg-raised { background: var(--bg-raised); }
.bg-card { background: var(--bg-card); }
.bg-transparent { background: transparent; }
.bg-high { background: var(--score-high-bg); border: 1px solid var(--score-high-border); }
.bg-mid { background: var(--score-mid-bg); border: 1px solid var(--score-mid-border); }
.bg-low { background: var(--score-low-bg); border: 1px solid var(--score-low-border); }
.divider-h { height: 1px; width: 100%; background: var(--border-subtle); margin: var(--space-2) 0; }
.progress-track { height: 6px; background: var(--bg-sunken); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--brand-accent); transition: width 300ms ease; }
.progress-fill-high { height: 100%; background: var(--score-high); }
.progress-fill-mid { height: 100%; background: var(--score-mid); }
.progress-fill-low { height: 100%; background: var(--score-low); }
.status-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
.badge-tag { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: var(--bg-sunken); color: var(--text-secondary); border: 1px solid var(--border-subtle); display: inline-flex; align-items: center; gap: 4px; }
.cursor-pointer { cursor: pointer; }
.pos-relative { position: relative; }
.pos-absolute { position: absolute; }
.opacity-0 { opacity: 0; }
.opacity-1 { opacity: 1; }
.overflow-y-auto { overflow-y: auto; }
.max-h-480 { max-height: 480px; }
"""

if '/* ==========================================================================\n   SYSTEM UTILITY CLASSES' not in content:
    content += utilities_block
    with open('frontend/css/components.css', 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print("Added comprehensive utility classes to components.css")
else:
    print("Utility classes already present")
