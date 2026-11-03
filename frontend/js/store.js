/**
 * CareerMatch AI: Store & State Management
 * Persistent localStorage state with pub/sub event bus
 */

const STORAGE_KEYS = {
  TOKEN: "careermatch_jwt_token",
  USER: "careermatch_user",
  THEME: "careermatch_theme",
  LANG: "careermatch_lang",
  TRACKER: "careermatch_kanban_jobs",
  PLANNER: "careermatch_study_planner",
  HISTORY: "careermatch_resume_history",
  STREAK: "careermatch_streak_data",
  NOTIFICATIONS: "careermatch_notifications",
};

class Store {
  constructor() {
    this.subscribers = new Map();
    this.state = {
      token: localStorage.getItem(STORAGE_KEYS.TOKEN) || "",
      currentUser: this._getStoredJson(STORAGE_KEYS.USER, null),
      studentProfile: null,
      theme: localStorage.getItem(STORAGE_KEYS.THEME) || "light",
      lang: localStorage.getItem(STORAGE_KEYS.LANG) || "en",
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
      trackerJobs: this._getStoredJson(STORAGE_KEYS.TRACKER, []),
      plannerTasks: this._getStoredJson(STORAGE_KEYS.PLANNER, []),
      resumeHistory: this._getStoredJson(STORAGE_KEYS.HISTORY, []),
      streak: this._getStoredJson(STORAGE_KEYS.STREAK, { current: 1, lastDate: new Date().toISOString().split("T")[0] }),
      notifications: this._getStoredJson(STORAGE_KEYS.NOTIFICATIONS, [
        { id: 1, title: "Welcome to CareerMatch AI", desc: "Start by analyzing your resume against live industry benchmarks.", time: "Just now", unread: true },
        { id: 2, title: "Career Match Ready", desc: "Select your target role and upload your resume to discover placement readiness.", time: "Just now", unread: true },
      ]),
    };
  }

  _getStoredJson(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
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
      if (key === "token") localStorage.setItem(STORAGE_KEYS.TOKEN, value);
      if (key === "currentUser") localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(value));
      if (key === "theme") localStorage.setItem(STORAGE_KEYS.THEME, value);
      if (key === "lang") localStorage.setItem(STORAGE_KEYS.LANG, value);
      if (key === "trackerJobs") localStorage.setItem(STORAGE_KEYS.TRACKER, JSON.stringify(value));
      if (key === "plannerTasks") localStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(value));
      if (key === "resumeHistory") localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(value));
      if (key === "streak") localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(value));
      if (key === "notifications") localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage persistence error:", e);
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    return () => this.subscribers.get(key).delete(callback);
  }

  emit(key, data) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach((cb) => {
        try { cb(data, this.state); } catch (e) { console.error(`Subscriber error for ${key}:`, e); }
      });
    }
    if (this.subscribers.has("*")) {
      this.subscribers.get("*").forEach((cb) => {
        try { cb(key, data, this.state); } catch (e) { console.error("Global subscriber error:", e); }
      });
    }
  }
}

export const store = new Store();
window.__careermatch_store = store;
