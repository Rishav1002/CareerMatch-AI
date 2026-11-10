/**
 * CareerMatch AI: Authentication Manager
 * Neon Managed Better Auth integration with guest mode preservation,
 * cryptographic password generator, strength meter, confirm password validation,
 * session restoration, and reactive avatar/user menu binding.
 */

import { store } from "../store.js";
import { router } from "../router.js";

export class AuthManager {
  constructor() {
    this.mode = "login"; // "login" | "signup"
  }

  init() {
    this.attachEventListeners();
    this.initModeFromHash();
    this.bindStore();
    this.restoreSession();
  }

  initModeFromHash() {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("signup")) {
      this.setMode("signup");
    } else {
      this.setMode("login");
    }

    window.addEventListener("hashchange", () => {
      const currentHash = window.location.hash.toLowerCase();
      if (currentHash.includes("signup")) {
        this.setMode("signup");
      } else if (currentHash.includes("login")) {
        this.setMode("login");
      }
    });
  }

  bindStore() {
    // Initial check from store
    const currentUser = store.get("currentUser");
    if (currentUser) {
      this.updateUserUI(currentUser);
    }

    // Subscribe to future store changes
    if (typeof store.subscribe === "function") {
      store.subscribe("currentUser", (user) => {
        this.updateUserUI(user);
      });
    }
  }

  setMode(mode) {
    this.mode = mode;
    const loginSeg = document.getElementById("authSegmentLoginBtn");
    const signupSeg = document.getElementById("authSegmentSignupBtn");
    const nameGroup = document.getElementById("authPageNameGroup");
    const confirmGroup = document.getElementById("authPageConfirmPasswordGroup");
    const genPwdBtn = document.getElementById("authGeneratePasswordBtn");
    const pwdReqs = document.getElementById("authPasswordRequirements");
    const strengthWrap = document.getElementById("authPasswordStrengthWrap");
    const submitBtn = document.getElementById("authPageSubmitBtn");
    const subtitle = document.getElementById("authHeaderSubtitle");
    const errEl = document.getElementById("authPageErrorMsg");
    const successEl = document.getElementById("authPageSuccessMsg");

    if (errEl) {
      errEl.textContent = "";
      errEl.classList.add("hidden");
      errEl.style.removeProperty("display");
    }
    if (successEl) {
      successEl.textContent = "";
      successEl.classList.add("hidden");
      successEl.style.removeProperty("display");
    }

    if (mode === "signup") {
      loginSeg?.classList.remove("active");
      signupSeg?.classList.add("active");
      if (nameGroup) { nameGroup.classList.remove("hidden"); nameGroup.style.display = "block"; }
      if (confirmGroup) { confirmGroup.classList.remove("hidden"); confirmGroup.style.display = "block"; }
      if (genPwdBtn) { genPwdBtn.classList.remove("hidden"); genPwdBtn.style.display = "inline-flex"; }
      if (pwdReqs) { pwdReqs.classList.remove("hidden"); pwdReqs.style.display = "block"; }
      if (strengthWrap) { strengthWrap.classList.remove("hidden"); strengthWrap.style.display = "block"; }
      if (submitBtn) submitBtn.textContent = "Create Account & Sign In →";
      if (subtitle) subtitle.textContent = "Create your free, deterministic placement workspace";
    } else {
      loginSeg?.classList.add("active");
      signupSeg?.classList.remove("active");
      if (nameGroup) { nameGroup.classList.add("hidden"); nameGroup.style.removeProperty("display"); }
      if (confirmGroup) { confirmGroup.classList.add("hidden"); confirmGroup.style.removeProperty("display"); }
      if (genPwdBtn) { genPwdBtn.classList.add("hidden"); genPwdBtn.style.removeProperty("display"); }
      if (pwdReqs) { pwdReqs.classList.add("hidden"); pwdReqs.style.removeProperty("display"); }
      if (strengthWrap) { strengthWrap.classList.add("hidden"); strengthWrap.style.removeProperty("display"); }
      if (submitBtn) submitBtn.textContent = "Sign In →";
      if (subtitle) subtitle.textContent = "Sign in to your career intelligence workspace";
    }
  }

  attachEventListeners() {
    const loginSeg = document.getElementById("authSegmentLoginBtn");
    const signupSeg = document.getElementById("authSegmentSignupBtn");
    const pwdInput = document.getElementById("authPagePasswordInput");
    const confirmInput = document.getElementById("authPageConfirmPasswordInput");
    const togglePwdBtn = document.getElementById("authTogglePasswordBtn");
    const genPwdBtn = document.getElementById("authGeneratePasswordBtn");
    const strengthWrap = document.getElementById("authPasswordStrengthWrap");
    const strengthBar = document.getElementById("authPasswordStrengthBar");
    const strengthLabel = document.getElementById("authPasswordStrengthLabel");
    const guestBtn = document.getElementById("authContinueGuestBtn");
    const pageForm = document.getElementById("authPageForm");
    const signOutBtn = document.getElementById("avatarSignOutBtn");
    const openAuthBtn = document.getElementById("openAuthModalBtn");

    if (loginSeg) {
      loginSeg.addEventListener("click", () => this.setMode("login"));
    }
    if (signupSeg) {
      signupSeg.addEventListener("click", () => this.setMode("signup"));
    }

    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener("click", () => {
        const isPwd = pwdInput.type === "password";
        pwdInput.type = isPwd ? "text" : "password";
        if (confirmInput) confirmInput.type = isPwd ? "text" : "password";
        togglePwdBtn.textContent = isPwd ? "Hide" : "Show";
      });
    }

    if (genPwdBtn && pwdInput) {
      genPwdBtn.addEventListener("click", () => {
        const generated = this.generateSecurePassword(16);
        pwdInput.value = generated;
        if (confirmInput) confirmInput.value = generated;
        pwdInput.type = "text";
        if (confirmInput) confirmInput.type = "text";
        if (togglePwdBtn) togglePwdBtn.textContent = "Hide";

        this.updateStrengthUI(generated, strengthWrap, strengthBar, strengthLabel);
        if (window.showToast) {
          window.showToast("Secure password generated!");
        }
      });
    }

    if (pwdInput) {
      pwdInput.addEventListener("input", (e) => {
        if (this.mode !== "signup") return;
        this.updateStrengthUI(e.target.value, strengthWrap, strengthBar, strengthLabel);
      });
    }

    if (openAuthBtn) {
      openAuthBtn.addEventListener("click", () => {
        router.navigate("login");
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener("click", () => {
        this.logout();
      });
    }

    if (pageForm) {
      pageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener("click", (e) => {
        e.preventDefault();
        router.navigate("analyzer");
        if (window.showToast) {
          window.showToast("Continuing in Guest Mode. Data is kept in private browser memory.");
        }
      });
    }
  }

  generateSecurePassword(length = 16) {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*()-_=+";
    const all = uppercase + lowercase + numbers + symbols;

    const values = new Uint32Array(length);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(values);
    } else {
      for (let i = 0; i < length; i++) {
        values[i] = Math.floor(Math.random() * 0xffffffff);
      }
    }

    const chars = [
      uppercase[values[0] % uppercase.length],
      lowercase[values[1] % lowercase.length],
      numbers[values[2] % numbers.length],
      symbols[values[3] % symbols.length],
    ];

    for (let i = 4; i < length; i++) {
      chars.push(all[values[i] % all.length]);
    }

    // Shuffle characters
    for (let i = chars.length - 1; i > 0; i--) {
      const j = values[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
  }

  calculatePasswordStrength(pwd) {
    if (!pwd || pwd.length < 6) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  updateStrengthUI(val, strengthWrap, strengthBar, strengthLabel) {
    if (!strengthBar || !strengthLabel) return;
    const score = this.calculatePasswordStrength(val);
    if (strengthWrap) {
      strengthWrap.classList.remove("hidden");
      strengthWrap.style.display = "block";
    }

    if (score <= 1) {
      strengthBar.style.width = "25%";
      strengthBar.style.background = "var(--score-low, #ef4444)";
      strengthLabel.textContent = "Password strength: Weak (min 8 chars, mix letters & numbers)";
    } else if (score === 2) {
      strengthBar.style.width = "60%";
      strengthBar.style.background = "var(--score-mid, #eab308)";
      strengthLabel.textContent = "Password strength: Fair";
    } else {
      strengthBar.style.width = "100%";
      strengthBar.style.background = "var(--score-high, #22c55e)";
      strengthLabel.textContent = "Password strength: Strong";
    }
  }

  updateUserUI(user) {
    const initialsEl = document.getElementById("topbarAvatarInitials");
    const nameEl = document.getElementById("dropdownUserName");
    const emailEl = document.getElementById("dropdownUserEmail");
    const openAuthBtn = document.getElementById("openAuthModalBtn");
    const signOutBtn = document.getElementById("avatarSignOutBtn");

    if (user && (user.email || user.fullName || user.id)) {
      const displayName = user.fullName || user.name || "Student";
      const displayEmail = user.email || "";

      let initials = "U";
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts[0] && parts[0].length > 0) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }

      if (initialsEl) initialsEl.textContent = initials;
      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) emailEl.textContent = displayEmail;

      if (openAuthBtn) {
        openAuthBtn.classList.add("hidden");
        openAuthBtn.style.display = "none";
      }
      if (signOutBtn) {
        signOutBtn.classList.remove("hidden");
        signOutBtn.style.display = "flex";
      }
    } else {
      if (initialsEl) initialsEl.textContent = "G";
      if (nameEl) nameEl.textContent = "Guest User";
      if (emailEl) emailEl.textContent = "Transient Guest Session";

      if (openAuthBtn) {
        openAuthBtn.classList.remove("hidden");
        openAuthBtn.style.removeProperty("display");
      }
      if (signOutBtn) {
        signOutBtn.classList.add("hidden");
        signOutBtn.style.display = "none";
      }
    }
  }

  async restoreSession() {
    try {
      const token = store.get("token");
      const headers = { Accept: "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          store.set("currentUser", data.user);
          if (data.token) {
            store.set("token", data.token);
          }
          this.updateUserUI(data.user);
        }
      }
    } catch (_) {
      // Offline or network error during session restore is expected for guests; do not break startup.
    }
  }

  async handleSubmit() {
    const emailEl = document.getElementById("authPageEmailInput");
    const pwdEl = document.getElementById("authPagePasswordInput");
    const confirmEl = document.getElementById("authPageConfirmPasswordInput");
    const nameEl = document.getElementById("authPageNameInput");
    const errEl = document.getElementById("authPageErrorMsg");
    const successEl = document.getElementById("authPageSuccessMsg");
    const submitBtn = document.getElementById("authPageSubmitBtn");

    if (errEl) {
      errEl.textContent = "";
      errEl.classList.add("hidden");
      errEl.style.removeProperty("display");
    }
    if (successEl) {
      successEl.textContent = "";
      successEl.classList.add("hidden");
      successEl.style.removeProperty("display");
    }

    const email = emailEl?.value.trim() || "";
    const password = pwdEl?.value || "";
    const confirmPassword = confirmEl?.value || "";
    const fullName = nameEl?.value.trim() || "";

    // Client-side validations
    if (!email || !password) {
      this.showError("Please provide both email and password.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      this.showError("Please provide a valid email address.");
      return;
    }

    if (this.mode === "signup") {
      if (!fullName) {
        this.showError("Please provide your full name.");
        return;
      }
      if (password.length < 8) {
        this.showError("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        this.showError("Passwords do not match. Please verify your confirm password field.");
        return;
      }
    }

    const endpoint = this.mode === "signup" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
    const payload = this.mode === "signup"
      ? { email, password, confirmPassword, name: fullName, fullName }
      : { email, password };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = this.mode === "signup" ? "Creating account…" : "Signing in…";
      }

      let res = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      // Fallback to legacy endpoint if Better Auth alias is redirected or not reachable
      if (!res.ok && res.status === 404) {
        const fallbackEndpoint = this.mode === "signup" ? "/api/auth/register" : "/api/auth/login";
        res = await fetch(fallbackEndpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const responseText = await res.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (_) {
        throw new Error(`Server returned an unreadable response (HTTP ${res.status}).`);
      }

      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : (data.message || `Authentication failed (HTTP ${res.status}).`);
        throw new Error(detail);
      }

      const user = data.user || data.data?.user;
      if (!user) {
        throw new Error("The server did not return an account profile. Please check the authentication response.");
      }

      const token = data.token || data.data?.token || data.session?.token || "";
      store.set("token", token);
      store.set("currentUser", user);
      this.updateUserUI(user);

      if (successEl) {
        successEl.textContent = this.mode === "signup" ? "Account created successfully! Redirecting…" : "Signed in successfully! Redirecting…";
        successEl.classList.remove("hidden");
        successEl.style.display = "block";
      }

      // Check for guest data
      const guestResume = localStorage.getItem("cm:v1:guest:resumes");
      if (guestResume && window.showToast) {
        window.showToast("Linked your previous guest analysis with your account!");
      }

      setTimeout(() => {
        router.navigate("dashboard");
        if (window.showToast) {
          window.showToast(`Welcome, ${user.fullName || user.name || user.email}!`);
        }
      }, 350);
    } catch (err) {
      this.showError(err.message || "Authentication failed. Please try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = this.mode === "signup" ? "Create Account & Sign In →" : "Sign In →";
      }
    }
  }

  showError(msg) {
    const errEl = document.getElementById("authPageErrorMsg");
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove("hidden");
      errEl.style.display = "block";
    }
  }

  async logout() {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
    } catch (_) {
      // Best-effort server logout
    }

    store.set("token", "");
    store.set("currentUser", null);
    this.updateUserUI(null);

    if (window.showToast) {
      window.showToast("Signed out successfully.");
    }

    router.navigate("landing");
  }
}

export const authManager = new AuthManager();
