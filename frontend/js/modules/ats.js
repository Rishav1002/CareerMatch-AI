/**
 * CareerMatch AI: ATS Resume Simulator Feature Module
 * Single authoritative controller for #view-ats.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

function scoreTone(score) {
  const n = Number(score) || 0;
  if (n >= 80) return { cls: "high", color: "var(--score-high)", label: "ATS Strong" };
  if (n >= 60) return { cls: "mid", color: "var(--score-mid, #d97706)", label: "Needs Tuning" };
  return { cls: "low", color: "var(--score-low)", label: "At Risk" };
}

export class AtsModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const rerunBtn = document.getElementById("reEvaluateAtsBtn") || document.getElementById("runAtsAuditBtn");
    if (rerunBtn) {
      rerunBtn.addEventListener("click", () => this.load(true));
    }

    const downloadBtn = document.getElementById("downloadAtsResumeBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const atsData = store.get("atsResult");
        const resume = store.get("activeResume");
        const text =
          atsData?.downloadableResumeText ||
          resume?.rawText ||
          resume?.raw_text ||
          resume?.text ||
          "No resume text available";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ats-optimized-resume-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const uploadCta = document.getElementById("atsEmptyUploadCtaBtn");
    if (uploadCta) {
      uploadCta.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }

    store.subscribe("activeResume", (resume) => {
      store.set("atsResult", null);
      if (store.get("currentView") === "ats") {
        if (resume) this.load(true);
        else this.renderEmptyState();
      }
    });
  }

  async load(forceRefresh = false) {
    const resume = store.get("activeResume");
    if (!resume) {
      this.renderEmptyState();
      return;
    }

    const cached = store.get("atsResult");
    if (cached && !forceRefresh) {
      this.render(cached);
      return;
    }

    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = `<div class="p-4 text-center text-sm text-secondary" style="grid-column:1/-1;"><div class="spinner mb-2 mx-auto"></div>Auditing ATS parser compatibility...</div>`;
    }

    try {
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const goalCompany = store.get("goalCompany") || document.getElementById("goalCompanyInput")?.value || "";
      const customJd = document.getElementById("customJdInput")?.value || "";

      const data = await api.post("/api/ats/evaluate", {
        resume,
        resumeId: resume.id,
        targetRole,
        goalCompany,
        customJdText: customJd,
      });

      store.set("atsResult", data);
      this.render(data);
    } catch (err) {
      this.renderError(err.message || "ATS evaluation failed.");
    }
  }

  renderEmptyState() {
    const emptyContainer = document.getElementById("atsEmptyStateContainer");
    const contentContainer = document.getElementById("atsContentContainer");
    if (emptyContainer) emptyContainer.hidden = false;
    if (contentContainer) contentContainer.hidden = true;
  }

  renderError(msg) {
    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="card p-3 text-center bg-sunken" style="grid-column:1/-1;">
          <p class="text-sm text-low font-semibold mb-2">Unable to evaluate ATS score: ${escapeHtml(msg)}</p>
          <button type="button" class="btn btn-secondary btn-sm" id="atsRetryBtn">Retry Evaluation</button>
        </div>
      `;
      document.getElementById("atsRetryBtn")?.addEventListener("click", () => this.load(true));
    }
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const emptyContainer = document.getElementById("atsEmptyStateContainer");
    const contentContainer = document.getElementById("atsContentContainer");
    if (emptyContainer) emptyContainer.hidden = true;
    if (contentContainer) contentContainer.hidden = false;

    const overall = Math.round(Number(data.atsScore) || 0);
    const tone = scoreTone(overall);
    const pillars = Array.isArray(data.pillars) ? data.pillars : [];

    // 1. Hero Score + 4 Pillar Cards
    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="ats-hero-score-card">
          <div class="text-xs font-mono uppercase text-tertiary">Overall ATS Score</div>
          <div class="ats-hero-score-num font-serif tabular-nums" style="color:${tone.color};">${overall}%</div>
          <span class="score-pill ${tone.cls} text-xs">${tone.label}</span>
          <div class="text-xs text-secondary mt-1">Target: <strong>${escapeHtml(data.targetRole || "Benchmark")}</strong></div>
        </div>
        <div class="ats-pillars-grid">
          ${pillars.map((p) => {
            const pScore = Math.round(Number(p.score) || 0);
            const pTone = scoreTone(pScore);
            return `
              <div class="ats-pillar-card">
                <div class="d-flex justify-between items-start gap-xs mb-1">
                  <span class="ats-pillar-name">${escapeHtml(p.name)}</span>
                  <span class="font-mono text-xxs text-tertiary" style="white-space:nowrap;">${p.weightPct}% wt</span>
                </div>
                <div class="ats-pillar-val tabular-nums" style="color:${pTone.color};">${pScore}%</div>
                <div class="ats-progress-track">
                  <div class="ats-progress-fill" style="width:${Math.min(100, pScore)}%;background:${pTone.color};"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    // 2. Section-by-Section Audit
    const sections = Array.isArray(data.sectionAudit) ? data.sectionAudit : [];
    const passedSections = sections.filter((s) => s.status === "Pass" && Number(s.score) >= 80).length;
    const secBadge = document.getElementById("atsSectionSummaryBadge");
    if (secBadge) secBadge.textContent = `${passedSections}/${sections.length} Strong`;

    const secAuditEl = document.getElementById("atsSectionAuditList");
    if (secAuditEl) {
      secAuditEl.innerHTML = sections.length
        ? sections.map((s) => {
            const sc = Math.round(Number(s.score) || 0);
            const isFull = s.status === "Pass" && sc >= 80;
            const isPartial = s.status === "Pass" && sc < 80;
            const pillCls = isFull ? "status-matched" : isPartial ? "status-partial" : "status-missing";
            return `
              <div class="ats-audit-row">
                <div class="d-flex justify-between items-center gap-xs mb-05 flex-wrap">
                  <strong class="text-sm text-primary">${escapeHtml(s.section)}</strong>
                  <span class="status-badge ${pillCls}" style="font-size:0.72rem;white-space:nowrap;">${escapeHtml(s.status)} · ${sc}%</span>
                </div>
                <p class="text-xs text-secondary m-0" style="line-height:1.45;">${escapeHtml(s.finding || "")}</p>
              </div>
            `;
          }).join("")
        : `<p class="text-xs text-tertiary m-0">No section audit findings available.</p>`;
    }

    // 3. Formatting & Parsing Checks
    const checks = Array.isArray(data.formattingChecks) ? data.formattingChecks : [];
    const passedChecks = checks.filter((f) => Boolean(f.passed)).length;
    const fmtBadge = document.getElementById("atsFormatSummaryBadge");
    if (fmtBadge) fmtBadge.textContent = `${passedChecks}/${checks.length} Passed`;

    const fmtChecksEl = document.getElementById("atsFormattingChecksList");
    if (fmtChecksEl) {
      fmtChecksEl.innerHTML = checks.length
        ? checks.map((f) => `
            <div class="ats-audit-row">
              <div class="d-flex justify-between items-center gap-xs mb-05 flex-wrap">
                <strong class="text-sm text-primary">${escapeHtml(f.check)}</strong>
                <span class="status-badge ${f.passed ? "status-matched" : "status-missing"}" style="font-size:0.72rem;white-space:nowrap;">
                  ${f.passed ? "✓ Passed" : "✕ Needs Fix"}
                </span>
              </div>
              <p class="text-xs text-secondary m-0" style="line-height:1.45;">${escapeHtml(f.detail || "")}</p>
            </div>
          `).join("")
        : `<p class="text-xs text-tertiary m-0">No formatting checks returned.</p>`;
    }

    // 4. Keyword Alignment (Missing & Matched — handles both string[] and {keyword}[] cleanly!)
    const rawMissing = Array.isArray(data.missingKeywords) ? data.missingKeywords : [];
    const rawMatched = Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [];
    const normalizeKw = (k) => (typeof k === "string" ? k : (k?.keyword || k?.jobSkill || k?.name || "")).trim();
    const missingKw = rawMissing.map(normalizeKw).filter(Boolean);
    const matchedKw = rawMatched.map(normalizeKw).filter(Boolean);

    const kwBadge = document.getElementById("atsKeywordSummaryBadge");
    if (kwBadge) kwBadge.textContent = `${matchedKw.length} Matched · ${missingKw.length} Missing`;

    const kwEl = document.getElementById("atsMissingKeywordsTags") || document.getElementById("atsMissingKeywordsList");
    if (kwEl) {
      kwEl.innerHTML = missingKw.length
        ? missingKw.map((kw) => `
            <button type="button" class="tag tag-gap skill-learn-trigger" data-fix-skill="${escapeHtml(kw)}" data-fix-status="missing" title="Click for courses &amp; projects">
              ✕ ${escapeHtml(kw)}
            </button>
          `).join("")
        : `<span class="tag tag-match">✓ All key role keywords present!</span>`;
    }

    const matchedEl = document.getElementById("atsMatchedKeywordsTags");
    if (matchedEl) {
      matchedEl.innerHTML = matchedKw.length
        ? matchedKw.map((kw) => `<span class="tag tag-match">✓ ${escapeHtml(kw)}</span>`).join("")
        : `<span class="text-xs text-tertiary">No role keywords matched yet.</span>`;
    }

    // 5. AI Bullet Rewrites (STAR / XYZ Format)
    const rewrites = Array.isArray(data.bulletRewrites) ? data.bulletRewrites : [];
    const rwBadge = document.getElementById("atsRewriteCountBadge");
    if (rwBadge) rwBadge.textContent = `${rewrites.length} ${rewrites.length === 1 ? "Suggestion" : "Suggestions"}`;

    const rwEl = document.getElementById("atsBulletRewritesContainer");
    if (rwEl) {
      if (!rewrites.length) {
        rwEl.innerHTML = `<div class="ats-audit-row text-xs text-secondary">Your current resume bullets already use strong action verbs and quantifiable impact.</div>`;
      } else {
        rwEl.innerHTML = rewrites.map((rw, idx) => `
          <div class="ats-rewrite-card">
            ${rw.issue ? `<div class="text-xxs font-mono text-accent mb-1">${escapeHtml(rw.issue)}</div>` : ""}
            <div class="ats-rewrite-before">
              <span class="ats-rewrite-label">Before</span>
              <p class="text-xs text-secondary m-0">${escapeHtml(rw.before || "")}</p>
            </div>
            <div class="ats-rewrite-after">
              <span class="ats-rewrite-label text-high">Suggested Upgrade</span>
              <p class="text-xs text-primary m-0" id="atsRewriteText_${idx}">${escapeHtml(rw.after || "")}</p>
            </div>
            <div class="mt-1 d-flex justify-end">
              <button type="button" class="btn btn-secondary btn-xs ats-copy-rewrite-btn" data-rw-idx="${idx}">Copy Upgrade</button>
            </div>
          </div>
        `).join("");

        rwEl.querySelectorAll(".ats-copy-rewrite-btn").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const idx = btn.getAttribute("data-rw-idx");
            const txt = document.getElementById(`atsRewriteText_${idx}`)?.textContent.trim() || "";
            try {
              await navigator.clipboard.writeText(txt);
              btn.textContent = "✓ Copied";
              setTimeout(() => (btn.textContent = "Copy Upgrade"), 1600);
            } catch {
              btn.textContent = "Copied";
            }
          });
        });
      }
    }
  }
}

export const atsModule = new AtsModule();
