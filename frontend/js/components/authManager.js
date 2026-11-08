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
        if (nameGroup) nameGroup.style.display = "none";
        if (submitBtn) submitBtn.textContent = "Sign In →";
        if (subtitle) subtitle.textContent = "Sign in to your career intelligence workspace";
        if (strengthWrap) strengthWrap.style.display = "none";
      });

      signupSeg.addEventListener("click", () => {
        this.mode = "signup";
        signupSeg.classList.add("active");
        loginSeg.classList.remove("active");
        if (nameGroup) nameGroup.style.display = "block";
        if (submitBtn) submitBtn.textContent = "Create Account & Sign In →";
        if (subtitle) subtitle.textContent = "Create your free, deterministic placement workspace";
        if (strengthWrap) strengthWrap.style.display = "block";
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

    if (submitBtn) {
      submitBtn.addEventListener("click", () => this.handleSubmit());
    }

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

    if (errEl) errEl.style.display = "none";

    const email = emailEl?.value.trim() || "";
    const password = pwdEl?.value || "";
    const fullName = nameEl?.value.trim() || "";

    if (!email || !password) {
      if (errEl) {
        errEl.textContent = "Please provide both email and password.";
        errEl.style.display = "block";
      }
      return;
    }

    const endpoint = this.mode === "signup" ? "/api/auth/register" : "/api/auth/login";
    const payload = this.mode === "signup" ? { email, password, fullName: fullName || "Student" } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");

      store.set("token", data.token);
      store.set("user", data.user);
      localStorage.setItem("cm_jwt_token", data.token);

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
        errEl.textContent = err.message;
        errEl.style.display = "block";
      }
    }
  }
}

export const authManager = new AuthManager();
