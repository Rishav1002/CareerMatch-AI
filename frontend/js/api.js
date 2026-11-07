/**
 * CareerMatch AI: Central API Client
 * Robust error handling, JWT auth headers, Render/Neon cold-start auto-retry, and inline errors
 */

import { store } from "./store.js";

export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function renderInlineError(containerEl, message, retryFn) {
  if (!containerEl) return;
  const safeMsg = typeof message === "string" ? message : (message?.detail || message?.message || "Failed to load data.");
  containerEl.innerHTML = `
    <div class="card p-3 text-center bg-sunken border-subtle">
      <p class="text-sm text-secondary mb-2">${escapeHtml(safeMsg)}</p>
      ${retryFn ? `<button type="button" class="btn btn-secondary btn-sm" id="inlineRetryBtn">Retry</button>` : ""}
    </div>
  `;
  if (retryFn) {
    containerEl.querySelector("#inlineRetryBtn")?.addEventListener("click", () => retryFn());
  }
}
  const cleanText = String(safeMsg)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  containerEl.innerHTML = `
    <div class="inline-error-card" role="alert" style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-subtle, #e2e8f0); border-left: 4px solid var(--score-low, #ef4444); border-radius: var(--radius-md, 8px); padding: clamp(12px, 2vw, 20px); margin: 12px 0;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 200px;">
          <div style="color: var(--score-low, #ef4444); flex-shrink: 0; margin-top: 2px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h4 style="margin: 0 0 4px; font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">Failed to load data</h4>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${cleanText}</p>
          </div>
        </div>
        ${retryFn ? `
          <button type="button" class="btn btn-secondary btn-sm inline-error-retry-btn" style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Retry</span>
          </button>
        ` : ""}
      </div>
    </div>
  `;

  if (retryFn) {
    const btn = containerEl.querySelector(".inline-error-retry-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        containerEl.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted);"><span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid var(--border-subtle); border-top-color: var(--brand-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px;"></span> Loading...</div>`;
        retryFn();
      });
    }
  }
}

if (typeof window !== "undefined") {
  window.renderInlineError = renderInlineError;
}

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

async function request(path, options = {}, maxRetries = 2) {
  const token = store.get("token");
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(path, { credentials: "same-origin", ...options, headers });

      let data = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try { data = JSON.parse(text); } catch { data = text; }
      }

      if (!response.ok) {
        if (response.status === 401) {
          store.set("token", "");
          store.set("currentUser", null);
        }

        // Silent retry on cold-start gateway errors (502/503/504)
        if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
          attempt++;
          await new Promise((r) => setTimeout(r, attempt * 1200));
          continue;
        }

        const errMsg = (data && (data.detail || data.message || data.error)) || `Request failed with status ${response.status}`;
        throw new ApiError(errMsg, response.status, data);
      }

      return data;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }

      // Silent retry on transient network disconnects
      if (attempt < maxRetries) {
        attempt++;
        await new Promise((r) => setTimeout(r, attempt * 1200));
        continue;
      }

      if (!navigator.onLine) {
        throw new ApiError("You appear to be offline. Please check your network connection.", 0);
      }
      throw new ApiError(err.message || "Network request failed", 500);
    }
  }
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
    register: (fullName, email, password) => request("/api/auth/register", { method: "POST", body: { fullName, email, password } }),
  },

  // Student Profile & Bootstrap
  bootstrap: () => request("/api/bootstrap", { method: "GET" }),
  profile: {
    get: () => request("/api/profile", { method: "GET" }),
    update: (data) => request("/api/profile", { method: "PUT", body: data }),
    export: () => request("/api/profile/export", { method: "GET" }),
    delete: () => request("/api/profile/delete", { method: "DELETE" }),
  },
  dashboard: {
    get: () => request("/api/dashboard", { method: "GET" }),
  },

  // Roles Catalog
  roles: {
    list: () => request("/api/roles", { method: "GET" }),
  },

  // Resume Parsing & Analysis
  resume: {
    parse: (resumeText, filename = "pasted_resume.txt") =>
      request("/api/resume/parse", { method: "POST", body: { resumeText, filename } }),
    upload: (file, dontSave = false) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dontSave", dontSave ? "true" : "false");
      return request("/api/resume/upload", { method: "POST", body: formData });
    },
    updateSkills: (skills) =>
      request("/api/resume/skills", { method: "PUT", body: { skills } }),
  },
  analyze: (payload) =>
    request("/api/analyze", { method: "POST", body: payload }),

  // ATS Simulator
  ats: {
    evaluate: (payload) => request("/api/ats/evaluate", { method: "POST", body: payload }),
  },

  // Adaptive Roadmap
  roadmap: {
    getAdaptive: (payload) => request("/api/roadmap/adaptive", { method: "POST", body: payload }),
    updateTask: (payload) => request("/api/roadmap/task", { method: "POST", body: payload }),
    submitQuiz: (payload) => request("/api/roadmap/quiz", { method: "POST", body: payload }),
  },

  // Mock Interview Simulator
  interview: {
    start: (payload) => request("/api/interview/start", { method: "POST", body: payload }),
    submitAnswer: (payload) => request("/api/interview/answer", { method: "POST", body: payload }),
    history: () => request("/api/interview/history", { method: "GET" }),
  },

  // Skill Assessment Lab
  assessment: {
    generate: (payload) => request("/api/assessment/generate", { method: "POST", body: payload }),
    submit: (payload) => request("/api/assessment/submit", { method: "POST", body: payload }),
    hint: (payload) => request("/api/assessment/hint", { method: "POST", body: payload }),
    history: () => request("/api/assessment/history", { method: "GET" }),
  },

  // GitHub Portfolio Proof
  github: {
    analyze: (payload) => request("/api/github/analyze", { method: "POST", body: payload }),
  },

  // Job Market Intelligence
  jobs: {
    getMarket: (payload) => request("/api/jobs/market", { method: "POST", body: payload }),
  },

  // Career Path & Role Benchmark
  career: {
    compare: (payload) => request("/api/career/compare", { method: "POST", body: payload }),
  },

  // Placement Readiness Index
  readiness: {
    getIndex: (payload) => request("/api/readiness/index", { method: "POST", body: payload }),
  },
};
