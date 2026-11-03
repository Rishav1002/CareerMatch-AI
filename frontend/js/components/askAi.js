/**
 * CareerMatch AI: Ask AI Advisor Component
 * Context-aware intelligent assistant with server-side rate limiting and usage meter
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
  }

  init() {
    this._injectDOM();
    this._attachListeners();
    this.refreshUsage();
  }

  _injectDOM() {
    if (document.getElementById("askAiDrawerBackdrop")) return;

    this.backdrop = document.createElement("div");
    this.backdrop.id = "askAiDrawerBackdrop";
    this.backdrop.className = "ask-ai-backdrop";
    this.backdrop.style.display = "none";

    this.backdrop.innerHTML = `
      <div class="ask-ai-drawer" id="askAiDrawer" role="dialog" aria-modal="true" aria-label="CareerMatch AI Advisor">
        <div class="ask-ai-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="ask-ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 22 12 12 22 2 12"></polygon>
                <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
              </svg>
            </div>
            <div>
              <h3 style="font-size: 1.05rem; margin: 0; font-family: var(--font-display);">CareerMatch Advisor</h3>
              <span style="font-size: 0.75rem; color: var(--text-tertiary);" id="askAiSubhead">Grounded career & skill guidance</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge" id="askAiDrawerUsageMeter" style="font-family: var(--font-mono); font-size: 0.72rem; padding: 3px 8px; border-radius: var(--radius-full); background: var(--bg-sunken); border: 1px solid var(--border-subtle);">
              5/5 queries
            </span>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" id="closeAskAiBtn" aria-label="Close Advisor">✕</button>
          </div>
        </div>

        <!-- Quick Prompts Row -->
        <div class="ask-ai-quick-prompts" id="askAiQuickPrompts">
          <button type="button" class="quick-prompt-pill" data-prompt="How do I optimize my resume for high ATS scores in Indian tech companies?">
            🎯 ATS Optimization
          </button>
          <button type="button" class="quick-prompt-pill" data-prompt="What project should I build next to prove my skills to recruiters?">
            🚀 Next Project Idea
          </button>
          <button type="button" class="quick-prompt-pill" data-prompt="What are typical interview questions for my target role?">
            💬 Interview Prep
          </button>
        </div>

        <!-- Conversation History Container -->
        <div class="ask-ai-messages" id="askAiMessages">
          <div class="ask-ai-msg bot">
            <p style="margin: 0;">
              Hello! I'm your CareerMatch AI Advisor. I have context on your current target role and active resume. How can I help sharpen your placement readiness today?
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
              placeholder="Ask anything about roles, resumes, or prep..."
              autocomplete="off"
              style="flex: 1; font-size: 0.875rem;"
            />
            <button type="submit" class="btn btn-primary" id="askAiSendBtn" style="padding: 0 16px;">
              Ask
            </button>
          </form>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 6px; text-align: center;">
            Server-side rate limited to protect resources.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);

    this.drawer = document.getElementById("askAiDrawer");
    this.messagesContainer = document.getElementById("askAiMessages");
    this.input = document.getElementById("askAiInput");
    this.sendBtn = document.getElementById("askAiSendBtn");
    this.usageMeter = document.getElementById("askAiDrawerUsageMeter");
  }

  _attachListeners() {
    // Open triggers
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

    // Quick prompt pills
    this.backdrop.querySelectorAll(".quick-prompt-pill").forEach((btn) => {
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

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.backdrop.style.display = "flex";
    setTimeout(() => {
      this.input?.focus();
    }, 100);
    this.refreshUsage();
  }

  close() {
    this.isOpen = false;
    this.backdrop.style.display = "none";
  }

  async refreshUsage() {
    try {
      const res = await fetch("/api/ai/usage");
      if (res.ok) {
        const data = await res.json();
        this.remaining = data.remaining;
        this.limit = data.limit;
        this._updateMeters();
      }
    } catch (_) {}
  }

  _updateMeters() {
    const text = `${this.remaining}/${this.limit} AI`;
    if (this.usageMeter) {
      this.usageMeter.textContent = `${this.remaining} of ${this.limit} left today`;
    }
    const topMeter = document.getElementById("askAiUsageMeter");
    if (topMeter) {
      topMeter.textContent = text;
    }
  }

  async submitQuery(question) {
    if (!question) return;
    this.input.value = "";
    this._appendMessage("user", question);

    // Typing indicator
    const typingId = "typing-" + Date.now();
    const typingEl = document.createElement("div");
    typingEl.id = typingId;
    typingEl.className = "ask-ai-msg bot typing";
    typingEl.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid var(--border-subtle);border-top-color:var(--brand-accent);border-radius:50%;animation:spin 0.8s linear infinite;"></span> Consulting Career Advisor...`;
    this.messagesContainer.appendChild(typingEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    if (this.sendBtn) this.sendBtn.disabled = true;

    try {
      const state = typeof window.getAppState === "function" ? window.getAppState() : {};
      const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const currentView = store.get("currentView") || "dashboard";

      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(store.get("token") ? { Authorization: `Bearer ${store.get("token")}` } : {}),
        },
        body: JSON.stringify({
          question,
          resume: state.activeResume || null,
          targetRole,
          currentView,
        }),
      });

      const data = await res.json();
      document.getElementById(typingId)?.remove();

      if (!res.ok) {
        if (res.status === 429) {
          this.remaining = 0;
          this._updateMeters();
          this._appendMessage("bot error", `⏳ **Rate Limit Reached**: ${data.detail || "You have reached your daily quota."}`);
        } else {
          this._appendMessage("bot error", `⚠️ ${data.detail || "Unable to consult advisor. Please try again."}`);
        }
        return;
      }

      this.remaining = data.remaining;
      this.limit = data.limit;
      this._updateMeters();
      this._appendMessage("bot", data.answer);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      this._appendMessage("bot error", `⚠️ Network error: ${err.message}`);
    } finally {
      if (this.sendBtn) this.sendBtn.disabled = false;
    }
  }

  _appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `ask-ai-msg ${sender}`;
    // Simple markdown formatting: bold and bullets
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
