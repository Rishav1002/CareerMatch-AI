# Decisions Record

This file documents operational and architectural decisions made during the P0 recovery and hardening.

## 1. Minimal Safe Hotfix (RC1 & RC1b)
- **Decision:** Keep the class-based version of `renderInlineError(containerEl, message, retryFn)` in `frontend/js/api.js`, delete lines 30-70 which were an unclosed duplicate, and import `escapeHtml` from `./formatters.js`.
- **Alternatives considered:** Restoring the entire previous version of `api.js` from `061fe98`.
- **Reason:** `061fe98` still had the old banner logic and inline styles; keeping the cleaned class-based error card adheres to the design system while cleanly resolving the syntax error and missing import without circular dependencies (`formatters.js` does not import `api.js`).

