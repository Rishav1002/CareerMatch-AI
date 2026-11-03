/**
 * CareerMatch AI: Soft Scroll Reveal Animations
 * Provides smooth, subtle scroll-driven entrance transitions
 * Respects prefers-reduced-motion.
 */

export class ScrollReveal {
  constructor() {
    this.observer = null;
  }

  init() {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("revealed");
      });
      return;
    }

    const options = {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.08,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.getAttribute("data-reveal-delay");
          if (delay) {
            setTimeout(() => {
              el.classList.add("revealed");
            }, parseInt(delay, 10));
          } else {
            el.classList.add("revealed");
          }
          this.observer?.unobserve(el);
        }
      });
    }, options);

    this.observeAll();
  }

  observeAll() {
    if (!this.observer) return;
    const elements = document.querySelectorAll(".scroll-reveal:not(.revealed)");
    elements.forEach((el) => this.observer.observe(el));
  }

  refresh() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".scroll-reveal").forEach((el) => el.classList.add("revealed"));
      return;
    }
    this.observeAll();
  }
}

export const scrollReveal = new ScrollReveal();
