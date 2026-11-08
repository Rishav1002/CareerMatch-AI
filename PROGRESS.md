# Production Outage Recovery & Hardening Progress

- [x] **Step 1: Hotfix (Restore the site)**
  - [x] Reproduce RC1 with `node --check` and browser/DOM check
  - [x] Fix `frontend/js/api.js`: remove leftover duplicate half-function (lines 30-70), keep class-based `renderInlineError`, import `escapeHtml` from `formatters.js`
  - [x] Verify `frontend/js/api.js` syntax with `node --check`
  - [x] Create `scripts/boot_smoke.mjs` and install `jsdom` as devDependency
  - [x] Verify `scripts/boot_smoke.mjs` fails on broken commit `827b32d` and passes on fix
  - [x] Real browser verification: theme toggle, navigation, zero errors
  - [x] Commit hotfix: `hotfix(api): restore ES module loading and error rendering`

- [ ] **Step 2: API Contract (RC2)**
  - [ ] Diff backend contract changes between `061fe98^` and `HEAD`
  - [ ] Author `docs/API_CONTRACT.md` detailing request/response shapes
  - [ ] Restore original response keys in `/api/analyze` and history with deprecated aliases
  - [ ] Enforce contract with Pydantic response models / TypedDicts
  - [ ] Add `tests/test_contract.py` validating UI property reads against backend responses
  - [ ] Add dev-only runtime guard in `frontend/js/api.js` (`assertShape`)
  - [ ] Real browser / journey test for full flow
  - [ ] Verify user isolation still holds
  - [ ] Commit contract fix: `fix(contract): restore canonical response shapes and add contract test suite`

- [ ] **Step 3: CSP and Inline Scripts/Handlers (RC3)**
  - [ ] Extract inline `<script>` blocks into `frontend/js/theme-init.js`, `frontend/js/boot-watchdog.js`, `frontend/js/sw-register.js`
  - [ ] Remove inline event handlers (`onclick`, `onsubmit="return false;"`) and wire in modules
  - [ ] Secure auth forms with `method="post"`, `action="#"`, and preventDefault in `authManager.js`
  - [ ] Self-host required fonts if feasible or tighten CSP directives in `backend/main.py`
  - [ ] Update service worker with build cache naming, skipWaiting, network-first, and self-healing watchdog
  - [ ] Update uvicorn start command: `--no-server-header`, `--proxy-headers`, `--forwarded-allow-ips="*"`
  - [ ] Verify zero CSP violations in browser
  - [ ] Commit CSP fix: `fix(csp): eliminate inline scripts and event handlers, tighten policy`

- [ ] **Step 4: Gemini API Integration**
  - [ ] Verify no secrets committed in git history
  - [ ] Ensure `ai_service.is_configured()` handles whitespace/quotes and placeholders
  - [ ] Add safe status endpoint `GET /api/ai/status` returning `{"enabled": bool}`
  - [ ] Update diagnostics in `X-Health-Key`
  - [ ] Robust error handling for quota, invalid key, timeout with friendly fallback
  - [ ] Check model compatibility (gemini-2.5-flash / official releases) and pinned SDK
  - [ ] Commit Gemini improvements: `fix(ai): add safe status probe, sanitize env key, and polish fallbacks`

- [ ] **Step 5: Hidden Breakage Sweep**
  - [ ] Scan DOM IDs and querySelectors (`scan_module_ids.py`, `scan_component_ids.py`)
  - [ ] Check i18n string parity (en/hi)
  - [ ] Multi-route and multi-viewport checks
  - [ ] Log findings in `BUGS_FOUND.md`
  - [ ] Commit bug fixes: `fix(ui): resolve broken DOM references and route edge cases`

- [ ] **Step 6: Guardrails & CI**
  - [ ] Update `.github/workflows/test.yml` with boot smoke, contract test, syntax check, Playwright journey
  - [ ] Add pre-push verification script / instructions in `CONTRIBUTING.md`
  - [ ] Add post-deploy smoke script `scripts/post_deploy_smoke.py`
  - [ ] Clean up one-off scripts into `scripts/dev-tools/` and update `REMOVAL_LEDGER.md`
  - [ ] Commit guardrails: `ci: add boot smoke, contract assertions, and post-deploy checks`

- [ ] **Step 7: README and Docs**
  - [ ] Consolidate Render deployment sections in `README.md`
  - [ ] Add Gemini setup, troubleshooting runbook, architecture reference
  - [ ] Update `CHANGELOG.md`, `BUGS_FOUND.md`, `REMOVAL_LEDGER.md`, `.env.example`
  - [ ] Commit docs: `docs: consolidate deployment guide, runbook, contract reference, and changelog`

- [ ] **Definition of Done Verification & Final Report**
  - [ ] Full test suite and boot smoke pass locally
  - [ ] Verification evidence compiled
  - [ ] Final comprehensive report written
