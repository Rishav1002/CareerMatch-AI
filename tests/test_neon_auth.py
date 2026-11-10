"""
Unit tests for Neon Managed Better Auth endpoints and session verification.
"""

import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app, _extract_user_id_from_auth_header
from backend.rate_limiter import rate_limiter
from backend.career_modules import register_user, login_user, sync_neon_user_with_student_profile

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_limiter():
    rate_limiter.reset()
    yield
    rate_limiter.reset()


def test_registration_validation_password_mismatch():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/sign-up/email", json={
        "email": unique_email,
        "password": "ValidPassword123!",
        "confirmPassword": "DifferentPassword456!",
        "name": "Test Candidate"
    })
    assert res.status_code == 400
    assert "match" in res.json()["detail"].lower()


def test_registration_validation_short_password():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/sign-up/email", json={
        "email": unique_email,
        "password": "short",
        "confirmPassword": "short",
        "name": "Test Candidate"
    })
    assert res.status_code == 400
    assert "8 characters" in res.json()["detail"]


def test_registration_and_login_flow():
    unique_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongSecurePassword123!"
    
    # 1. Sign up
    reg_res = client.post("/api/auth/sign-up/email", json={
        "email": unique_email,
        "password": pwd,
        "confirmPassword": pwd,
        "name": "Career Tester"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert data["status"] == "ok"
    assert "token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["fullName"] == "Career Tester"
    token = data["token"]

    # 2. Sign in with valid credentials
    login_res = client.post("/api/auth/sign-in/email", json={
        "email": unique_email,
        "password": pwd
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["email"] == unique_email
    assert "token" in login_data

    # 3. Sign in with incorrect password
    bad_login = client.post("/api/auth/sign-in/email", json={
        "email": unique_email,
        "password": "WrongPassword999!"
    })
    assert bad_login.status_code == 401

    # 4. Check /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == unique_email

    # 5. Check /api/auth/get-session with Bearer token
    session_res = client.get("/api/auth/get-session", headers={"Authorization": f"Bearer {token}"})
    assert session_res.status_code == 200
    session_data = session_res.json()
    assert session_data["user"]["email"] == unique_email

    # 6. Check /api/auth/sign-out
    logout_res = client.post("/api/auth/sign-out")
    assert logout_res.status_code == 200


def test_session_cookie_extraction():
    # Empty inputs return None
    assert _extract_user_id_from_auth_header(None, None) is None

    # Invalid token raises PermissionError
    with pytest.raises(PermissionError):
        _extract_user_id_from_auth_header(auth_header=None, session_cookie="invalid-token-xyz")


def test_sync_neon_user_preserves_existing_data():
    neon_user = {
        "id": f"neon_uid_{uuid.uuid4().hex[:6]}",
        "email": f"sync_{uuid.uuid4().hex[:6]}@example.com",
        "name": "Sync Candidate"
    }
    uid1 = sync_neon_user_with_student_profile(neon_user)
    assert uid1 is not None

    # Re-syncing the same user must return the existing profile without deleting or erroring
    uid2 = sync_neon_user_with_student_profile(neon_user)
    assert uid2 == uid1
