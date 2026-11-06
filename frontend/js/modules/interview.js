/**
 * CareerMatch AI: Mock Interview Feature Module
 * Single authoritative controller for #view-interview.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class InterviewModule {
  constructor() {
    this.initialized = false;
    this.timerInterval = null;
    this.secondsElapsed = 0;
    this.currentSession = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const startBtn = document.getElementById("startInterviewBtn") || document.getElementById("newInterviewSessionBtn");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.startNewSession());
    }

    const submitBtn = document.getElementById("submitInterviewAnswerBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => this.submitAnswer());
    }

    const nextBtn = document.getElementById("nextInterviewQuestionBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.goToNextQuestion());
    }

    store.subscribe("activeResume", () => {
      if (store.get("currentView") === "interview") {
        this.load();
      }
    });
  }

  async load() {
    const resume = store.get("activeResume");
    if (!resume) {
      this.renderEmptyState();
      return;
    }

    this.renderReadyState();
    await this.loadHistory();
  }

  renderEmptyState() {
    const emptyContainer = document.getElementById("interviewEmptyState");
    const contentContainer = document.getElementById("interviewContentContainer");
    if (emptyContainer) emptyContainer.hidden = false;
    if (contentContainer) contentContainer.hidden = true;
  }

  renderReadyState() {
    const emptyContainer = document.getElementById("interviewEmptyState");
    const contentContainer = document.getElementById("interviewContentContainer");
    if (emptyContainer) emptyContainer.hidden = true;
    if (contentContainer) contentContainer.hidden = false;
  }

  async loadHistory() {
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/interview/history", { headers });
      if (res.ok) {
        const data = await res.json();
        this.renderHistory(data.history || []);
      }
    } catch (_) {}
  }

  renderHistory(history) {
    const listEl = document.getElementById("interviewHistoryList");
    if (!listEl) return;

    if (!history.length) {
      listEl.innerHTML = `<p style="font-size:0.8rem;color:var(--text-tertiary);">No previous interview sessions recorded.</p>`;
      return;
    }

    listEl.innerHTML = history
      .map(
        (h) => `
        <div class="card" style="padding:10px 14px;margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${escapeHtml(h.targetRole)} · ${escapeHtml(h.interviewRound)}</strong>
            <span class="tag tag-match">${Math.round(h.overallScore)}%</span>
          </div>
          <p style="font-size:0.75rem;color:var(--text-tertiary);margin:4px 0 0;">
            ${h.answeredCount}/${h.totalQuestions} answered · ${escapeHtml(h.createdAt || "")}
          </p>
        </div>
      `
      )
      .join("");
  }

  async startNewSession() {
    const resume = store.get("activeResume");
    if (!resume) {
      alert("Please upload or select a resume before starting an interview.");
      window.location.hash = "#/analyzer";
      return;
    }

    const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const goalCompany = store.get("goalCompany") || document.getElementById("goalCompanyInput")?.value || "Tech Company";
    const interviewRound = document.getElementById("interviewRoundSelect")?.value || "Technical";
    const difficulty = document.getElementById("interviewDiffSelect")?.value || "Intermediate";

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume.id || "",
          targetRole,
          goalCompany,
          interviewRound,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not start interview.");

      this.currentSession = data;
      store.set("interviewSession", data);
      this.renderQuestion(data.currentQuestion, data.totalQuestions);
      this.startTimer();
    } catch (err) {
      alert("Failed to start mock interview: " + err.message);
    }
  }

  renderQuestion(qObj, totalQuestions) {
    if (!qObj) return;

    const badge = document.getElementById("intProgressBadge");
    if (badge) badge.textContent = `Question ${qObj.index} of ${totalQuestions}`;

    const contextEl = document.getElementById("intQuestionContext");
    if (contextEl) contextEl.textContent = qObj.context || "Technical Context";

    const textEl = document.getElementById("intQuestionText");
    if (textEl) textEl.textContent = qObj.question;

    const input = document.getElementById("intAnswerInput");
    if (input) {
      input.value = "";
      input.focus();
    }

    const nextBtn = document.getElementById("nextInterviewQuestionBtn");
    if (nextBtn) nextBtn.classList.add("hidden");

    const feedbackCard = document.getElementById("intFeedbackSection");
    if (feedbackCard) feedbackCard.classList.add("hidden");
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.secondsElapsed = 0;
    const disp = document.getElementById("intTimerDisplay");
    this.timerInterval = setInterval(() => {
      this.secondsElapsed += 1;
      const mins = String(Math.floor(this.secondsElapsed / 60)).padStart(2, "0");
      const secs = String(this.secondsElapsed % 60).padStart(2, "0");
      if (disp) disp.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async submitAnswer() {
    if (!this.currentSession) {
      await this.startNewSession();
      return;
    }

    const input = document.getElementById("intAnswerInput");
    const answerText = input?.value?.trim() || "";
    if (answerText.length < 5) {
      alert("Please type a response (at least 5 characters) before submitting.");
      return;
    }

    const submitBtn = document.getElementById("submitInterviewAnswerBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Evaluating Answer...";
    }

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: this.currentSession.sessionId,
          questionIndex: this.currentSession.currentQuestion.index,
          answerText,
          inputMode: "text",
          timeTakenSeconds: this.secondsElapsed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to evaluate answer.");

      this.renderEvaluation(data);
    } catch (err) {
      alert("Evaluation failed: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Answer";
      }
    }
  }

  renderEvaluation(data) {
    const ev = data.questionEvaluation;
    if (!ev) return;

    const feedbackSection = document.getElementById("intFeedbackSection");
    if (feedbackSection) feedbackSection.classList.remove("hidden");

    const scoreBadge = document.getElementById("intEvalScoreBadge");
    if (scoreBadge) scoreBadge.textContent = `Score: ${Math.round(ev.overallScore)}%`;

    const feedbackText = document.getElementById("intFeedbackText");
    if (feedbackText) feedbackText.textContent = ev.feedback || "";

    const sampleText = document.getElementById("intSampleAnswerText");
    if (sampleText) sampleText.textContent = ev.sampleAnswer || "";

    const nextBtn = document.getElementById("nextInterviewQuestionBtn");
    if (nextBtn) {
      if (data.sessionProgress?.status === "completed") {
        nextBtn.textContent = "Interview Completed ✓";
        nextBtn.classList.remove("hidden");
        this.stopTimer();
      } else {
        nextBtn.textContent = "Next Question →";
        nextBtn.classList.remove("hidden");
        this.currentSession.nextQuestion = data.nextQuestion;
      }
    }
  }

  goToNextQuestion() {
    if (this.currentSession?.nextQuestion) {
      this.currentSession.currentQuestion = this.currentSession.nextQuestion;
      this.renderQuestion(this.currentSession.currentQuestion, this.currentSession.totalQuestions);
      this.startTimer();
    }
  }

  render() {
    this.load();
  }
}

export const interviewModule = new InterviewModule();
