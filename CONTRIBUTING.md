# Contributing to CareerMatch AI

Thank you for contributing to CareerMatch AI! Because this application powers mission-critical placement readiness and career benchmarking for engineering students, we maintain strict code quality, security, and verification gates.

---

## 1. Golden Rules for Code Changes

1. **Strict Content Security Policy (CSP)**:
   - Never write inline `<script>` tags in HTML.
   - Never use inline event handlers (`onclick=`, `onsubmit=`, `onchange=`, etc.). Always attach handlers in JavaScript via `addEventListener()`.
   - Never introduce `'unsafe-inline'` or `'unsafe-eval'` into `backend/main.py` CSP headers.
2. **Design System & Zero Inline Styles**:
   - Never write inline `style="..."` attributes in HTML or JS template strings.
   - Use CSS custom property tokens defined in `frontend/css/tokens.css` and utility classes in `frontend/css/components.css`.
3. **API Contract Integrity**:
   - Any change to response shapes must be documented in `docs/API_CONTRACT.md` and validated in `tests/test_contract.py`.
   - Always preserve canonical keys (`activeJob`, `matchResult`, `stages`, `roadmapNodes`, `completedNodes`, `atsReport`) for frontend consumers.
4. **Data Privacy & Ephemeral Mode**:
   - Respect candidate privacy: the `dontSave` toggle must bypass relational persistence.
   - Never commit API keys, database credentials, or secret tokens.

---

## 2. Before You Push — Mandatory Pre-Push Runbook

Every change must pass this local verification suite before creating a pull request or pushing to `main`:

```bash
# 1. Verify JavaScript syntax & headless DOM boot
node scripts/boot_smoke.mjs

# 2. Run backend test suite (contract tests & database isolation)
pytest tests/test_contract.py tests/test_isolation.py

# 3. Audit DOM ID references and course links
python scripts/verify_dom_ids.py
python scripts/check_links.py

# 4. Verify Content Security Policy in real Google Chrome (0 violations)
node scripts/verify_csp.mjs

# 5. Run end-to-end browser journey test (upload -> parse -> match -> roadmap -> ATS)
node scripts/journey_test.mjs

# 6. Verify responsive viewports (360px mobile, 768px tablet, 1440px desktop)
node scripts/verify_viewports.mjs
```

---

## 3. Commit Message Standards

Use semantic, atomic commit prefixes:
- `hotfix(api): ...` — Emergency fixes to API client, boot graph, or module loading.
- `fix(contract): ...` — Fixes to API response shapes, schemas, and endpoint serializers.
- `fix(csp): ...` — Security policy updates, inline code extraction, or handler binding.
- `fix(ai): ...` — Gemini API integration, prompt templates, or deterministic fallbacks.
- `fix(ui): ...` — DOM element binding, styling polish, or route transitions.
- `ci: ...` — GitHub Actions workflows and automated test scripts.
- `docs: ...` — Documentation, contract references, runbooks, and changelogs.

---

## 4. Post-Deployment Verification

After deploying to Render (or staging):

```bash
python scripts/post_deploy_smoke.py --url https://your-deployment-url.onrender.com
```

This automated validator checks live HTTP 200 health, strips of server fingerprints (`uvicorn`), strict CSP headers, and downloads and validates the syntax of all deployed JavaScript ES modules.
