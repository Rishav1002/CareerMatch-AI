/**
 * CareerMatch AI: Dashboard Feature Module
 * Single authoritative controller for #view-dashboard.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { formatPercent, escapeHtml } from "../formatters.js";

export class DashboardModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Attach listeners for actions inside dashboard
    const uploadBtn = document.getElementById("dashUploadResumeBtn") || document.getElementById("dashStartAnalysisBtn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }


    // Subscribe to activeResume, analysisResult, priData, atsResult, and jobsData changes
    ["activeResume", "analysisResult", "priData", "atsResult", "jobsData"].forEach((key) => {
      store.subscribe(key, () => {
        if (store.get("currentView") === "dashboard") {
          this.load();
        }
      });
    });
  }

  async load() {
    const resume = store.get("activeResume");
    const resumeId = resume?.id || null;

    let dashData = null;
    try {
      const url = resumeId ? `/api/dashboard?resumeId=${encodeURIComponent(resumeId)}` : "/api/dashboard";
      dashData = await api.get(url);
    } catch (_) {
      dashData = null;
    }

    // If a resume is active and PRI data hasn't been fetched yet, fetch it so Dashboard shows live readiness
    if (resume && !store.get("priData") && !this._fetchingPri) {
      this._fetchingPri = true;
      const targetRole = store.get("targetRole") || "Full Stack Developer";
      api.post("/api/readiness/index", { resume, resumeId: resume.id, targetRole })
        .then((pri) => {
          if (pri && typeof pri.priScore === "number") {
            store.set("priData", pri);
          }
        })
        .catch(() => {})
        .finally(() => { this._fetchingPri = false; });
    }

    if (dashData) {
      this.render(dashData);
    } else {
      this._renderFallback();
    }
  }

  render(dash) {
    if (!dash || typeof dash !== "object") {
      this._renderFallback();
      return;
    }

    const currentUser = store.get("currentUser");
    const isAuthenticated = Boolean(currentUser?.id && store.get("token"));
    const activeResume = store.get("activeResume");
    const analysisResult = store.get("analysisResult");
    const priData = store.get("priData");
    const atsResult = store.get("atsResult");

    // For unauthenticated guest sessions with no resume uploaded yet in this session,
    // never show stale shared/previous guest DB records — start clean at 0 / — until upload.
    const isFreshGuest = !isAuthenticated && !activeResume && !analysisResult;

    const totalResumesValue = isFreshGuest
      ? 0
      : Math.max(isAuthenticated ? Number(dash.totalResumes ?? 0) : 0, activeResume ? 1 : 0);
    const totalAnalysesValue = isFreshGuest
      ? 0
      : Math.max(isAuthenticated ? Number(dash.totalJobsCompared ?? 0) : 0, analysisResult?.matchResult ? 1 : 0);
    const history = isAuthenticated && Array.isArray(dash.recentHistory) ? dash.recentHistory : [];
    const hasAnalysis = !isFreshGuest && (totalAnalysesValue > 0 || history.length > 0 || Boolean(analysisResult?.matchResult));

    const liveMatchScore = analysisResult?.matchResult?.overallScore;
    const avgScoreNum = hasAnalysis
      ? Math.round(Number(liveMatchScore ?? (isAuthenticated ? dash.averageCompatibilityScore : 0) ?? 0))
      : null;

    const totalRes = document.getElementById("dashTotalResumes");
    if (totalRes) totalRes.textContent = String(totalResumesValue);

    const totalAna = document.getElementById("dashTotalAnalyses");
    if (totalAna) totalAna.textContent = String(totalAnalysesValue);

    const avgSc = document.getElementById("dashAvgScore");
    if (avgSc) {
      avgSc.textContent = avgScoreNum !== null ? `${avgScoreNum}%` : "—";
    }

    const readSt = document.getElementById("dashReadinessStatus");
    if (readSt) {
      const statusText = isFreshGuest
        ? "Not calculated"
        : (priData?.readinessTier
          || (hasAnalysis ? (dash.readinessStatus || (avgScoreNum >= 75 ? "Industry Ready" : avgScoreNum >= 50 ? "Developing" : "Skill Bridge Needed")) : (activeResume ? "Resume Uploaded" : "Not calculated")));
      readSt.textContent = statusText;
    }

    const greeting = document.getElementById("dashCandidateGreeting");
    if (greeting) {
      const name = currentUser?.fullName || currentUser?.name || activeResume?.contact?.name;
      greeting.textContent = name ? `Welcome, ${name}` : "Welcome to CareerMatch AI";
    }

    const roleLabel = document.getElementById("ovTargetRoleLabel");
    if (roleLabel) {
      if (activeResume) {
        const role = store.get("targetRole") || "Target Role";
        const skillCount = (activeResume.technicalSkills || activeResume.skills || []).length;
        roleLabel.textContent = `Target: ${role} · ${skillCount} skills detected from your resume.`;
      } else if (isAuthenticated && history.length > 0) {
        roleLabel.textContent = `Latest benchmark: ${history[0].targetRole || "Saved Analysis"}. Upload a new resume anytime.`;
      } else {
        roleLabel.textContent = "Upload a resume in Matcher to calculate your personalized scores.";
      }
    }

    // Populate live PRI Gauge and pillar scores from priData / analysisResult / atsResult
    const breakdown = Array.isArray(priData?.categoryBreakdown) ? priData.categoryBreakdown : [];
    const findPillar = (kw) => breakdown.find((c) => (c.category || "").toLowerCase().includes(kw))?.rawScore;

    const computedPri = isFreshGuest ? null : (typeof priData?.priScore === "number"
      ? Math.round(priData.priScore)
      : (avgScoreNum !== null ? avgScoreNum : null));
    const techScoreVal = findPillar("technical") ?? liveMatchScore ?? null;
    const atsScoreVal = findPillar("ats") ?? atsResult?.atsScore ?? analysisResult?.atsReport?.atsScore ?? null;
    const marketScoreVal = findPillar("market") ?? null;

    const priScore = document.getElementById("ovPriScore");
    if (priScore) priScore.textContent = computedPri !== null ? `${computedPri}%` : "—";
    const priTier = document.getElementById("ovPriTier");
    if (priTier) {
      priTier.textContent = priData?.readinessTier
        || (computedPri !== null ? (computedPri >= 75 ? "Interview Ready" : computedPri >= 50 ? "Developing" : "Early Stage") : "Not calculated");
    }

    const setMetric = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val !== null && val !== undefined && !Number.isNaN(Number(val)) ? `${Math.round(Number(val))}%` : "—";
    };
    setMetric("ovTechScore", techScoreVal);
    setMetric("ovAtsScore", atsScoreVal);
    setMetric("ovMarketScore", marketScoreVal);

    const gauge = document.getElementById("dashPriGaugeCircle");
    if (gauge) {
      const pct = computedPri !== null ? Math.max(0, Math.min(100, computedPri)) : 0;
      const circumference = 264;
      gauge.style.strokeDashoffset = String(Math.round(circumference - (circumference * pct) / 100));
    }

    const matchedEl = document.getElementById("dashTopMatched");
    if (matchedEl) {
      let skills = Array.isArray(dash.topMatchedSkills) ? dash.topMatchedSkills : [];
      if (!skills.length && analysisResult?.matchResult?.matchedSkills?.length) {
        skills = analysisResult.matchResult.matchedSkills.slice(0, 8).map((m) => ({ skill: m.jobSkill, count: 1 }));
      } else if (!skills.length && activeResume?.technicalSkills?.length) {
        skills = activeResume.technicalSkills.slice(0, 8).map((s) => ({ skill: typeof s === "string" ? s : s.name, count: 1 }));
      }
      matchedEl.innerHTML = skills.length
        ? skills.map((s) => `<span class="tag tag-match">${escapeHtml(s.skill)}${Number(s.count) > 1 ? ` (${Number(s.count)})` : ""}</span>`).join("")
        : `<span class="text-tertiary text-xs">No matched skills recorded yet.</span>`;
    }

    const missingEl = document.getElementById("dashTopMissing");
    if (missingEl) {
      let gaps = Array.isArray(dash.topMissingSkills) ? dash.topMissingSkills : [];
      if (!gaps.length && analysisResult?.matchResult?.missingSkills?.length) {
        gaps = analysisResult.matchResult.missingSkills.slice(0, 8).map((m) => ({ skill: m.jobSkill, count: 1 }));
      }
      missingEl.innerHTML = gaps.length
        ? gaps.map((s) => `<span class="tag tag-gap">${escapeHtml(s.skill)}${Number(s.count) > 1 ? ` (${Number(s.count)})` : ""}</span>`).join("")
        : `<span class="text-tertiary text-xs">No priority skill gaps recorded.</span>`;
    }

    // History is a signed-in workspace feature. This is a UI privacy measure;
    // the API must independently enforce owner-scoped access on the server.
    const historyCard = document.getElementById("dashHistoryCard");
    const tbody = document.getElementById("dashHistoryBody");
    if (historyCard) historyCard.hidden = !isAuthenticated;

    if (tbody) {
      if (!isAuthenticated) {
        tbody.replaceChildren();
      } else if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-tertiary">No analyses recorded yet. <a href="#/analyzer">Analyze a resume</a> to get started.</td></tr>`;
      } else {
        tbody.innerHTML = history.map((h) => `
          <tr>
            <td><strong>${escapeHtml(h.candidateName || "Candidate")}</strong></td>
            <td>${escapeHtml(h.targetRole || "—")} <small class="text-tertiary">(${escapeHtml(h.goalCompany || "Benchmark")})</small></td>
            <td><strong class="tabular-nums">${Math.round(Number(h.overallScore) || 0)}%</strong></td>
            <td class="tabular-nums">${Math.round(Number(h.mandatoryMetPct) || 0)}%</td>
            <td>${Number(h.matchedCount) || 0} matched · ${Number(h.missingCount) || 0} gaps</td>
            <td class="text-tertiary text-xs">${escapeHtml(h.createdAt || "")}</td>
            <td>
              <div class="d-flex gap-xs">
                <button type="button" class="btn btn-ghost btn-sm" data-load-history="${encodeURIComponent(String(h.id))}">Load</button>
                <button type="button" class="btn btn-ghost btn-sm" data-delete-history="${encodeURIComponent(String(h.id))}">Delete</button>
              </div>
            </td>
          </tr>
        `).join("");

        tbody.querySelectorAll("button[data-load-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            await this.loadHistoryItem(decodeURIComponent(btn.getAttribute("data-load-history")));
          });
        });

        tbody.querySelectorAll("button[data-delete-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            await this.deleteHistoryItem(decodeURIComponent(btn.getAttribute("data-delete-history")));
          });
        });
      }
    }

    const nextAction = document.getElementById("dashNextActionCard");
    if (nextAction) nextAction.hidden = !hasAnalysis;
    const tipsCard = document.getElementById("dashActionTipsCard");
    if (tipsCard) tipsCard.hidden = !hasAnalysis;
  }

  async loadHistoryItem(id) {
    if (!id) return;
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/history/${encodeURIComponent(id)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not load record");

      store.set("analysisResult", data);
      store.set("activeResume", data.resume);
      if (data.targetRole) store.set("targetRole", data.targetRole);
      window.location.hash = "#/report";
    } catch (err) {
      alert("Failed to load analysis: " + err.message);
    }
  }

  async deleteHistoryItem(id) {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this analysis record?")) return;
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/history/${encodeURIComponent(id)}`, { method: "DELETE", headers });
      if (res.ok) {
        this.load();
      }
    } catch (_) {}
  }

  _renderFallback() {
    const defaults = {
      dashTotalResumes: "0",
      dashTotalAnalyses: "0",
      dashAvgScore: "—",
      dashReadinessStatus: "Not calculated",
      ovPriScore: "—",
      ovPriTier: "Not calculated",
      ovTechScore: "—",
      ovAtsScore: "—",
      ovMarketScore: "—",
    };

    Object.entries(defaults).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    const gauge = document.getElementById("dashPriGaugeCircle");
    if (gauge) gauge.style.strokeDashoffset = "264";

    const currentUser = store.get("currentUser");
    const isAuthenticated = Boolean(currentUser?.id && store.get("token"));
    const historyCard = document.getElementById("dashHistoryCard");
    if (historyCard) historyCard.hidden = !isAuthenticated;

    const tbody = document.getElementById("dashHistoryBody");
    if (tbody) {
      tbody.innerHTML = isAuthenticated
        ? `<tr><td colspan="7" class="text-center text-tertiary">History could not be loaded. Please retry.</td></tr>`
        : "";
    }

    const nextAction = document.getElementById("dashNextActionCard");
    if (nextAction) nextAction.hidden = true;
    const tipsCard = document.getElementById("dashActionTipsCard");
    if (tipsCard) tipsCard.hidden = true;
  }}

export const dashboardModule = new DashboardModule();
