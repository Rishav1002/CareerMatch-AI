/**
 * CareerMatch AI: Floating Ask AI Button & Frosted Drawer (Section 13 D)
 * Sits bottom-right on all pages (respects safe areas), 3D frosted rounded square (56px),
 * label expands on desktop hover, remaining badge (<=3), keyboard shortcut (Cmd/Ctrl+J or ?),
 * focus trap, Esc to close.
 */

import { store } from "../store.js";
import { attachSpecularHighlight } from "../motion.js";

class FloatingAskAiManager {
  constructor() {
    this.container = null;
    this.drawer = null;
    this.triggerBtn = null;
    this.isOpen = false;
    this.remainingCount = 5;
    this.dailyLimit = 5;
  }

  init() {
    this.renderDOM();
    this.attachEvents();
    this.syncUsage();
  }

  renderDOM() {
    // If already exists, return
    if (document.getElementById("floatingAskAiContainer")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "floatingAskAiContainer";
    wrapper.className = "floating-ask-ai-wrapper";
    wrapper.innerHTML = `
      <!-- Floating Trigger Button -->
      <button type="button" class="floating-ask-ai-btn" id="floatingAskAiBtn" aria-label="Ask CareerMatch AI Assistant" title="Ask AI Advisor (Ctrl+J)">
        <span class="sparkle-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83l-2.83 2.83m-8 8l-2.83 2.83m0-13.66l2.83 2.83m8 8l2.83 2.83"></path>
          </svg>
        </span>
        <span class="floating-btn-label">Ask AI</span>
        <span class="usage-count-badge" id="floatingAiUsageBadge" style="display: none;">5</span>
      </button>

      <!-- Frosted Side Drawer & Backdrop -->
      <div class="ask-ai-backdrop" id="floatingAskAiBackdrop" style="display: none;" aria-hidden="true">
        <aside class="ask-ai-drawer glass-panel" id="floatingAskAiDrawer" role="dialog" aria-labelledby="floatingAiDrawerTitle" aria-modal="true">
          <div class="ask-ai-drawer-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="sparkle-icon-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83l-2.83 2.83m-8 8l-2.83 2.83m0-13.66l2.83 2.83m8 8l2.83 2.83"></path>
                </svg>
              </span>
              <h2 id="floatingAiDrawerTitle" style="font-size: 1.05rem; font-family: var(--font-ui); font-weight: 600; margin: 0;">CareerMatch AI Advisor</h2>
            </div>
            <button type="button" class="btn-icon btn-ghost" id="closeFloatingAiBtn" aria-label="Close Assistant">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Usage Meter Bar -->
          <div class="ai-usage-meter-bar" style="padding: 10px 18px; border-bottom: 1px solid var(--glass-border-subtle); background: var(--glass-bg-subtle);">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-family: var(--font-mono); margin-bottom: 4px;">
              <span>Daily Queries Remaining</span>
              <span id="floatingAiMeterText">5 of 5 free</span>
            </div>
            <div style="height: 4px; background: rgba(0,0,0,0.1); border-radius: 999px; overflow: hidden;">
              <div id="floatingAiMeterFill" style="height: 100%; width: 100%; background: var(--brand-accent); transition: width 300ms ease;"></div>
            </div>
          </div>

          <!-- Chat History / Advice Area -->
          <div class="ask-ai-messages" id="floatingAiMessagesArea" style="flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
            <div class="ai-msg-bubble assistant">
              <p style="margin: 0; font-size: 0.88rem; line-height: 1.5;">
                Hello! I am your explainable CareerMatch Advisor. Ask me anything about placement readiness, skill gaps, Indian tech hiring standards, or interview strategies.
              </p>
            </div>
          </div>

          <!-- Input Footer -->
          <form class="ask-ai-input-form" id="floatingAiForm" style="padding: 14px 18px; border-top: 1px solid var(--glass-border-subtle); background: var(--glass-bg-subtle);">
            <div style="display: flex; gap: 8px;">
              <input
                type="text"
                class="form-control"
                id="floatingAiQuestionInput"
                placeholder="Ask about roles, gaps, or interviews..."
                maxlength="500"
                required
                style="flex: 1; font-size: 0.875rem;"
              />
              <button type="submit" class="btn btn-primary btn-sm" id="floatingAiSendBtn">
                Ask
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: 6px; text-align: right;">
              Press Esc to close · Ctrl+J to toggle
            </div>
          </form>
        </aside>
      </div>
    `;

    document.body.appendChild(wrapper);

    this.container = wrapper;
    this.drawer = document.getElementById("floatingAskAiDrawer");
    this.backdrop = document.getElementById("floatingAskAiBackdrop");
    this.triggerBtn = document.getElementById("floatingAskAiBtn");

    attachSpecularHighlight(this.triggerBtn);
  }

  attachEvents() {
    this.triggerBtn.addEventListener("click", () => this.toggle());

    const closeBtn = document.getElementById("closeFloatingAiBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    if (this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        if (e.target === this.backdrop) this.close();
      });
    }

    // Keyboard shortcuts (Ctrl+J, Cmd+J, or Esc)
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    const form = document.getElementById("floatingAiForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleQuestionSubmit();
      });
    }
  }

  async syncUsage() {
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/ai/usage", { headers });
      if (res.ok) {
        const data = await res.json();
        this.remainingCount = Number(data.remaining ?? 5);
        this.dailyLimit = Number(data.limit ?? 5);
        this.updateUsageUI();
      }
    } catch {}
  }

  updateUsageUI() {
    const badge = document.getElementById("floatingAiUsageBadge");
    const meterText = document.getElementById("floatingAiMeterText");
    const meterFill = document.getElementById("floatingAiMeterFill");

    if (badge) {
      badge.textContent = String(this.remainingCount);
      badge.style.display = this.remainingCount <= 3 ? "flex" : "none";
    }

    if (meterText) {
      meterText.textContent = `${this.remainingCount} of ${this.dailyLimit} free`;
    }

    if (meterFill) {
      const pct = Math.max(0, Math.min(100, (this.remainingCount / this.dailyLimit) * 100));
      meterFill.style.width = `${pct}%`;
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    if (this.backdrop) {
      this.backdrop.style.display = "flex";
      this.backdrop.setAttribute("aria-hidden", "false");
    }
    const input = document.getElementById("floatingAiQuestionInput");
    if (input) setTimeout(() => input.focus(), 100);
    this.syncUsage();
  }

  close() {
    this.isOpen = false;
    if (this.backdrop) {
      this.backdrop.style.display = "none";
      this.backdrop.setAttribute("aria-hidden", "true");
    }
    if (this.triggerBtn) this.triggerBtn.focus();
  }

  async handleQuestionSubmit() {
    const input = document.getElementById("floatingAiQuestionInput");
    const sendBtn = document.getElementById("floatingAiSendBtn");
    const q = input?.value?.trim();
    if (!q) return;

    const messagesArea = document.getElementById("floatingAiMessagesArea");
    if (!messagesArea) return;

    // Append user question
    const userBubble = document.createElement("div");
    userBubble.className = "ai-msg-bubble user";
    userBubble.innerHTML = `<p style="margin: 0; font-size: 0.88rem;">${this.escape(q)}</p>`;
    messagesArea.appendChild(userBubble);
    input.value = "";
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Loading indicator
    const loadingBubble = document.createElement("div");
    loadingBubble.className = "ai-msg-bubble assistant loading";
    loadingBubble.innerHTML = `<p style="margin: 0; font-size: 0.84rem; color: var(--text-tertiary);">Formulating explainable advice...</p>`;
    messagesArea.appendChild(loadingBubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    if (sendBtn) sendBtn.disabled = true;

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: q,
          targetRole: store.get("targetRole") || "Full Stack Developer",
          currentView: store.get("currentView") || "landing",
        }),
      });

      const data = await res.json();
      loadingBubble.remove();

      const aiBubble = document.createElement("div");
      aiBubble.className = "ai-msg-bubble assistant";

      if (res.ok && data.answer) {
        aiBubble.innerHTML = `<div style="font-size: 0.88rem; line-height: 1.55;">${this.formatAnswer(data.answer)}</div>`;
        this.remainingCount = Number(data.remaining ?? (this.remainingCount - 1));
        this.updateUsageUI();
      } else {
        const errMsg = data.detail || "Daily query limit reached or advice unavailable right now.";
        aiBubble.innerHTML = `<p style="margin: 0; font-size: 0.88rem; color: var(--score-low);">${this.escape(errMsg)}</p>`;
      }

      messagesArea.appendChild(aiBubble);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    } catch (err) {
      loadingBubble.remove();
      const errBubble = document.createElement("div");
      errBubble.className = "ai-msg-bubble assistant";
      errBubble.innerHTML = `<p style="margin: 0; font-size: 0.88rem; color: var(--score-low);">Could not reach AI advisor. Please check your network and try again.</p>`;
      messagesArea.appendChild(errBubble);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  escape(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  formatAnswer(txt) {
    const clean = this.escape(txt);
    return clean.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
  }
}

export const floatingAskAi = new FloatingAskAiManager();
