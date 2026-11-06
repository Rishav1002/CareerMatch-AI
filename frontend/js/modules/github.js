/**
 * CareerMatch AI: GitHub Skill Verification Feature Module
 * Single authoritative controller for #view-github.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class GithubModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const analyzeBtn = document.getElementById("runGithubAnalyzeBtn");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => this.analyze());
    }

    const input = document.getElementById("githubUsernameInput");
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.analyze();
        }
      });
    }

    store.subscribe("studentProfile", (profile) => {
      if (profile?.links?.github && input && !input.value) {
        input.value = profile.links.github.replace(/https?:\/\/github\.com\//, "").replace(/\/$/, "");
      }
    });
  }

  load() {
    const input = document.getElementById("githubUsernameInput");
    const resume = store.get("activeResume");
    if (input && !input.value && resume?.contact?.github) {
      input.value = resume.contact.github.replace(/https?:\/\/github\.com\//, "").replace(/\/$/, "");
    }
  }

  async analyze() {
    const input = document.getElementById("githubUsernameInput");
    let username = input?.value?.trim() || "";
    // Clean URL prefixes if user pasted full URL
    username = username.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");

    if (!username) {
      this.renderUnavailableMessage("Please enter a valid GitHub username.");
      return;
    }

    const btn = document.getElementById("runGithubAnalyzeBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Analyzing Repositories...";
    }

    try {
      const resume = store.get("activeResume");
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          githubUsername: username,
          resume,
          resumeId: resume?.id || "",
          targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.available === false) {
        const msg = data.message || data.detail || data.error || "GitHub profile not found or API rate limited.";
        this.renderUnavailableMessage(msg);
        return;
      }

      this.render(data);
    } catch (err) {
      this.renderUnavailableMessage("Connection error: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Verify GitHub Portfolio";
      }
    }
  }

  renderUnavailableMessage(msg) {
    const sourceEl = document.getElementById("githubSourceTag");
    if (sourceEl) sourceEl.textContent = msg;

    const setDash = (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "—";
    };
    ["ghStrengthScore", "ghVerifiedRate", "ghVerifiedSub", "ghRepoCount", "ghFollowersSub", "ghDocScore"].forEach(setDash);

    const verEl = document.getElementById("ghVerifiedSkillsList");
    if (verEl) verEl.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.84rem;">${escapeHtml(msg)}</p>`;

    const unverEl = document.getElementById("ghUnverifiedSkillsList");
    if (unverEl) unverEl.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.84rem;">${escapeHtml(msg)}</p>`;

    const reposGrid = document.getElementById("ghReposGrid");
    if (reposGrid) reposGrid.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.84rem;grid-column:1 / -1;">${escapeHtml(msg)}</p>`;
  }

  render(data) {
    if (!data) return;

    const sourceTag = document.getElementById("githubSourceTag");
    if (sourceTag) sourceTag.textContent = `${data.dataSource || "GitHub REST"} · ${data.methodologyNote || "Public repos analyzed"}`;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setVal("ghStrengthScore", `${Math.round(data.portfolioStrengthScore || 0)}%`);
    setVal("ghVerifiedRate", `${Math.round(data.verificationRatePct || 0)}%`);
    setVal("ghVerifiedSub", `${(data.verifiedSkills || []).length} resume skills verified`);
    setVal("ghRepoCount", data.publicReposCount ?? 0);
    setVal("ghFollowersSub", `${data.followersCount ?? 0} followers`);
    setVal("ghDocScore", `${Math.round(data.readmeQualityReport?.averageDocumentationScore || 0)}%`);

    // Verified skills list
    const verEl = document.getElementById("ghVerifiedSkillsList");
    if (verEl) {
      const vList = data.verifiedSkills || [];
      verEl.innerHTML = vList.length
        ? vList
            .map(
              (v) => `
            <div class="evidence-req-item card" style="margin-bottom:6px;padding:8px 12px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHtml(v.skill)}</strong>
                <span class="tag tag-match">Verified in Code ✓</span>
              </div>
              <p style="margin:4px 0 0;font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(v.evidence)}</p>
            </div>
          `
            )
            .join("")
        : `<p style="color:var(--text-tertiary);font-size:0.84rem;">No claimed resume skills verified in public repositories.</p>`;
    }

    // Unverified skills list
    const unverEl = document.getElementById("ghUnverifiedSkillsList");
    if (unverEl) {
      const uList = data.unverifiedResumeSkills || [];
      unverEl.innerHTML = uList.length
        ? uList
            .map(
              (u) => `
            <div class="evidence-req-item card" style="margin-bottom:6px;padding:8px 12px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHtml(u.skill)}</strong>
                <span class="tag tag-partial">Resume Claim Only</span>
              </div>
              <p style="margin:4px 0 0;font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(u.recommendation)}</p>
            </div>
          `
            )
            .join("")
        : `<p style="color:var(--score-high);font-size:0.84rem;">All technical skills backed by public repository evidence!</p>`;
    }

    // Repositories grid
    const reposGrid = document.getElementById("ghReposGrid");
    if (reposGrid) {
      reposGrid.innerHTML = (data.repositories || [])
        .map(
          (r) => `
          <div class="card" style="padding:12px 14px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="step-badge">${escapeHtml(r.language || "Code")}</span>
              <span class="tag ${r.documentationScore >= 75 ? "tag-match" : "tag-partial"}">Docs: ${r.documentationScore}%</span>
            </div>
            <h4 style="margin:6px 0 2px;font-size:0.95rem;">${escapeHtml(r.name)}</h4>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 6px;">${escapeHtml(r.description || "No description provided.")}</p>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
              ${(r.detectedSkills || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`).join("")}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.74rem;color:var(--text-tertiary);">
              <span>Updated: ${escapeHtml(r.updatedAt || "")}</span>
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">View Repo ↗</a>
            </div>
          </div>
        `
        )
        .join("");
    }
  }
}

export const githubModule = new GithubModule();
