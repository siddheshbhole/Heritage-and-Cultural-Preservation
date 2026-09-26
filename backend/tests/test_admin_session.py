"""Tests for the admin session endpoint used by the frontend access gate.

The frontend must render the admin portal only when the verified token actually
carries administrative rights, otherwise the portal appears and every request
fails with 403. These tests pin that contract.
"""
import time

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app import auth
from app.routes.admin import get_admin_session, require_admin

HS_SECRET = "test-legacy-jwt-secret-value-1234567890"


def _claims(**overrides):
    now = int(time.time())
    claims = {
        "sub": "0d6f1f0e-1111-2222-3333-444455556666",
        "email": "admin@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + 3600,
        "app_metadata": {},
        "user_metadata": {},
    }
    claims.update(overrides)
    return claims


def _creds(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.fixture(autouse=True)
def _isolate_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", HS_SECRET)
    monkeypatch.setenv("ADMIN_EMAILS", "minister@example.com, admin@example.com")
    yield


def test_session_reports_admin_for_whitelisted_email():
    token = jwt.encode(_claims(email="minister@example.com"), HS_SECRET, algorithm="HS256")
    body = get_admin_session(auth.get_current_user(_creds(token)))
    assert body["is_admin"] is True
    assert body["email"] == "minister@example.com"


def test_session_reports_admin_for_metadata_role():
    token = jwt.encode(
        _claims(email="someone@else.com", app_metadata={"role": "admin"}),
        HS_SECRET,
        algorithm="HS256",
    )
    assert get_admin_session(auth.get_current_user(_creds(token)))["is_admin"] is True


def test_session_reports_non_admin_for_unlisted_email():
    token = jwt.encode(_claims(email="visitor@else.com"), HS_SECRET, algorithm="HS256")
    body = get_admin_session(auth.get_current_user(_creds(token)))
    assert body["is_admin"] is False
    # The same decision must gate the protected routes.
    with pytest.raises(HTTPException) as exc:
        require_admin(auth.get_current_user(_creds(token)))
    assert exc.value.status_code == 403


def test_session_agrees_with_route_guard_for_admin():
    token = jwt.encode(_claims(email="admin@example.com"), HS_SECRET, algorithm="HS256")
    user = auth.get_current_user(_creds(token))
    assert get_admin_session(user)["is_admin"] == user["is_admin"]
    assert require_admin(user) is user
