/**
 * CareerMatch AI: Central API Client
 * Robust error handling, JWT auth headers, Render/Neon cold-start auto-retry, and inline errors
 */

import { store } from "./store.js";
import { escapeHtml } from "./formatters.js";

export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function assertShape(endpointName, data, requiredKeys) {
  if (!data || typeof data !== "object") {
    console.error(`API contract mismatch: ${endpointName} returned invalid non-object response:`, data);
    return;
  }
  const missing = requiredKeys.filter((k) => !(k in data) || data[k] === undefined);
  if (missing.length > 0) {
    const msg = `API contract mismatch: ${endpointName} is missing required key(s): ${missing.join(", ")}`;
    console.error(msg, data);
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      if (typeof window.showToast === "function") {
        window.showToast(`Dev Warning: ${msg}`, "warning");
      }
    }
  }
}

export function renderInlineError(containerEl, message, retryFn) {
  if (!containerEl) return;
  const safeMsg = typeof message === "string" ? message : (message?.detail || message?.message || "Failed to load data.");
  containerEl.innerHTML = `
    <div class="card p-3 text-center bg-sunken border-subtle" role="alert">
      <p class="text-sm text-secondary mb-2">${escapeHtml(safeMsg)}</p>
      ${retryFn ? `<button type="button" class="btn btn-secondary btn-sm" id="inlineRetryBtn">Retry</button>` : ""}
    </div>
  `;
  if (retryFn) {
    const btn = containerEl.querySelector("#inlineRetryBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        containerEl.innerHTML = `<div class="p-3 text-center text-muted"><span class="spinner" aria-hidden="true"></span> Loading...</div>`;
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
  // Generic REST methods
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: async (path, body, options = {}) => {
    const res = await request(path, { ...options, method: "POST", body });
    if (path === "/api/analyze") {
      assertShape("/api/analyze", res, ["matchResult", "activeJob", "resume", "skillGaps", "stages"]);
    }
    return res;
  },
  put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),

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
  analyze: async (payload) => {
    const res = await request("/api/analyze", { method: "POST", body: payload });
    assertShape("/api/analyze", res, ["matchResult", "activeJob", "resume", "skillGaps", "stages"]);
    return res;
  },

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
