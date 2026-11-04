/**
 * CareerMatch AI: Central Honest Formatters (Section 13 I)
 * Returns proper empty states for null/NaN/undefined/missing values.
 * Never outputs "$0", "0 points credited", "N/A", or "undefined".
 */

export const fmt = {
  /**
   * Format score percentage or index (0-100).
   * Returns empty state string or formatted number.
   */
  score(val, fallback = "--") {
    if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
      return fallback;
    }
    const num = Number(val);
    if (num < 0) return fallback;
    return `${Math.round(num)}%`;
  },

  /**
   * Format raw score without percent symbol.
   */
  scoreRaw(val, fallback = "--") {
    if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
      return fallback;
    }
    return String(Math.round(Number(val)));
  },

  /**
   * Format localized number with comma grouping.
   */
  number(val, fallback = "0") {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return fallback;
    }
    return new Intl.NumberFormat("en-IN").format(Number(val));
  },

  /**
   * Format salary range cleanly. Rejects "$0", empty, or invalid ranges.
   */
  salary(val, fallback = "Market Competitive") {
    if (!val || typeof val !== "string") return fallback;
    const clean = val.trim();
    if (clean === "$0" || clean === "0" || clean === "$0 - $0" || clean.toLowerCase() === "n/a") {
      return fallback;
    }
    return clean;
  },

  /**
   * Format date cleanly.
   */
  date(val, fallback = "Recently") {
    if (!val) return fallback;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return fallback;
    }
  },

  /**
   * Format skill label cleanly.
   */
  skill(val) {
    if (!val) return "";
    return String(val).trim();
  },

  /**
   * Safely escape HTML to prevent XSS.
   */
  escape(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
};
