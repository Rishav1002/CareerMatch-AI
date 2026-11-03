"""
Tests for Core API Endpoints: Roles Catalog, Health Check, and AI Limiter.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import handle_health_check, handle_ask_ai_payload
from backend.roles_catalog import get_roles_catalog, get_roles_by_category
from backend.database import get_ai_usage, check_and_increment_ai_usage


def test_roles_catalog_has_over_40_roles():
    roles = get_roles_catalog()
    assert len(roles) >= 30, f"Expected at least 30 roles in catalog, found {len(roles)}"
    categories = get_roles_by_category()
    assert len(categories) >= 7, f"Expected at least 7 categories, found {len(categories)}"
    
    # Check key categories
    expected_cats = ["Software Engineering", "Data & AI", "Cloud & DevOps", "Cyber Security", "Mobile Engineering", "Quality Assurance"]
    for cat in expected_cats:
        assert cat in categories, f"Missing category {cat}"


def test_health_check_returns_database_connected():
    res, status_code = handle_health_check()
    assert status_code == 200
    assert res["status"] == "healthy"
    assert res["database"] == "connected"
    assert "engine" in res


def test_ai_rate_limiter_and_usage():
    test_uid = "test-guest-rate-limit-user"
    usage = get_ai_usage(test_uid, is_authenticated=False)
    assert usage["limit"] == 5
    assert usage["remaining"] <= 5
    assert "resetAt" in usage

    # Consume all remaining requests
    for _ in range(6):
        check_and_increment_ai_usage(test_uid, is_authenticated=False)

    # Next request should be blocked
    body = {"question": "How do I optimize SQL?"}
    res, code = handle_ask_ai_payload(body, test_uid, is_auth=False)
    assert code == 429
    assert res["remaining"] == 0
    assert "Daily AI query limit reached" in res["detail"]
