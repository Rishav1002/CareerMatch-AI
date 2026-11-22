/**
 * Landing page ↔ product sync.
 *  - Fills the "Resume Builder" card with real template thumbnails (same renderer as the builder).
 *  - Keeps every "N templates" number on the page equal to the real catalog size.
 * Both are progressive enhancements: if anything fails the static HTML still reads correctly.
 */
import { renderResume, RESUME_TEMPLATES } from "./modules/resumeTemplates.js";

function fill() {
  try {
    document.querySelectorAll("[data-tpl-count]").forEach((el) => { el.textContent = String(RESUME_TEMPLATES.length); });

    const strip = document.getElementById("landingTplStrip");
    if (!strip || strip.childElementCount) return;
    // a spread of looks (not four of the same kind): pick evenly across the catalog
    const n = RESUME_TEMPLATES.length;
    const picks = [...new Set([0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.85)].map((i) => Math.min(n - 1, i)))];
    strip.innerHTML = picks
      .map((i) => `<div class="lp-tpl"><div>${renderResume({}, RESUME_TEMPLATES[i].id, { sample: true })}</div></div>`)
      .join("");
  } catch (err) {
    /* decorative only — never break the page */
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
else fill();
