"""Tests for Supabase JWT verification and admin authorization.

Supabase signs access tokens either with the project JWT secret (HS256) or,
on projects using asymmetric signing keys, with an ES256/RS256 key published
through the project JWKS endpoint. These tests cover both paths plus the
rejection cases that matter for the admin portal.
"""
import http.server
import json
import threading
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from app import auth

HS_SECRET = "test-legacy-jwt-secret-value-1234567890"
KID = "c4747b8b-9f73-4fce-9753-f6ba02c6df8b"


def _claims(**overrides):
    now = int(time.time())
    claims = {
        "sub": "0d6f1f0e-1111-2222-3333-444455556666",
        "email": "admin@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "iss": "https://example.supabase.co/auth/v1",
        "iat": now,
        "exp": now + 3600,
        "app_metadata": {"role": "admin"},
        "user_metadata": {"full_name": "Admin User"},
    }
    claims.update(overrides)
    return claims


def _b64(value: int) -> str:
    return jwt.utils.base64url_encode(value.to_bytes(32, "big")).decode()


@pytest.fixture()
def jwks_server():
    """Serve a single ES256 public key over HTTP, mirroring Supabase's JWKS."""
    key = ec.generate_private_key(ec.SECP256R1())
    numbers = key.public_key().public_numbers()
    document = {
        "keys": [{
            "kty": "EC",
            "crv": "P-256",
            "x": _b64(numbers.x),
            "y": _b64(numbers.y),
            "alg": "ES256",
            "use": "sig",
            "kid": KID,
            "key_ops": ["verify"],
        }]
    }
    body = json.dumps(document).encode("utf-8")

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass

    server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield key, f"http://127.0.0.1:{server.server_address[1]}/jwks.json"
    server.shutdown()


@pytest.fixture(autouse=True)
def _isolate_jwks_cache(monkeypatch):
    """Reset env and the module-level JWKS cache between tests."""
    monkeypatch.setenv("SUPABASE_JWT_SECRET", HS_SECRET)
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.delenv("SUPABASE_JWT_JWKS_URL", raising=False)
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    auth._jwks_client = None
    auth._jwks_client_url = None
    auth._jwks_client_cached_at = 0.0
    yield
    auth._jwks_client = None
    auth._jwks_client_url = None
    auth._jwks_client_cached_at = 0.0


class _Credentials:
    def __init__(self, token):
        self.credentials = token


# --- HS256 (legacy shared-secret signing) ------------------------------------

def test_hs256_token_accepted():
    token = jwt.encode(_claims(), HS_SECRET, algorithm="HS256")
    payload = auth.verify_supabase_jwt(token)
    assert payload["sub"] == _claims()["sub"]


def test_hs256_token_with_wrong_secret_rejected():
    token = jwt.encode(_claims(), "a-completely-different-secret-value-000", algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401


def test_hs256_token_expired_rejected():
    now = int(time.time())
    token = jwt.encode(_claims(iat=now - 7200, exp=now - 3600), HS_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert "expired" in exc.value.detail.lower()


def test_token_with_wrong_audience_rejected():
    token = jwt.encode(_claims(aud="some-other-audience"), HS_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert "audience" in exc.value.detail.lower()


# --- Asymmetric signing via the project JWKS ----------------------------------

def test_es256_token_accepted_via_jwks(jwks_server, monkeypatch):
    key, url = jwks_server
    monkeypatch.setenv("SUPABASE_JWT_JWKS_URL", url)
    token = jwt.encode(_claims(), key, algorithm="ES256", headers={"kid": KID})
    payload = auth.verify_supabase_jwt(token)
    assert payload["sub"] == _claims()["sub"]


def test_es256_token_with_unknown_kid_rejected(jwks_server, monkeypatch):
    key, url = jwks_server
    monkeypatch.setenv("SUPABASE_JWT_JWKS_URL", url)
    token = jwt.encode(_claims(), key, algorithm="ES256", headers={"kid": "not-a-real-kid"})
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401


def test_es256_tampered_token_rejected(jwks_server, monkeypatch):
    key, url = jwks_server
    monkeypatch.setenv("SUPABASE_JWT_JWKS_URL", url)
    token = jwt.encode(_claims(), key, algorithm="ES256", headers={"kid": KID})
    tampered = token[:-3] + ("aaa" if not token.endswith("aaa") else "bbb")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(tampered)
    assert exc.value.status_code == 401


def test_jwks_client_is_cached_across_calls(jwks_server, monkeypatch):
    key, url = jwks_server
    monkeypatch.setenv("SUPABASE_JWT_JWKS_URL", url)
    token = jwt.encode(_claims(), key, algorithm="ES256", headers={"kid": KID})
    auth.verify_supabase_jwt(token)
    first = auth._jwks_client
    auth.verify_supabase_jwt(token)
    assert auth._jwks_client is first


# --- Unsigned / malformed tokens ----------------------------------------------

def test_unsigned_token_rejected():
    token = jwt.encode(_claims(), key="", algorithm="none")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert "not signed" in exc.value.detail.lower()


def test_malformed_token_rejected():
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt("not.a.jwt")
    assert exc.value.status_code == 401


def test_empty_token_rejected():
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt("   ")
    assert exc.value.status_code == 401


# --- Fail closed when key material is missing --------------------------------

def test_hs256_rejected_when_secret_unconfigured(monkeypatch):
    """A signed token must never be trusted when its secret is absent."""
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    token = jwt.encode(_claims(), HS_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401
    assert "SUPABASE_JWT_SECRET" in exc.value.detail


def test_es256_rejected_when_jwks_unconfigured(monkeypatch):
    """A signature must never be skipped just because no JWKS is configured."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("VITE_SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_JWKS_URL", raising=False)
    key = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(_claims(), key, algorithm="ES256", headers={"kid": KID})
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401
    assert "JWKS" in exc.value.detail


def test_hs256_not_accepted_by_jwks_only_setup(monkeypatch):
    """Secret-only configuration must not silently trust asymmetric tokens."""
    monkeypatch.delenv("SUPABASE_JWT_SECRET", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("VITE_SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_JWT_JWKS_URL", raising=False)
    token = jwt.encode(_claims(), HS_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401


def test_es256_signature_from_other_key_rejected(jwks_server, monkeypatch):
    """A valid ES256 token signed by a key absent from the JWKS must fail."""
    key, url = jwks_server
    monkeypatch.setenv("SUPABASE_JWT_JWKS_URL", url)
    rogue = ec.generate_private_key(ec.SECP256R1())
    token = jwt.encode(_claims(), rogue, algorithm="ES256", headers={"kid": KID})
    with pytest.raises(HTTPException) as exc:
        auth.verify_supabase_jwt(token)
    assert exc.value.status_code == 401


# --- Admin authorization ------------------------------------------------------

def test_admin_via_app_metadata_role():
    token = jwt.encode(_claims(app_metadata={"role": "admin"}), HS_SECRET, algorithm="HS256")
    assert auth.get_current_user(_Credentials(token))["is_admin"] is True


def test_admin_via_email_whitelist():
    token = jwt.encode(
        _claims(email="admin@example.com", app_metadata={}, user_metadata={}),
        HS_SECRET,
        algorithm="HS256",
    )
    assert auth.get_current_user(_Credentials(token))["is_admin"] is True


def test_non_admin_is_not_flagged_as_admin():
    token = jwt.encode(
        _claims(email="visitor@example.com", app_metadata={}, user_metadata={}),
        HS_SECRET,
        algorithm="HS256",
    )
    user = auth.get_current_user(_Credentials(token))
    assert user["is_admin"] is False
    with pytest.raises(HTTPException) as exc:
        auth.require_admin(user)
    assert exc.value.status_code == 403


def test_missing_credentials_rejected():
    with pytest.raises(HTTPException) as exc:
        auth.get_current_user(None)
    assert exc.value.status_code == 401


def test_optional_user_returns_none_for_bad_token():
    token = jwt.encode(_claims(), "wrong-secret-entirely-aaaaaaaaaaaaaaaaa", algorithm="HS256")
    assert auth.get_current_user_optional(_Credentials(token)) is None
