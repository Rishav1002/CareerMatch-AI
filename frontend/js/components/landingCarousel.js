/**
 * CareerMatch AI: Landing Page 4-Scene Background Carousel (Section 13 B)
 * Parallax SVG/CSS animated background, auto-advances every 6s,
 * pauses on hover or tab hidden, supports swipe and reduced-motion.
 */

import { isReducedMotion } from "../motion.js";

export class LandingCarousel {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentScene = 0;
    this.totalScenes = 4;
    this.timer = null;
    this.isPaused = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  init() {
    if (!this.container) return;
    this.track = this.container.querySelector(".carousel-track");
    this.segments = this.container.querySelectorAll(".progress-segment");
    this.captions = this.container.querySelectorAll(".scene-caption");

    if (isReducedMotion()) {
      this.goToScene(0);
      return;
    }

    // Hover pause
    this.container.addEventListener("mouseenter", () => (this.isPaused = true));
    this.container.addEventListener("mouseleave", () => (this.isPaused = false));

    // Visibility pause
    document.addEventListener("visibilitychange", () => {
      this.isPaused = document.hidden;
    });

    // Touch swipe support
    this.container.addEventListener("touchstart", (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener("touchend", (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Progress segment click
    this.segments.forEach((seg, idx) => {
      seg.addEventListener("click", () => {
        this.goToScene(idx);
        this.resetTimer();
      });
    });

    this.startAutoAdvance();
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        this.nextScene();
      } else {
        this.prevScene();
      }
      this.resetTimer();
    }
  }

  startAutoAdvance() {
    this.stopAutoAdvance();
    this.timer = setInterval(() => {
      if (!this.isPaused && !isReducedMotion()) {
        this.nextScene();
      }
    }, 6000);
  }

  stopAutoAdvance() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetTimer() {
    this.startAutoAdvance();
  }

  nextScene() {
    this.goToScene((this.currentScene + 1) % this.totalScenes);
  }

  prevScene() {
    this.goToScene((this.currentScene - 1 + this.totalScenes) % this.totalScenes);
  }

  goToScene(index) {
    this.currentScene = index;
    if (this.track) {
      this.track.style.transform = `translateX(-${index * 25}%)`;
    }

    this.segments.forEach((seg, i) => {
      if (i === index) {
        seg.classList.add("active");
        seg.setAttribute("aria-current", "true");
      } else {
        seg.classList.remove("active");
        seg.removeAttribute("aria-current");
      }
    });

    this.captions.forEach((cap, i) => {
      cap.style.opacity = i === index ? "1" : "0";
      cap.style.pointerEvents = i === index ? "auto" : "none";
    });
  }

  destroy() {
    this.stopAutoAdvance();
  }
}
