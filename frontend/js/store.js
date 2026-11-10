/**
 * CareerMatch AI: Store & State Management (Single Source of Truth)
 * Integrates with unified storage.js and publishes state changes.
 */

import { storage } from "./storage.js";

class Store {
  constructor() {
    this.subscribers = new Map();

    const hasLS = typeof localStorage !== "undefined" && localStorage !== null;
    const savedTheme = storage.getPref("theme", null) || (hasLS ? localStorage.getItem("cm_theme") : null) || "light";
    const savedToken = hasLS ? (localStorage.getItem("cm_jwt_token") || localStorage.getItem("cm:v1:token") || localStorage.getItem("careermatch_jwt_token") || "") : "";
    if (hasLS) {
      try {
        localStorage.removeItem("cm:v1:token");
        localStorage.removeItem("careermatch_jwt_token");
        if (savedToken) {
          localStorage.setItem("cm_jwt_token", savedToken);
        }
      } catch (_) {}
    }
    const savedUser = storage.getPref("user", null);

    if (savedUser?.id) {
      storage.setScope(savedUser.id);
    } else {
      storage.setScope(null);
    }

    this.state = {
      token: savedToken,
      currentUser: savedUser,
      studentProfile: null,
      theme: savedTheme,
      currentView: "landing",
      sidebarCollapsed: false,
      parsedResume: null,
      rawResumeText: "",
      targetRole: "Full Stack Developer",
      goalCompany: "",
      analysisResult: null,
      atsResult: null,
      roadmapData: null,
      interviewSession: null,
      assessmentSession: null,
      priData: null,
      jobsData: null,
      careerCompareData: null,
      trackerJobs: storage.getPref("trackerJobs", []),
      plannerTasks: storage.getPref("plannerTasks", []),
      resumeHistory: storage.getPref("resumeHistory", []),
      streak: storage.getPref("streak", { current: 1, lastDate: new Date().toISOString().split("T")[0] }),
      notifications: storage.getPref("notifications", [
        { id: 1, title: "Welcome to CareerMatch AI", desc: "Start by analyzing your resume against live industry benchmarks.", time: "Just now", unread: true },
      ]),
    };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.emit(key, value);
    this._persist(key, value);
  }

  update(patch) {
    Object.keys(patch).forEach((key) => {
      this.state[key] = patch[key];
      this.emit(key, patch[key]);
      this._persist(key, patch[key]);
    });
  }

  _persist(key, value) {
    try {
      if (key === "token") {
        if (value) {
          localStorage.setItem("cm_jwt_token", value);
          localStorage.removeItem("cm:v1:token");
          localStorage.removeItem("careermatch_jwt_token");
        } else {
          localStorage.removeItem("cm_jwt_token");
          localStorage.removeItem("cm:v1:token");
          localStorage.removeItem("careermatch_jwt_token");
        }
      }
      if (key === "currentUser") {
        storage.setPref("user", value);
        storage.setScope(value?.id || null);
      }
      if (key === "theme") {
        storage.setPref("theme", value);
        localStorage.setItem("cm_theme", value);
        localStorage.setItem("theme", value);
        document.documentElement.setAttribute("data-theme", value);
        document.documentElement.style.colorScheme = value;
      }
      if (key === "trackerJobs") storage.setPref("trackerJobs", value);
      if (key === "plannerTasks") storage.setPref("plannerTasks", value);
      if (key === "resumeHistory") storage.setPref("resumeHistory", value);
      if (key === "streak") storage.setPref("streak", value);
      if (key === "notifications") storage.setPref("notifications", value);
    } catch (e) {
      console.warn("[Store] Persistence error:", e);
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    return () => this.subscribers.get(key).delete(callback);
  }

  emit(key, value) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach((cb) => {
        try {
          cb(value);
        } catch (err) {
          console.error(`[Store] Error in subscriber for ${key}:`, err);
        }
      });
    }
  }
}

export const store = new Store();
