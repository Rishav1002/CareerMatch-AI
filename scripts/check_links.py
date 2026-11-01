"""
Check every Free and Paid course URL in backend/resources.json
and print any URL that does not return HTTP 200.
"""

import json
import os
import sys
import urllib.error
import urllib.request

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_PATH = os.path.join(ROOT_DIR, "backend", "resources.json")


def check_url(url: str, timeout: int = 10) -> int:
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
    with open(RESOURCES_PATH, "r", encoding="utf-8") as f:
        resources = json.load(f)

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
        print(f"All {total} URLs returned HTTP 200.")
    else:
        print(f"{non_200} of {total} URLs did not return HTTP 200.")
    return 0 if non_200 == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
