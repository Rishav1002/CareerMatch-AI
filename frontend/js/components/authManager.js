/**
 * CareerMatch AI: Authentication Manager (Section 13 C)
 * Centered glass card on calm background, segmented control [Log in | Sign up],
 * password strength meter + reveal toggle, scoped guest mode transition.
 */

import { store } from "../store.js";
import { router } from "../router.js";

export class AuthManager {
  constructor() {
    this.mode = "login"; // "login" | "signup"
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    const loginSeg = document.getElementById("authSegmentLoginBtn");
    const signupSeg = document.getElementById("authSegmentSignupBtn");
    const nameGroup = document.getElementById("authPageNameGroup");
    const submitBtn = document.getElementById("authPageSubmitBtn");
    const subtitle = document.getElementById("authHeaderSubtitle");
    const pwdInput = document.getElementById("authPagePasswordInput");
    const togglePwdBtn = document.getElementById("authTogglePasswordBtn");
    const strengthWrap = document.getElementById("authPasswordStrengthWrap");
    const strengthBar = document.getElementById("authPasswordStrengthBar");
    const strengthLabel = document.getElementById("authPasswordStrengthLabel");
    const guestBtn = document.getElementById("authContinueGuestBtn");

    if (loginSeg && signupSeg) {
      loginSeg.addEventListener("click", () => {
        this.mode = "login";
        loginSeg.classList.add("active");
        signupSeg.classList.remove("active");
        if (nameGroup) { nameGroup.classList.add("hidden"); nameGroup.style.removeProperty("display"); }
        if (submitBtn) submitBtn.textContent = "Sign In →";
        if (subtitle) subtitle.textContent = "Sign in to your career intelligence workspace";
        if (strengthWrap) { strengthWrap.classList.add("hidden"); strengthWrap.style.removeProperty("display"); }
      });

      signupSeg.addEventListener("click", () => {
        this.mode = "signup";
        signupSeg.classList.add("active");
        loginSeg.classList.remove("active");
        if (nameGroup) { nameGroup.classList.remove("hidden"); nameGroup.style.display = "block"; }
        if (submitBtn) submitBtn.textContent = "Create Account & Sign In →";
        if (subtitle) subtitle.textContent = "Create your free, deterministic placement workspace";
        if (strengthWrap) { strengthWrap.classList.remove("hidden"); strengthWrap.style.display = "block"; }
      });
    }

    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener("click", () => {
        const isPwd = pwdInput.type === "password";
        pwdInput.type = isPwd ? "text" : "password";
        togglePwdBtn.textContent = isPwd ? "Hide" : "Show";
      });
    }

    if (pwdInput && strengthBar && strengthLabel) {
      pwdInput.addEventListener("input", (e) => {
        if (this.mode !== "signup") return;
        const val = e.target.value;
        const score = this.calculatePasswordStrength(val);
        strengthWrap.classList.remove("hidden");
        strengthWrap.style.display = "block";

        if (score <= 1) {
          strengthBar.style.width = "30%";
          strengthBar.style.background = "var(--score-low)";
          strengthLabel.textContent = "Password strength: Weak";
        } else if (score === 2) {
          strengthBar.style.width = "65%";
          strengthBar.style.background = "var(--score-mid)";
          strengthLabel.textContent = "Password strength: Fair";
        } else {
          strengthBar.style.width = "100%";
          strengthBar.style.background = "var(--score-high)";
          strengthLabel.textContent = "Password strength: Strong";
        }
      });
    }

    // The account-menu "Sign in" control previously had no click handler.
    // Route it to the functional full-page authentication form.
    document.getElementById("openAuthModalBtn")?.addEventListener("click", () => {
      router.navigate("login");
    });

    const pageForm = document.getElementById("authPageForm");
    if (pageForm) {
      pageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    const modalForm = document.getElementById("authModalForm");
    if (modalForm) {
      modalForm.addEventListener("submit", (e) => {
        e.preventDefault();
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

  calculatePasswordStrength(pwd) {
    if (!pwd || pwd.length < 6) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  async handleSubmit() {
    const emailEl = document.getElementById("authPageEmailInput");
    const pwdEl = document.getElementById("authPagePasswordInput");
    const nameEl = document.getElementById("authPageNameInput");
    const errEl = document.getElementById("authPageErrorMsg");
    const submitBtn = document.getElementById("authPageSubmitBtn");

    if (errEl) {
      errEl.textContent = "";
      errEl.classList.add("hidden");
      errEl.style.removeProperty("display");
    }

    const email = emailEl?.value.trim() || "";
    const password = pwdEl?.value || "";
    const fullName = nameEl?.value.trim() || "";

    if (!email || !password || (this.mode === "signup" && !fullName)) {
      if (errEl) {
        errEl.textContent = this.mode === "signup"
          ? "Please provide your name, email, and password."
          : "Please provide both email and password.";
        errEl.classList.remove("hidden");
        errEl.style.display = "block";
      }
      return;
    }

    const endpoint = this.mode === "signup" ? "/api/auth/register" : "/api/auth/login";
    const payload = this.mode === "signup" ? { email, password, fullName: fullName || "Student" } : { email, password };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = this.mode === "signup" ? "Creating account…" : "Signing in…";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseText = await res.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; }
      catch (_) { throw new Error(`Server returned an unreadable response (HTTP ${res.status}).`); }
      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : `Request failed (HTTP ${res.status}).`;
        throw new Error(detail);
      }

      if (!data.user) {
        throw new Error("The server did not return an account profile. Please check the authentication API response.");
      }

      // Store uses "currentUser" as its canonical account-state key.
      store.set("token", data.token || "");
      store.set("currentUser", data.user);

      // Offer guest data merge if guest session exists
      const guestResume = localStorage.getItem("cm:v1:guest:resumes");
      if (guestResume) {
        if (window.showToast) {
          window.showToast("Linked your previous guest analysis with your account!");
        }
      }

      router.navigate("dashboard");
      if (window.showToast) {
        window.showToast(`Signed in as ${data.user.fullName || data.user.email}`);
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || "Authentication failed. Please try again.";
        errEl.classList.remove("hidden");
        errEl.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = this.mode === "signup"
          ? "Create Account & Sign In →"
          : "Sign In →";
      }
    }
  }
}

export const authManager = new AuthManager();
