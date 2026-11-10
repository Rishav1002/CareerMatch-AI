/**
 * CareerMatch AI: Skill Assessment Lab Feature Module
 * Single authoritative controller for #view-assessment (route: #/skills).
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class AssessmentModule {
  constructor() {
    this.initialized = false;
    this.currentAssessment = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const generateBtn = document.getElementById("generateAssessmentBtn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.generateTest());
    }

    const submitBtn = document.getElementById("submitAssessmentBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => this.submitTest());
    }

    const topicSelect = document.getElementById("asmtTopicSelect");
    if (topicSelect) {
      topicSelect.addEventListener("change", () => {
        // Ready for new test generation on topic switch
        document.getElementById("asmtResultCard")?.classList.add("hidden");
      });
    }

    store.subscribe("activeResume", (resume) => {
      if (resume) this.populateTopicOptions(resume);
    });
  }

  load() {
    const resume = store.get("activeResume");
    if (resume) {
      this.populateTopicOptions(resume);
    }
    const saved = store.get("assessmentSession");
    if (saved && !this.currentAssessment) {
      this.currentAssessment = saved;
      this.render(saved);
    }
    this.loadHistory();
  }

  populateTopicOptions(resume) {
    const sel = document.getElementById("asmtTopicSelect");
    if (!sel) return;

    const skills = resume.technicalSkills || [];
    if (!skills.length) return;

    const currentVal = sel.value;
    const standardOptions = ["Python", "SQL", "JavaScript", "React", "FastAPI", "Docker", "Java", "Data Structures"];
    const merged = Array.from(new Set([...skills, ...standardOptions]));

    sel.innerHTML = merged.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    if (merged.includes(currentVal)) sel.value = currentVal;
  }

  async generateTest() {
    const topic = document.getElementById("asmtTopicSelect")?.value || "Python";
    const difficulty = document.getElementById("asmtDifficultySelect")?.value || "Intermediate";
    const resume = store.get("activeResume");

    const genBtn = document.getElementById("generateAssessmentBtn");
    if (genBtn) {
      genBtn.disabled = true;
      genBtn.textContent = "Generating Test...";
    }

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic,
          difficulty,
          resumeId: resume?.id || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate assessment.");

      this.currentAssessment = data;
      store.set("assessmentSession", data);
      this.render(data);
    } catch (err) {
      alert("Error generating assessment: " + err.message);
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.textContent = "Generate Test";
      }
    }
  }

  render(data) {
    if (!data) return;

    document.getElementById("asmtResultCard")?.classList.add("hidden");

    // Render MCQs without any answer pre-selected
    const mcqBox = document.getElementById("asmtMcqContainer");
    if (mcqBox) {
      mcqBox.innerHTML = (data.questions || [])
        .map(
          (q, qIdx) => `
          <div class="card p-3 mb-3 border-subtle" data-q-card="${qIdx}">
            <div class="d-flex flex-between align-center mb-1">
              <span class="status-badge text-xxs font-mono">Question ${qIdx + 1} of ${(data.questions || []).length} · ${escapeHtml(q.subtopic || data.topic)}</span>
              <button type="button" class="btn btn-ghost btn-sm text-xxs asmt-hint-btn" data-qidx="${qIdx}" data-tier="1">
                💡 Hint 1 (-25% pts)
              </button>
            </div>
            <strong class="d-block text-sm text-primary mb-2">${qIdx + 1}. ${escapeHtml(q.question)}</strong>
            <div class="d-flex flex-col gap-xs mb-2">
              ${(q.options || [])
                .map(
                  (opt, oIdx) => `
                  <label class="asmt-option-label d-flex align-center gap-xs p-2 rounded-sm bg-card border-subtle cursor-pointer">
                    <input type="radio" name="asmt_mcq_${qIdx}" value="${oIdx}" class="cursor-pointer" />
                    <span class="text-xs text-primary">${escapeHtml(opt)}</span>
                  </label>
                `
                )
                .join("")}
            </div>
            <div class="asmt-hint-box text-xs p-2 bg-sunken border-subtle rounded-sm hidden" id="asmtHint_${qIdx}"></div>
          </div>
        `
        )
        .join("");

      // Wire hint buttons
      mcqBox.querySelectorAll(".asmt-hint-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const qIdx = parseInt(btn.getAttribute("data-qidx"), 10);
          const tier = parseInt(btn.getAttribute("data-tier"), 10);
          const hintBox = document.getElementById(`asmtHint_${qIdx}`);
          
          btn.disabled = true;
          btn.textContent = "Loading hint...";

          try {
            const token = store.get("token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("/api/assessment/hint", {
              method: "POST",
              headers,
              body: JSON.stringify({
                sessionId: this.currentAssessment.sessionId,
                questionIndex: qIdx,
                tier: tier,
              }),
            });

            const hintData = await res.json();
            if (!res.ok) throw new Error(hintData.detail || "Failed to fetch hint.");

            if (hintBox) {
              hintBox.innerHTML = `<strong>Hint (Tier ${tier} · -${hintData.penaltyPct}% score):</strong> ${escapeHtml(hintData.hint)}`;
              hintBox.classList.remove("hidden");
            }

            if (tier < 3) {
              btn.disabled = false;
              btn.setAttribute("data-tier", String(tier + 1));
              btn.textContent = `💡 Hint ${tier + 1} (-${(tier + 1) * 25}% pts)`;
            } else {
              btn.disabled = true;
              btn.textContent = "All hints unlocked";
            }
          } catch (e) {
            btn.disabled = false;
            btn.textContent = `💡 Hint ${tier}`;
            if (window.showToast) window.showToast("Could not retrieve hint: " + e.message, "error");
          }
        });
      });
    }

    // Coding challenge
    const ch = data.codingChallenge || {};
    const titleEl = document.getElementById("asmtCodingTitle");
    if (titleEl) titleEl.textContent = `Part 2 · ${ch.title || "Coding Challenge"} (35% Weight)`;

    const promptEl = document.getElementById("asmtCodingPrompt");
    if (promptEl) promptEl.textContent = ch.prompt || "";

    const editorEl = document.getElementById("asmtCodeEditor");
    if (editorEl) editorEl.value = ch.starterCode || "";

    const tcList = document.getElementById("asmtTestCasesList");
    if (tcList) {
      tcList.innerHTML = (ch.testCases || [])
        .map((tc) => `<div>• <strong>Input:</strong> <code>${escapeHtml(tc.input)}</code> → <strong>Expected:</strong> <code>${escapeHtml(tc.expected)}</code></div>`)
        .join("");
    }
  }

  async submitTest() {
    if (!this.currentAssessment) {
      await this.generateTest();
      return;
    }

    const sess = this.currentAssessment;
    const mcqAnswers = (sess.questions || []).map((_, qIdx) => {
      const el = document.querySelector(`input[name="asmt_mcq_${qIdx}"]:checked`);
      return el ? parseInt(el.value, 10) : -1;
    });
    const codeSubmission = document.getElementById("asmtCodeEditor")?.value || "";

    const submitBtn = document.getElementById("submitAssessmentBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Grading Test...";
    }

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: sess.sessionId,
          mcqAnswers,
          codeSubmission,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Assessment grading failed.");

      this.renderResults(data);
      this.loadHistory();
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit for Evaluation";
      }
    }
  }

  renderResults(data) {
    const resCard = document.getElementById("asmtResultCard");
    if (resCard) {
      resCard.style.display = "block";
      resCard.classList.remove("hidden");
    }

    const badge = document.getElementById("asmtFinalScoreBadge");
    if (badge) {
      badge.textContent = `Overall: ${Math.round(data.overallScore)}% (MCQ: ${Math.round(data.mcqScore)}% · Code: ${Math.round(data.codingScore)}%)`;
    }

    const revList = document.getElementById("asmtReviewList");
    if (revList) {
      const codeRev = data.codingReview || {};
      revList.innerHTML = [
        `<div class="card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 3px solid var(--brand-accent);">
          <strong style="font-size: 0.92rem;">${escapeHtml(data.evaluationMode || "Evaluation")}</strong>
          <p style="margin: 4px 0 0; font-size: 0.84rem; color: var(--text-secondary);">${escapeHtml(codeRev.feedback || "")} (Test Cases Passed: ${codeRev.passedCases}/${codeRev.totalCases})</p>
        </div>`,
        ...(data.questionReviews || []).map(
          (qr, idx) => `
          <div class="card" style="padding: 10px 14px; margin-bottom: 8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>Question ${idx + 1}</strong>
              <span class="tag ${qr.isCorrect ? "tag-match" : "tag-gap"}">${qr.isCorrect ? "✓ Correct (+10 pts)" : "Incorrect (0 pts)"}</span>
            </div>
            <p style="margin: 4px 0 0; font-size: 0.82rem; color: var(--text-secondary);">${escapeHtml(qr.explanation || "")}</p>
          </div>
        `
        ),
      ].join("");
    }
  }

  async loadHistory() {
    try {
      const resume = store.get("activeResume");
      const url = resume?.id ? `/api/assessment/history?resumeId=${encodeURIComponent(resume.id)}` : "/api/assessment/history";
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const tableBody = document.getElementById("asmtHistoryBody");
        const listEl = document.getElementById("asmtHistoryList");
        const hist = data.history || [];

        if (tableBody) {
          if (!hist.length) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-tertiary">No test sessions yet.</td></tr>`;
          } else {
            tableBody.innerHTML = hist
              .map(
                (h) => `
                <tr>
                  <td class="text-xs text-secondary">${escapeHtml((h.completedAt || "").slice(0, 10))}</td>
                  <td><strong>${escapeHtml(h.topic)}</strong></td>
                  <td><span class="badge-tag">${escapeHtml(h.difficulty)}</span></td>
                  <td class="num font-semibold text-accent">${Math.round(h.overallScore)}%</td>
                </tr>
              `
              )
              .join("");
          }
        } else if (listEl) {
          if (!hist.length) {
            listEl.innerHTML = `<p style="font-size:0.8rem;color:var(--text-tertiary);">No completed skill assessments recorded yet.</p>`;
          } else {
            listEl.innerHTML = hist
              .map(
                (h) => `
                <div class="card" style="padding:10px 14px;margin-bottom:6px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>${escapeHtml(h.topic)} (${escapeHtml(h.difficulty)})</strong>
                    <span class="tag tag-match">${Math.round(h.overallScore)}%</span>
                  </div>
                  <p style="font-size:0.75rem;color:var(--text-tertiary);margin:4px 0 0;">
                    MCQ: ${h.correctCount}/${h.totalQuestions} · Evaluated: ${escapeHtml(h.evaluationMode || "standard")} · ${escapeHtml(h.completedAt || "")}
                  </p>
                </div>
              `
              )
              .join("");
          }
        }
      }
    } catch (_) {}
  }
}

export const assessmentModule = new AssessmentModule();
