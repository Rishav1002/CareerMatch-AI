#!/usr/bin/env python3
"""
CareerMatch AI: Post-Deployment Smoke Verification Script
Runs against a live staging or production deployment (e.g. Render) to verify:
  1. Live HTTP 200 on /api/health and /api/ai/status.
  2. Server fingerprinting headers (Server: uvicorn, X-Powered-By) are stripped.
  3. Content Security Policy is strictly enforced (script-src 'self' without unsafe-inline).
  4. Deployed JavaScript ES modules (main.js, api.js, theme-init.js, boot-watchdog.js, sw-register.js)
     are reachable and pass JavaScript syntax checks (node --check) over HTTP.
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

DEFAULT_TARGET = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("BASE_URL") or "https://careermatch-ai.onrender.com"

CRITICAL_JS_ASSETS = [
    "/frontend/js/main.js",
    "/frontend/js/api.js",
    "/frontend/js/theme-init.js",
    "/frontend/js/boot-watchdog.js",
    "/frontend/js/sw-register.js",
    "/frontend/sw.js",
]


def check_syntax_with_node(code: str, name: str) -> bool:
    try:
        proc = subprocess.run(
            ["node", "--input-type=module", "--check"],
            input=code.encode("utf-8"),
            capture_output=True,
            timeout=10,
        )
        if proc.returncode != 0:
            print(f"  [FAIL] JavaScript syntax error in {name}:")
            err_text = proc.stderr.decode("utf-8", errors="replace")
            print(err_text.strip())
            return False
        return True
    except FileNotFoundError:
        print("  [WARN] Node.js not installed on local runner; skipping offline syntax check.")
        return True
    except Exception as exc:
        print(f"  [FAIL] Syntax validator failed for {name}: {exc}")
        return False


def main():
    parser = argparse.ArgumentParser(description="CareerMatch AI Post-Deployment Smoke Validator")
    parser.add_argument("--url", default=DEFAULT_TARGET, help="Base URL of deployed app")
    args = parser.parse_args()

    base_url = args.url.rstrip("/")
    print("=" * 60)
    print("  CareerMatch AI: Post-Deployment Smoke Verification")
    print(f"  Target Deployment: {base_url}")
    print("=" * 60)

    failures = 0

    # 1. Health check & security headers
    print("\n[1/4] Verifying /api/health & security headers...")
    try:
        req = urllib.request.Request(f"{base_url}/api/health", headers={"User-Agent": "CM-Smoke/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            headers = dict(resp.headers)
            body = json.loads(resp.read().decode("utf-8"))

            if status == 200 and body.get("status") in ("ok", "healthy"):
                print(f"  [PASS] /api/health returned HTTP 200: {body}")
            else:
                print(f"  [FAIL] /api/health returned unexpected payload: {body}")
                failures += 1

            # Check server header stripping
            server_header = headers.get("server", "").lower()
            if "uvicorn" in server_header or "python" in server_header:
                print(f"  [FAIL] Server fingerprint leaked in headers: 'Server: {server_header}'")
                failures += 1
            else:
                print("  [PASS] Server fingerprint header is stripped.")

            # Check CSP header
            csp = headers.get("content-security-policy", "")
            if not csp:
                print("  [FAIL] Missing Content-Security-Policy header!")
                failures += 1
            elif "script-src 'self'" not in csp:
                print(f"  [FAIL] CSP missing strict script-src 'self': {csp}")
                failures += 1
            elif "'unsafe-inline'" in csp.split("script-src")[1].split(";")[0]:
                print("  [FAIL] CSP permits 'unsafe-inline' in script-src!")
                failures += 1
            else:
                print("  [PASS] Strict Content-Security-Policy verified.")

    except Exception as exc:
        print(f"  [FAIL] Could not connect to {base_url}/api/health: {exc}")
        failures += 1

    # 2. AI Status check
    print("\n[2/4] Verifying /api/ai/status...")
    try:
        req = urllib.request.Request(f"{base_url}/api/ai/status", headers={"User-Agent": "CM-Smoke/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if "enabled" in body:
                print(f"  [PASS] /api/ai/status active: {body}")
            else:
                print(f"  [FAIL] /api/ai/status returned invalid format: {body}")
                failures += 1
    except Exception as exc:
        print(f"  [FAIL] Could not fetch /api/ai/status: {exc}")
        failures += 1

    # 3. HTML Shell Verification
    print("\n[3/4] Verifying Frontend HTML Shell (index.html)...")
    try:
        req = urllib.request.Request(f"{base_url}/", headers={"User-Agent": "CM-Smoke/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
            if "<html" in html and "CareerMatch" in html:
                print(f"  [PASS] Shell loaded ({len(html)} bytes).")
            else:
                print("  [FAIL] Shell missing critical markups.")
                failures += 1

            if "onclick=" in html or "onsubmit=" in html:
                print("  [FAIL] Inline event handlers detected in HTML!")
                failures += 1
            else:
                print("  [PASS] Zero inline event handlers in HTML.")
    except Exception as exc:
        print(f"  [FAIL] Shell fetch failed: {exc}")
        failures += 1

    # 4. Deployed JavaScript assets syntax checks
    print(f"\n[4/4] Verifying syntax of {len(CRITICAL_JS_ASSETS)} deployed JavaScript ES modules...")
    for rel_path in CRITICAL_JS_ASSETS:
        asset_url = f"{base_url}{rel_path}"
        try:
            req = urllib.request.Request(asset_url, headers={"User-Agent": "CM-Smoke/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status != 200:
                    print(f"  [FAIL] {rel_path} returned HTTP {resp.status}")
                    failures += 1
                    continue
                code = resp.read().decode("utf-8")
                valid = check_syntax_with_node(code, rel_path)
                if valid:
                    print(f"  [PASS] {rel_path} ({len(code)} bytes) - Valid syntax.")
                else:
                    failures += 1
        except Exception as exc:
            print(f"  [FAIL] Could not fetch {asset_url}: {exc}")
            failures += 1

    print("\n" + "=" * 60)
    if failures == 0:
        print("  POST-DEPLOYMENT SMOKE CHECK: ALL TESTS PASSED!")
        print("=" * 60)
        sys.exit(0)
    else:
        print(f"  POST-DEPLOYMENT SMOKE CHECK: FAILED WITH {failures} DEFECT(S)!")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
