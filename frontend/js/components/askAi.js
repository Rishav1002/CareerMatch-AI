/**
 * CareerMatch AI: Unified Ask AI Advisor Component
 * Single authoritative advisor drawer triggered via topbar (#askAiTopBtn) and Ctrl/Cmd+J.
 * Direct synchronization with /api/ai/usage and store.js state.
 */

import { api } from "../api.js";
import { store } from "../store.js";

class AskAiAdvisor {
  constructor() {
    this.isOpen = false;
    this.backdrop = null;
    this.drawer = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendBtn = null;
    this.usageMeter = null;
    this.remaining = 5;
    this.limit = 5;
    this.resetAt = "midnight UTC";
  }

  init() {
    this._injectDOM();
    this._attachListeners();
    this.refreshUsage();
  }

  _injectDOM() {
    // 1. Inject 3D Floating Action Button (Bug 7)
    if (!document.getElementById("askAiFab")) {
      const fab = document.createElement("button");
      fab.id = "askAiFab";
      fab.className = "ask-ai-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Ask Career Advisor AI (Ctrl+J)");
      fab.title = "Ask AI (Ctrl+J)";
      fab.innerHTML = `
        <svg fill="none" height="22" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="22" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span class="ask-ai-fab-badge" id="askAiFabUsageBadge">5</span>
      `;
      fab.addEventListener("click", () => this.toggle());
      document.body.appendChild(fab);
    }

    if (document.getElementById("askAiDrawerBackdrop")) return;

    this.backdrop = document.createElement("div");
    this.backdrop.id = "askAiDrawerBackdrop";
    this.backdrop.className = "ask-ai-backdrop";
    this.backdrop.style.display = "none";
    this.backdrop.setAttribute("aria-hidden", "true");

    this.backdrop.innerHTML = `
      <aside class="ask-ai-drawer" id="askAiDrawer" role="dialog" aria-modal="true" aria-labelledby="askAiDrawerHeading">
        <div class="ask-ai-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="ask-ai-avatar" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 22 12 12 22 2 12"></polygon>
                <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
              </svg>
            </div>
            <div>
              <h2 id="askAiDrawerHeading" style="font-size: 1.05rem; margin: 0; font-family: var(--font-display); font-weight: 600;">CareerMatch Advisor</h2>
              <span style="font-size: 0.75rem; color: var(--text-tertiary);" id="askAiSubhead">Grounded career & skill guidance</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge" id="askAiDrawerUsageMeter" style="font-family: var(--font-mono); font-size: 0.72rem; padding: 4px 10px; border-radius: var(--radius-sm); background: var(--bg-sunken); border: 1px solid var(--border-subtle);">
              5/5 queries
            </span>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" id="closeAskAiBtn" aria-label="Close Advisor">✕</button>
          </div>
        </div>

        <!-- Quick Prompts Row -->
        <div class="ask-ai-quick-prompts" id="askAiQuickPrompts">
          <button type="button" class="quick-prompt-chip" data-prompt="How do I optimize my resume for high ATS scores in Indian tech companies?">
            ATS Optimization
          </button>
          <button type="button" class="quick-prompt-chip" data-prompt="What project should I build next to prove my skills to recruiters?">
            Next Project
          </button>
          <button type="button" class="quick-prompt-chip" data-prompt="What are typical interview questions for my target role?">
            Interview Prep
          </button>
        </div>

        <!-- Conversation History Container -->
        <div class="ask-ai-messages" id="askAiMessages" role="log" aria-live="polite">
          <div class="ask-ai-msg bot">
            <p style="margin: 0;">
              Hello! I'm your CareerMatch AI Advisor. I have context on your target role and active resume. How can I assist your placement preparation today?
            </p>
          </div>
        </div>

        <!-- Input Area -->
        <div class="ask-ai-footer">
          <form id="askAiForm" style="display: flex; gap: 8px; width: 100%;">
            <input
              type="text"
              id="askAiInput"
              class="form-input"
              placeholder="Ask anything about roles, resumes, or prep (Ctrl+J)..."
              autocomplete="off"
              style="flex: 1; font-size: 0.875rem;"
            />
            <button type="submit" class="btn btn-primary" id="askAiSendBtn" style="padding: 0 16px;">
              Ask
            </button>
          </form>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 6px; text-align: center;" id="askAiResetNotice">
            Server-side rate limited (5/day for guests, 20/day for signed-in users).
          </div>
        </div>
      </aside>
    `;

    document.body.appendChild(this.backdrop);

    this.drawer = document.getElementById("askAiDrawer");
    this.messagesContainer = document.getElementById("askAiMessages");
    this.input = document.getElementById("askAiInput");
    this.sendBtn = document.getElementById("askAiSendBtn");
    this.usageMeter = document.getElementById("askAiDrawerUsageMeter");
  }

  _attachListeners() {
    // Open triggers: topbar button and any .ask-ai-trigger
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("#askAiTopBtn, .ask-ai-trigger");
      if (trigger) {
        e.preventDefault();
        this.open();
      }
    });

    // Close button & backdrop click
    document.getElementById("closeAskAiBtn")?.addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Quick prompt chips
    this.backdrop.querySelectorAll(".quick-prompt-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-prompt");
        if (this.input) {
          this.input.value = prompt;
          this.submitQuery(prompt);
        }
      });
    });

    // Form submit
    document.getElementById("askAiForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = this.input?.value.trim();
      if (val) this.submitQuery(val);
    });

    // Keyboard shortcuts: Cmd/Ctrl + J to toggle, Escape to close
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        if (this.isOpen) this.close();
        else this.open();
      } else if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.backdrop.style.display = "flex";
    this.backdrop.setAttribute("aria-hidden", "false");
    const fab = document.getElementById("askAiFab");
    if (fab) fab.style.opacity = "0";
    setTimeout(() => {
      this.input?.focus();
    }, 80);
    this.refreshUsage();
  }

  close() {
    this.isOpen = false;
    this.backdrop.style.display = "none";
    this.backdrop.setAttribute("aria-hidden", "true");
    const fab = document.getElementById("askAiFab");
    if (fab) {
      fab.style.opacity = "1";
      fab.focus();
    }
  }

  async refreshUsage() {
    try {
      const headers = {};
      const token = store.get("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/usage", { headers });
      if (res.ok) {
        const data = await res.json();
        this.remaining = data.remaining ?? 5;
        this.limit = data.limit ?? 5;
        this.resetAt = data.resetAt || "midnight UTC";
        this._updateMeters();
      }
    } catch (_) {}
  }

  _updateMeters() {
    const text = `${this.remaining}/${this.limit} left`;
    if (this.usageMeter) {
      this.usageMeter.textContent = `${this.remaining} of ${this.limit} left`;
    }
    const topMeter = document.getElementById("askAiUsageMeter");
    if (topMeter) {
      topMeter.textContent = text;
    }
    const fabBadge = document.getElementById("askAiFabUsageBadge");
    if (fabBadge) {
      fabBadge.textContent = String(this.remaining);
    }
    const notice = document.getElementById("askAiResetNotice");
    if (notice && this.remaining === 0) {
      notice.textContent = `Daily limit reached. Resets at ${this.resetAt}.`;
    }
  }

  async submitQuery(question) {
    if (!question || !question.trim()) return;
    const cleanQ = question.trim();
    if (this.input) this.input.value = "";
    this._appendMessage("user", cleanQ);

    // Typing indicator
    const typingId = "typing-" + Date.now();
    const typingEl = document.createElement("div");
    typingId;
    typingEl.id = typingId;
    typingEl.className = "ask-ai-msg bot typing";
    typingEl.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid var(--border-subtle);border-top-color:var(--brand-accent);border-radius:50%;animation:spin 0.8s linear infinite;"></span> Consulting Career Advisor...`;
    this.messagesContainer.appendChild(typingEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    if (this.sendBtn) this.sendBtn.disabled = true;

    try {
      const stateResume = store.get("activeResume") || null;
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const currentView = store.get("currentView") || "dashboard";
      const token = store.get("token");

      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: cleanQ,
          resume: stateResume,
          targetRole,
          currentView,
        }),
      });

      const data = await res.json();
      document.getElementById(typingId)?.remove();

      if (!res.ok) {
        if (res.status === 429) {
          this.remaining = 0;
          this.resetAt = data.resetAt || "midnight UTC";
          this._updateMeters();
          this._appendMessage("bot error", `⏳ **Rate Limit Reached**: ${data.detail || "You have reached your daily quota."}`);
        } else {
          this._appendMessage("bot error", `⚠️ ${data.detail || "Unable to consult advisor. Please try again."}`);
        }
        return;
      }

      this.remaining = data.remaining ?? Math.max(0, this.remaining - 1);
      this.limit = data.limit ?? this.limit;
      this.resetAt = data.resetAt || this.resetAt;
      this._updateMeters();
      this._appendMessage("bot", data.answer || "No response received.");
    } catch (err) {
      document.getElementById(typingId)?.remove();
      this._appendMessage("bot error", `⚠️ Advisor offline or connection failed: ${err.message}. Deterministic roadmaps and local assessments remain fully functional.`);
    } finally {
      if (this.sendBtn) this.sendBtn.disabled = false;
    }
  }

  _appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `ask-ai-msg ${sender}`;
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n- (.*?)(?=(\n|$))/g, "<br/>• $1");
    msg.innerHTML = formatted;
    this.messagesContainer.appendChild(msg);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

export const askAiAdvisor = new AskAiAdvisor();
