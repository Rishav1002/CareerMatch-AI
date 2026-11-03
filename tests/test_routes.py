"""
Route Registry & DOM Architecture Smoke Tests
Validates that every route in ROUTE_REGISTRY points to a real DOM panel,
aliases resolve cleanly, no panels are empty, component triggers exist,
and error handling / retry structures are in place.
"""

import os
import re

INDEX_HTML_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
ROUTER_JS_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "js", "router.js")
DATABASE_PY_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "database.py")

EXPECTED_ROUTES = [
    "landing",
    "dashboard",
    "analyzer",
    "ats",
    "readiness",
    "roadmap",
    "planner",
    "interview",
    "skills",
    "github",
    "report",
    "market",
    "compare",
    "tracker",
    "profile",
    "404",
]

EXPECTED_ALIASES = {
    "jobs": "market",
    "assessment": "skills",
    "career": "compare",
    "pri": "readiness",
    "match": "analyzer",
    "resume": "ats",
    "practice": "interview",
    "proof": "github",
    "overview": "dashboard",
    "account": "profile",
}


def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def test_route_registry_contains_all_routes():
    router_code = read_file(ROUTER_JS_PATH)
    for route in EXPECTED_ROUTES:
        assert f'{route}:' in router_code or f'"{route}":' in router_code, f"Missing route {route} in router.js"


def test_route_aliases_resolve_correctly():
    router_code = read_file(ROUTER_JS_PATH)
    for alias, target in EXPECTED_ALIASES.items():
        pattern = rf'{alias}:\s*"{target}"'
        assert re.search(pattern, router_code), f"Alias {alias} -> {target} not properly mapped in router.js"


def test_all_route_panel_ids_exist_in_index_html():
    html = read_file(INDEX_HTML_PATH)
    router_code = read_file(ROUTER_JS_PATH)

    panel_matches = re.findall(r'panelId:\s*"([^"]+)"', router_code)
    assert len(panel_matches) >= len(EXPECTED_ROUTES), "Could not find all panelIds in router.js"

    for panel_id in panel_matches:
        assert f'id="{panel_id}"' in html, f"Panel #{panel_id} declared in router.js does not exist in frontend/index.html"


def test_route_panels_have_meaningful_content():
    html = read_file(INDEX_HTML_PATH)
    router_code = read_file(ROUTER_JS_PATH)
    panel_ids = re.findall(r'panelId:\s*"([^"]+)"', router_code)

    for pid in panel_ids:
        pattern = rf'<section[^>]*id="{pid}"[^>]*>(.*?)</section>'
        match = re.search(pattern, html, re.DOTALL)
        assert match is not None, f"Could not find <section id='{pid}'> in index.html"
        inner_content = match.group(1).strip()
        assert len(inner_content) > 120, f"Panel #{pid} has trivial/empty content ({len(inner_content)} chars)"


def test_dead_overview_stub_is_removed():
    html = read_file(INDEX_HTML_PATH)
    assert '<div id="view-overview"></div>' not in html, "Dead stub <div id='view-overview'></div> must be removed"
    assert 'id="careerToolkitSection"' not in html, "Dead container #careerToolkitSection must be removed"


def test_view_404_exists_and_has_actionable_links():
    html = read_file(INDEX_HTML_PATH)
    assert 'id="view-404"' in html, "Missing #view-404 in frontend/index.html"
    assert '#/landing' in html
    assert '#/dashboard' in html
    assert '#/analyzer' in html


def test_component_required_ids_exist():
    html = read_file(INDEX_HTML_PATH)
    required_ids = [
        "cmdPaletteTrigger",
        "notifTriggerBtn",
        "shareScorecardBtn",
        "resumeHistoryListContainer",
        "historyDiffContainer",
        "startInterviewBtn",
    ]
    for cid in required_ids:
        assert f'id="{cid}"' in html, f"Required trigger/container #{cid} is missing from frontend/index.html"


def test_database_retry_loop_is_present():
    db_code = read_file(DATABASE_PY_PATH)
    assert "for attempt in range(3):" in db_code, "database.py must contain connection retry loop for Neon cold starts"
    assert "connect_timeout" in db_code, "database.py connection must specify connect_timeout"
