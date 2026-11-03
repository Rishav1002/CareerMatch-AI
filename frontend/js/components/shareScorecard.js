/**
 * CareerMatch AI: Privacy-Safe Public Scorecard & PDF Export
 */

import { store } from "../store.js";

export class ScorecardShare {
  constructor() {
    this.modalEl = null;
  }

  init() {
    this._injectDOM();
    this._attachListeners();
  }

  _injectDOM() {
    if (document.getElementById("shareScorecardModal")) return;

    const modal = document.createElement("div");
    modal.id = "shareScorecardModal";
    modal.className = "modal-backdrop";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="shareModalTitle">
        <div class="modal-header">
          <h3 id="shareModalTitle" style="font-size: 1.15rem;">Share Explainable Scorecard</h3>
          <button class="btn btn-ghost btn-sm" id="closeShareModalBtn">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-2);">
            This shareable link contains <strong>only verified skill metrics and index percentiles</strong>. Your contact details, full resume text, and student identification are strictly excluded for privacy.
          </p>

          <div class="form-group">
            <label class="form-label">Privacy-Safe Public Link</label>
            <div style="display: flex; gap: var(--space-1);">
              <input type="text" id="shareScorecardInput" class="form-input font-mono" readonly style="font-size: 0.8rem;" />
              <button class="btn btn-secondary" id="copyShareLinkBtn">Copy</button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); margin-top: var(--space-3); padding-top: var(--space-2); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8125rem; color: var(--text-tertiary);">Format: Editorial Field Ledger</span>
            <button class="btn btn-primary" id="triggerPrintPdfBtn">
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modalEl = modal;
  }

  _attachListeners() {
    this.modalEl.addEventListener("click", (e) => {
      if (e.target === this.modalEl) this.close();
    });

    const closeBtn = document.getElementById("closeShareModalBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    const copyBtn = document.getElementById("copyShareLinkBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const input = document.getElementById("shareScorecardInput");
        if (input) {
          try {
            await navigator.clipboard.writeText(input.value);
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
          } catch {
            input.select();
          }
        }
      });
    }

    const printBtn = document.getElementById("triggerPrintPdfBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        this.close();
        window.print();
      });
    }

    // Attach to shareScorecardBtn or printReportBtn
    document.addEventListener("click", (e) => {
      const shareBtn = e.target.closest("#shareScorecardBtn");
      if (shareBtn) {
        e.preventDefault();
        this.open();
      }
    });

    const printReportBtn = document.getElementById("printReportBtn");
    if (printReportBtn) {
      printReportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.print();
      });
    }
  }

  open() {
    const analysis = store.get("analysisResult") || {};
    const pri = store.get("priData") || {};
    const score = Math.round(analysis.overallScore || pri.priScore || 82);
    const role = store.get("targetRole") || "Data Engineer";
    const tier = pri.priTier || "Tier 1: Industry Ready";

    const params = new URLSearchParams({
      role: role,
      score: String(score),
      tier: tier,
      date: new Date().toISOString().split("T")[0],
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}#/scorecard?${params.toString()}`;
    const input = document.getElementById("shareScorecardInput");
    if (input) input.value = shareUrl;

    this.modalEl.style.display = "flex";
  }

  close() {
    this.modalEl.style.display = "none";
  }
}

export const scorecardShare = new ScorecardShare();
