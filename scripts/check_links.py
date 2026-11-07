"""
Check every Free and Paid course URL in backend/resources.json
AND audit every in-app href="#..." in frontend/index.html against registered routes
and valid DOM IDs to prevent 404 dead ends (Bug 2).
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_PATH = os.path.join(ROOT_DIR, "backend", "resources.json")
INDEX_PATH = os.path.join(ROOT_DIR, "frontend", "index.html")

KNOWN_ROUTES = {
    "landing", "dashboard", "analyzer", "ats", "readiness", "roadmap",
    "planner", "interview", "skills", "github", "market", "tracker",
    "compare", "report", "profile", "login", "settings", "privacy",
    "terms", "cookies", "404"
}

KNOWN_ALIASES = {
    "", "/", "signup", "auth", "jobs", "assessment", "career",
    "pri", "match", "resume", "practice", "proof", "overview", "account"
}


class _IndexLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.dom_ids: set[str] = set()
        self.anchor_links: list[dict[str, str]] = []
        self._current_link: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_dict = {k: v or "" for k, v in attrs}
        if "id" in attr_dict and attr_dict["id"]:
            self.dom_ids.add(attr_dict["id"])
        if tag.lower() == "a" and "href" in attr_dict:
            self._current_link = {"href": attr_dict["href"], "text": ""}
            self.anchor_links.append(self._current_link)

    def handle_data(self, data: str) -> None:
        if self._current_link is not None:
            self._current_link["text"] += data

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a":
            self._current_link = None


def check_html_links(html_path: str) -> int:
    if not os.path.exists(html_path):
        print(f"[ERROR] HTML file not found: {html_path}")
        return 1

    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    parser = _IndexLinkParser()
    parser.feed(content)

    all_dom_ids = parser.dom_ids
    errors = 0
    total_checked = 0

    for a in parser.anchor_links:
        href = a["href"].strip()
        if not href.startswith("#"):
            continue

        total_checked += 1
        if href.startswith("#/"):
            # Route link: #/analyzer, #/dashboard, etc.
            route_part = href[2:].split("?")[0].split("/")[0].lower()
            if route_part not in KNOWN_ROUTES and route_part not in KNOWN_ALIASES:
                print(f"[FAIL] Dead route link in index.html: href='{href}' (text: '{a['text'].strip()}')")
                errors += 1
        else:
            # In-page anchor: #landingHowItWorks, #mainContent
            target_id = href[1:].split("?")[0]
            if target_id not in all_dom_ids:
                print(f"[FAIL] Missing in-page anchor ID: href='{href}' (no element with id='{target_id}')")
                errors += 1

    if errors == 0:
        print(f"[PASS] All {total_checked} in-app hash links in index.html verified against route registry and DOM IDs.")
    else:
        print(f"[FAIL] Found {errors} invalid hash links in index.html.")

    return errors


def check_url(url: str, timeout: int = 6) -> int:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; CareerMatchLinkChecker/1.0)"
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.getcode() or 0)
    except urllib.error.HTTPError as exc:
        return int(exc.code)
    except Exception:
        return 0


def main() -> int:
    # 1. First audit HTML in-app anchors and routes
    html_errors = check_html_links(INDEX_PATH)
    if html_errors > 0:
        return 1

    # 2. Check external resource links if requested or if file exists
    if "--html-only" in sys.argv:
        return 0

    if not os.path.exists(RESOURCES_PATH):
        print(f"[SKIP] {RESOURCES_PATH} not found.")
        return 0

    with open(RESOURCES_PATH, "r", encoding="utf-8") as f:
        resources = json.load(f)

    # In fast CI/local runs, checking external links can be checked or skipped if offline
    if "--check-external" in sys.argv:
        non_200 = 0
        total = 0
        for skill, data in resources.items():
            for kind in ("freeCourse", "paidCourse"):
                course = data.get(kind, {})
                url = course.get("url", "")
                if not url:
                    continue
                total += 1
                status = check_url(url)
                if status != 200:
                    non_200 += 1
                    print(f"[STATUS {status}] {skill} ({kind}): {url}")

        if non_200 == 0:
            print(f"All {total} resource URLs returned HTTP 200.")
        else:
            print(f"{non_200} of {total} resource URLs did not return HTTP 200.")
        return 0 if non_200 == 0 else 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
