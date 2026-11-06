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

    const compareBtn = document.getElementById("compareRolesBtn");
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

  load() {
    this.populateRoleOptions();
    this.compare();
  }

  async populateRoleOptions() {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        const roles = data.roles || [];
        const selA = document.getElementById("careerPrimaryRoleSelect");
        const selB = document.getElementById("careerSecondaryRoleSelect");

        if (selA && roles.length) {
          const currentA = selA.value;
          selA.innerHTML = roles.map((r) => `<option value="${escapeHtml(r.title)}">${escapeHtml(r.title)}</option>`).join("");
          if (currentA) selA.value = currentA;
        }

        if (selB && roles.length) {
          const currentB = selB.value;
          selB.innerHTML = roles.map((r) => `<option value="${escapeHtml(r.title)}">${escapeHtml(r.title)}</option>`).join("");
          if (currentB) selB.value = currentB;
          else if (roles[1]) selB.value = roles[1].title;
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

    const renderRoleCard = (r, badgeLabel) => `
      <span class="step-badge">${escapeHtml(badgeLabel)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 10px;">
        <h3 style="margin:0;font-size:1.15rem;">${escapeHtml(r.roleTitle)}</h3>
        <span class="tag tag-match tabular-nums">${Math.round(r.candidateMatchScore)}% Match</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 10px;">${escapeHtml(r.experienceExpectation)}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Entry (India)</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaEntryLPA}L</div></div>
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Mid-Level</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaMidLPA}L</div></div>
        <div class="kpi-card" style="padding:10px;"><span class="kpi-label">Senior</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaSeniorLPA}L</div></div>
      </div>
      <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);text-transform:uppercase;">Progression Path</span>
      <p style="font-size:0.8rem;margin:4px 0 10px;">${(r.progressionPath || []).map(escapeHtml).join(" → ")}</p>
      <small style="color:var(--text-tertiary);font-size:0.72rem;">Source: ${escapeHtml(r.benchmarkSource || "Industry Compensation Survey")}</small>
    `;

    const cardA = document.getElementById("careerRoleACard");
    const cardB = document.getElementById("careerRoleBCard");
    if (cardA && data.primaryRole) cardA.innerHTML = renderRoleCard(data.primaryRole, "PRIMARY TARGET PATH");
    if (cardB && data.secondaryRole) cardB.innerHTML = renderRoleCard(data.secondaryRole, "COMPARISON / PIVOT PATH");

    const br = data.transitionBridge || {};
    const bridgeTitle = document.getElementById("careerBridgeTitle");
    if (bridgeTitle) {
      bridgeTitle.textContent = `Transition Bridge: ${br.fromRole || "Role A"} → ${br.toRole || "Role B"} (${br.estimatedTransitionTime || "3-6 months"})`;
    }

    const bridgeBody = document.getElementById("careerBridgeBody");
    if (bridgeBody) {
      bridgeBody.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">SHARED FOUNDATION SKILLS</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
              ${(br.sharedFoundationSkills || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">YOU ALREADY HAVE FOR ${escapeHtml(br.toRole || "")}</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
              ${(br.candidateAlreadyHasForTarget || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)} ✓</span>`).join("") || `<span style="font-size:0.8rem;color:var(--text-tertiary);">None yet</span>`}
            </div>
          </div>
          <div>
            <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-tertiary);">BRIDGE SKILLS NEEDED TO PIVOT</span>
            <div class="skill-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
              ${(br.skillsNeededToTransition || []).map((s) => `<span class="tag tag-gap">${escapeHtml(s)} !</span>`).join("") || `<span class="tag tag-match">Ready to Transition!</span>`}
            </div>
          </div>
        </div>
      `;
    }

    // Role Salary Benchmark Matrix
    const tbody = document.getElementById("careerMatrixTableBody");
    if (tbody) {
      tbody.innerHTML = (data.allRolesMatrix || [])
        .map(
          (m) => `
          <tr>
            <td><strong>${escapeHtml(m.roleTitle)}</strong></td>
            <td><strong class="tabular-nums" style="color:var(--score-high);">${Math.round(m.candidateMatchScore)}%</strong></td>
            <td class="tabular-nums">₹${m.indiaEntryLPA}L / ₹${m.indiaMidLPA}L / ₹${m.indiaSeniorLPA}L</td>
            <td class="tabular-nums">$${(m.globalEntryUSD / 1000).toFixed(0)}k / $${(m.globalMidUSD / 1000).toFixed(0)}k / $${(m.globalSeniorUSD / 1000).toFixed(0)}k</td>
            <td class="tabular-nums" style="color:var(--brand-accent);font-weight:600;">${escapeHtml(m.demandGrowthYoY)}</td>
            <td style="font-size:0.75rem;color:var(--text-tertiary);">${escapeHtml(m.benchmarkSource)}</td>
          </tr>
        `
        )
        .join("");
    }
  }
}

export const careerModule = new CareerModule();
