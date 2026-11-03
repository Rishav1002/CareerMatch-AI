/**
 * CareerMatch AI: Central API Client
 * Robust error handling, JWT auth headers, and endpoint mapping
 */

import { store } from "./store.js";

class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
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

  try {
    const response = await fetch(path, { ...options, headers });

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
        // Clear invalid token if rejected
        store.set("token", "");
        store.set("currentUser", null);
      }
      const errMsg = (data && (data.detail || data.message || data.error)) || `Request failed with status ${response.status}`;
      throw new ApiError(errMsg, response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (!navigator.onLine) {
      throw new ApiError("You appear to be offline. Please check your network connection.", 0);
    }
    throw new ApiError(err.message || "Network request failed", 500);
  }
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
    register: (fullName, email, password) => request("/api/auth/register", { method: "POST", body: { fullName, email, password } }),
    demo: () => request("/api/auth/demo", { method: "POST", body: {} }),
  },

  // Student Profile & Bootstrap
  bootstrap: () => request("/api/bootstrap", { method: "GET" }),
  profile: {
    get: () => request("/api/profile", { method: "GET" }),
    update: (data) => request("/api/profile", { method: "PUT", body: data }),
  },
  dashboard: {
    get: () => request("/api/dashboard", { method: "GET" }),
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
