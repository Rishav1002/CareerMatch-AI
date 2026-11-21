/**
 * CareerMatch AI: Role Benchmark & Salary Intelligence Feature Module
 * Single authoritative controller for #view-career (route: #/compare).
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class CareerModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const compareBtn = document.getElementById("compareRolesBtn") || document.getElementById("runCareerCompareBtn");
    if (compareBtn) {
      compareBtn.addEventListener("click", () => this.compare());
    }

    const selA = document.getElementById("careerPrimaryRoleSelect");
    const selB = document.getElementById("careerSecondaryRoleSelect");

    if (selA) {
      selA.addEventListener("change", () => this.compare());
    }
    if (selB) {
      selB.addEventListener("change", () => this.compare());
    }

    store.subscribe("activeResume", () => {
      if (store.get("currentView") === "compare") {
        this.compare();
      }
    });
  }

  async load() {
    await this.populateRoleOptions();
    await this.compare();
  }

  async populateRoleOptions() {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        const roles = data.roles || [];
        const selA = document.getElementById("careerPrimaryRoleSelect");
        const selB = document.getElementById("careerSecondaryRoleSelect");

        const preferredPrimary = store.get("targetRole") || "";
        if (selA && roles.length) {
          const currentA = selA.value;
          selA.innerHTML = roles.map((r) => `<option value="${escapeHtml(r.title)}">${escapeHtml(r.title)}</option>`).join("");
          const matchTarget = roles.find((r) => r.title.toLowerCase() === preferredPrimary.toLowerCase());
          const matchCurrent = roles.find((r) => r.title === currentA);
          selA.value = matchTarget ? matchTarget.title : (matchCurrent ? matchCurrent.title : roles[0].title);
        }

        if (selB && roles.length) {
          const currentB = selB.value;
          selB.innerHTML = roles.map((r) => `<option value="${escapeHtml(r.title)}">${escapeHtml(r.title)}</option>`).join("");
          const matchCurrentB = roles.find((r) => r.title === currentB && r.title !== selA?.value);
          const fallbackB = roles.find((r) => r.title !== selA?.value) || roles[0];
          selB.value = matchCurrentB ? matchCurrentB.title : fallbackB.title;
        }
      }
    } catch (_) {}
  }

  async compare() {
    const primaryRole = document.getElementById("careerPrimaryRoleSelect")?.value || store.get("targetRole") || "Full Stack Developer";
    const secondaryRole = document.getElementById("careerSecondaryRoleSelect")?.value || "Data Engineer";

    try {
      const resume = store.get("activeResume");
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/career/compare", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume?.id || "",
          primaryRole,
          secondaryRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Career comparison failed.");

      store.set("careerCompareData", data);
      this.render(data);
    } catch (_) {}
  }

  render(data) {
    if (!data) return;
    const hasResume = Boolean(store.get("activeResume"));

    // Optional notice when viewing Role Compare before uploading a resume
    const careerCardBody = document.querySelector("#view-career .card-body");
    let resumeNotice = document.getElementById("careerResumePromptBanner");
    if (!hasResume && careerCardBody) {
      if (!resumeNotice) {
        resumeNotice = document.createElement("div");
        resumeNotice.id = "careerResumePromptBanner";
        resumeNotice.className = "card p-2 mb-3 bg-sunken border-subtle d-flex justify-between items-center flex-wrap gap-sm text-xs";
        resumeNotice.innerHTML = `
          <span class="text-secondary">Upload your resume to calculate your personalized match percentage and skill transition gaps across roles.</span>
          <a href="#/analyzer" class="btn btn-primary btn-xs">Upload Resume →</a>
        `;
        careerCardBody.prepend(resumeNotice);
      }
      resumeNotice.hidden = false;
    } else if (resumeNotice) {
      resumeNotice.hidden = true;
    }

    const renderRoleCard = (r, badgeLabel) => `
      <span class="step-badge">${escapeHtml(badgeLabel)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0 10px;">
        <h3 style="margin:0;font-size:1.15rem;">${escapeHtml(r.roleTitle)}</h3>
        <span class="tag ${hasResume ? "tag-match" : ""} tabular-nums">${hasResume ? `${Math.round(r.candidateMatchScore)}% Match` : "Upload Resume"}</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 10px;">${escapeHtml(r.experienceExpectation)}</p>
      <div class="career-salary-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px;">
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Entry (India)</span><div class="kpi-value" style="font-size:1.1rem;">₹${r.indiaEntryLPA}L</div></div>
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Mid-Level</span><div class="kpi-value" style="font-size:1.1rem;">₹${r.indiaMidLPA}L</div></div>
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Senior</span><div class="kpi-value" style="font-size:1.1rem;">₹${r.indiaSeniorLPA}L</div></div>
      </div>
      <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);text-transform:uppercase;">Progression Path</span>
      <p style="font-size:0.8rem;margin:4px 0 0;">${(r.progressionPath || []).map(escapeHtml).join(" → ")}</p>
    `;

    const cardA = document.getElementById("careerRoleACard");
    const cardB = document.getElementById("careerRoleBCard");
    if (cardA && data.primaryRole) cardA.innerHTML = renderRoleCard(data.primaryRole, "PRIMARY TARGET PATH");
    if (cardB && data.secondaryRole) cardB.innerHTML = renderRoleCard(data.secondaryRole, "COMPARISON / PIVOT PATH");

    const br = data.transitionBridge || {};
    const bridgeTitle = document.getElementById("careerBridgeTitle");
    if (bridgeTitle) {
      bridgeTitle.textContent = hasResume
        ? `Transition Bridge: ${br.fromRole || "Role A"} → ${br.toRole || "Role B"} (${br.estimatedTransitionTime || "3-6 months"})`
        : `Skill Requirements: ${br.fromRole || "Role A"} → ${br.toRole || "Role B"}`;
    }

    const bridgeBody = document.getElementById("careerBridgeBody");
    if (bridgeBody) {
      bridgeBody.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">SHARED FOUNDATION SKILLS</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              ${(br.sharedFoundationSkills || []).map((s) => `<button type="button" class="tag tag-match skill-learn-trigger" data-fix-skill="${escapeHtml(s)}" data-fix-status="matched">${escapeHtml(s)}</button>`).join("")}
            </div>
          </div>
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">YOU ALREADY HAVE FOR ${escapeHtml(br.toRole || "")}</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              ${!hasResume
                ? `<span style="font-size:0.8rem;color:var(--text-tertiary);">Upload your resume to see matched skills.</span>`
                : ((br.candidateAlreadyHasForTarget || []).map((s) => `<button type="button" class="tag tag-match skill-learn-trigger" data-fix-skill="${escapeHtml(s)}" data-fix-status="matched">${escapeHtml(s)} ✓</button>`).join("") || `<span style="font-size:0.8rem;color:var(--text-tertiary);">None detected yet</span>`)}
            </div>
          </div>
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">${hasResume ? "BRIDGE SKILLS NEEDED TO PIVOT" : "CORE TARGET ROLE SKILLS"}</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              ${(br.skillsNeededToTransition || []).map((s) => `<button type="button" class="tag tag-gap skill-learn-trigger" data-fix-skill="${escapeHtml(s)}" data-fix-status="missing">${escapeHtml(s)}</button>`).join("") || `<span class="tag tag-match">Ready to Transition!</span>`}
            </div>
          </div>
        </div>
      `;
    }

    // Role Salary Benchmark Matrix (aligned strictly with 6 columns, no benchmark source text)
    const tbody = document.getElementById("careerMatrixTableBody");
    if (tbody) {
      tbody.innerHTML = (data.allRolesMatrix || [])
        .map(
          (m) => `
          <tr>
            <td data-label="Role"><strong>${escapeHtml(m.roleTitle)}</strong></td>
            <td data-label="Your Match"><strong class="tabular-nums" style="color:${hasResume ? "var(--score-high)" : "var(--text-tertiary)"};">${hasResume ? `${Math.round(m.candidateMatchScore)}%` : "—"}</strong></td>
            <td data-label="0–2 Yrs (India)" class="tabular-nums">₹${m.indiaEntryLPA}L</td>
            <td data-label="2–5 Yrs (India)" class="tabular-nums">₹${m.indiaMidLPA}L</td>
            <td data-label="5+ Yrs (India)" class="tabular-nums">₹${m.indiaSeniorLPA}L</td>
            <td data-label="Growth" class="tabular-nums" style="color:var(--brand-accent);font-weight:600;">${escapeHtml(m.demandGrowthYoY)}</td>
          </tr>
        `
        )
        .join("");
    }
  }
}

export const careerModule = new CareerModule();
