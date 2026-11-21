/**
 * Template carousel — the "sliding gallery" of resume templates.
 *
 * - Every card is the REAL template rendered at thumbnail scale (not an image).
 * - The active card is centred and enlarged; neighbours peek in from both sides.
 * - Arrows, click-on-card, keyboard (←/→/Enter) and swipe/drag all navigate.
 * - Hovering the active card reveals a "Use this template" button.
 */

import { RESUME_TEMPLATES, renderResume, PAGE_W, PAGE_H } from "../modules/resumeTemplates.js";
import { escapeHtml } from "../formatters.js";

const GAP = 34;

export class TemplateCarousel {
  /**
   * @param {HTMLElement} root  container the carousel is rendered into
   * @param {{ getProfile?:()=>object, onUse:(id:string)=>void, onChange?:(id:string)=>void,
   *           title?:string, subtitle?:string, selectedId?:string }} opts
   */
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.index = Math.max(0, RESUME_TEMPLATES.findIndex((t) => t.id === opts.selectedId));
    if (this.index < 0) this.index = 0;
    this.drag = null;
    this.mount();
    this.bind();
    this.layout(false);
  }

  /* ---------- DOM ---------- */
  mount() {
    const { title, subtitle } = this.opts;
    this.root.classList.add("tpl-gallery");
    this.root.innerHTML = `
      ${title ? `<h2 class="tpl-gallery-title">${escapeHtml(title)}</h2>` : ""}
      ${subtitle ? `<p class="tpl-gallery-sub">${escapeHtml(subtitle)}</p>` : ""}
      <div class="tpl-stage">
        <button type="button" class="tpl-arrow tpl-prev" aria-label="Previous template">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div class="tpl-viewport" tabindex="0" role="listbox" aria-label="Resume templates">
          <div class="tpl-track"></div>
        </div>
        <button type="button" class="tpl-arrow tpl-next" aria-label="Next template">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>`;
    this.viewport = this.root.querySelector(".tpl-viewport");
    this.track = this.root.querySelector(".tpl-track");
    this.prevBtn = this.root.querySelector(".tpl-prev");
    this.nextBtn = this.root.querySelector(".tpl-next");
    this.renderCards();
  }

  /** (Re)render every thumbnail — call after the user's profile changes. */
  renderCards() {
    const profile = this.opts.getProfile ? this.opts.getProfile() : {};
    const hasData = Boolean(profile?.personalInfo?.full_name?.trim());
    this.track.innerHTML = RESUME_TEMPLATES.map((t, i) => `
      <figure class="tpl-card" data-i="${i}" data-id="${t.id}" role="option" aria-selected="false" aria-label="${escapeHtml(t.name)} template">
        <figcaption class="tpl-cap">
          <span class="tpl-name">${escapeHtml(t.name)}</span>
          <span class="tpl-tag">${escapeHtml(t.tag)}</span>
        </figcaption>
        <div class="tpl-thumb">
          <div class="tpl-page" aria-hidden="true">${renderResume(profile, t.id, { sample: !hasData })}</div>
          <button type="button" class="tpl-use" tabindex="-1">Use this template</button>
        </div>
      </figure>`).join("");
    this.cards = [...this.track.querySelectorAll(".tpl-card")];
    this.applyActive();
  }

  /* ---------- events ---------- */
  bind() {
    this.prevBtn.addEventListener("click", () => this.go(this.index - 1));
    this.nextBtn.addEventListener("click", () => this.go(this.index + 1));

    this.track.addEventListener("click", (e) => {
      if (this.moved) return; // it was a drag, not a click
      const card = e.target.closest(".tpl-card");
      if (!card) return;
      const i = Number(card.dataset.i);
      if (i !== this.index) this.go(i);
      else if (e.target.closest(".tpl-use") || e.target.closest(".tpl-thumb")) this.use();
    });

    this.viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); this.go(this.index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); this.go(this.index - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.use(); }
    });

    // swipe / drag
    this.viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tpl-arrow")) return;
      this.drag = { x: e.clientX, id: e.pointerId };
      this.moved = false;
    });
    this.viewport.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      if (Math.abs(e.clientX - this.drag.x) > 8) this.moved = true;
    });
    const end = (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      this.drag = null;
      if (Math.abs(dx) > 50) this.go(this.index + (dx < 0 ? 1 : -1));
      setTimeout(() => { this.moved = false; }, 0);
    };
    this.viewport.addEventListener("pointerup", end);
    this.viewport.addEventListener("pointercancel", end);

    this._onResize = () => this.layout(false);
    window.addEventListener("resize", this._onResize);
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.layout(false));
      this._ro.observe(this.viewport);
    }
  }

  /* ---------- navigation ---------- */
  go(i) {
    const next = Math.min(RESUME_TEMPLATES.length - 1, Math.max(0, i));
    if (next === this.index) return;
    this.index = next;
    this.applyActive();
    this.layout(true);
    this.opts.onChange?.(RESUME_TEMPLATES[this.index].id);
  }

  /** Move to a template without firing onChange (used when selection is set elsewhere). */
  setSelected(id) {
    const i = RESUME_TEMPLATES.findIndex((t) => t.id === id);
    if (i < 0 || i === this.index) return;
    this.index = i;
    this.applyActive();
    this.layout(false);
  }

  use() {
    this.opts.onUse?.(RESUME_TEMPLATES[this.index].id);
  }

  applyActive() {
    this.cards?.forEach((c, i) => {
      const on = i === this.index;
      c.classList.toggle("active", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
      c.querySelector(".tpl-use")?.setAttribute("tabindex", on ? "0" : "-1");
    });
    if (this.prevBtn) this.prevBtn.disabled = this.index === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.index === RESUME_TEMPLATES.length - 1;
  }

  /* ---------- geometry ---------- */
  layout(animate) {
    const vw = this.viewport.clientWidth;
    if (!vw) return; // hidden — will be laid out again when shown (ResizeObserver)
    const gap = vw < 520 ? 16 : GAP;
    const baseW = this.opts.compact
      ? (vw >= 600 ? 176 : Math.min(180, Math.round(vw * 0.56)))
      : (vw >= 1100 ? 316 : vw >= 760 ? 250 : vw >= 520 ? 200 : Math.min(220, Math.round(vw * 0.62)));
    const actW = vw < 520
      ? Math.min(Math.round(vw * 0.74), Math.round(baseW * 1.18))
      : Math.round(baseW * 1.21);
    const kBase = baseW / PAGE_W;
    const kAct = actW / PAGE_W;

    this.track.style.setProperty("--k-base", kBase.toFixed(5));
    this.track.style.setProperty("--k-act", kAct.toFixed(5));
    this.track.style.setProperty("--gap", `${gap}px`);
    this.viewport.style.setProperty("--tpl-h", `${Math.round(actW * (PAGE_H / PAGE_W)) + (this.opts.compact ? 88 : 104)}px`);

    let center = 0;
    for (let i = 0; i < this.index; i += 1) center += baseW + gap;
    center += actW / 2;
    const x = vw / 2 - center;

    this.track.classList.toggle("no-anim", !animate);
    this.track.style.transform = `translate3d(${Math.round(x)}px,0,0)`;
    if (!animate) {
      // force reflow so the "no-anim" class takes effect before it's removed
      void this.track.offsetWidth;
      requestAnimationFrame(() => this.track.classList.remove("no-anim"));
    }
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    this._ro?.disconnect();
  }
}
