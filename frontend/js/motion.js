/**
 * CareerMatch AI: Shared Motion & Animation Utility (Section 13 E)
 * Spring easing, drawPath, and countTo with reduced-motion support.
 */

export const isReducedMotion = () => {
  if (typeof window === "undefined") return false;
  const osPrefers = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appPref = localStorage.getItem("cm_reduced_motion") === "true";
  return osPrefers || appPref;
};

/**
 * Animate a numeric count up or down.
 * @param {HTMLElement} el Target DOM element
 * @param {number} to Target number
 * @param {object} [options]
 * @param {number} [options.from] Starting number
 * @param {number} [options.duration] Duration in ms
 * @param {string} [options.suffix] Suffix string (e.g. "%", "/100")
 * @param {string} [options.prefix] Prefix string (e.g. "₹")
 * @param {Function} [options.formatter] Custom formatting function
 */
export function countTo(el, to, options = {}) {
  if (!el) return;
  const target = Number(to);
  if (isNaN(target)) {
    el.textContent = "--";
    return;
  }

  const {
    from = 0,
    duration = 900,
    suffix = "",
    prefix = "",
    formatter = null,
  } = options;

  if (isReducedMotion() || duration <= 0) {
    el.textContent = formatter ? formatter(target) : `${prefix}${Math.round(target)}${suffix}`;
    return;
  }

  const startTime = performance.now();
  const startVal = Number(from) || 0;
  const diff = target - startVal;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startVal + diff * eased;

    if (formatter) {
      el.textContent = formatter(current);
    } else {
      el.textContent = `${prefix}${Math.round(current)}${suffix}`;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Ensure exact final value
      el.textContent = formatter ? formatter(target) : `${prefix}${Math.round(target)}${suffix}`;
    }
  }

  requestAnimationFrame(step);
}

/**
 * Animate drawing an SVG path (stroke-dashoffset).
 * @param {SVGPathElement} pathEl
 * @param {number} [duration]
 */
export function drawPath(pathEl, duration = 1000) {
  if (!pathEl || typeof pathEl.getTotalLength !== "function") return;
  const length = pathEl.getTotalLength();

  pathEl.style.strokeDasharray = `${length} ${length}`;

  if (isReducedMotion()) {
    pathEl.style.strokeDashoffset = "0";
    return;
  }

  pathEl.style.strokeDashoffset = `${length}`;
  pathEl.getBoundingClientRect(); // trigger reflow
  pathEl.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
  pathEl.style.strokeDashoffset = "0";
}

/**
 * Setup IntersectionObserver trigger for count-ups and path drawings.
 * @param {string} selector
 * @param {Function} callback
 */
export function observeEntrance(selector, callback) {
  if (typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(selector).forEach((el) => observer.observe(el));
}

/**
 * Add mousemove specular highlight tracking to an element (--mx, --my).
 * @param {HTMLElement} el
 */
export function attachSpecularHighlight(el) {
  if (!el) return;
  el.addEventListener("mousemove", (e) => {
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x.toFixed(1)}%`);
    el.style.setProperty("--my", `${y.toFixed(1)}%`);
  });
  el.addEventListener("mouseleave", () => {
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "20%");
  });
}
