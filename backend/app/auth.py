import os
import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidAlgorithmError, InvalidAudienceError, InvalidTokenError, PyJWKClient
from jwt.exceptions import ExpiredSignatureError

security = HTTPBearer(auto_error=False)

# Supabase signs access tokens either with the project JWT secret (HS256) or,
# on projects using asymmetric signing keys, with an ES256/RS256 key published
# through the project's JWKS endpoint. The token's own header tells us which one
# applies, so the algorithm is never taken from configuration alone.
HMAC_ALGORITHMS = ("HS256", "HS384", "HS512")
ASYMMETRIC_ALGORITHMS = ("ES256", "ES384", "ES512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512")
SUPPORTED_ALGORITHMS = HMAC_ALGORITHMS + ASYMMETRIC_ALGORITHMS

JWKS_CACHE_TTL_SECONDS = 3600
JWKS_DEFAULT_LIFETIME_SECONDS = 300

_jwks_client: PyJWKClient | None = None
_jwks_client_url: str | None = None
_jwks_client_cached_at: float = 0.0


def get_admin_emails() -> list[str]:
    raw = os.getenv("ADMIN_EMAILS", "admin@example.com")
    return list(dict.fromkeys(e.strip().lower() for e in raw.split(",") if e.strip()))


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_supabase_url() -> str:
    url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").strip().rstrip("/")
    return url


def _default_jwks_url() -> str:
    base = get_supabase_url()
    if not base:
        return ""
    return f"{base}/auth/v1/.well-known/jwks.json"


def get_jwks_url() -> str:
    """Resolve the JWKS endpoint, allowing an explicit override for self-hosted setups."""
    return (os.getenv("SUPABASE_JWT_JWKS_URL") or _default_jwks_url()).strip()


def _get_jwks_client() -> PyJWKClient:
    """Return a cached PyJWKClient so the JWKS document is fetched at most once per TTL."""
    global _jwks_client, _jwks_client_url, _jwks_client_cached_at

    jwks_url = get_jwks_url()
    if not jwks_url:
        raise _unauthorized(
            "Authentication is not configured: set SUPABASE_JWT_SECRET for HS256 tokens "
            "or SUPABASE_URL (plus SUPABASE_JWT_JWKS_URL) for asymmetric signing keys."
        )

    now = time.monotonic()
    expired = (now - _jwks_client_cached_at) > JWKS_CACHE_TTL_SECONDS
    if _jwks_client is None or _jwks_client_url != jwks_url or expired:
        _jwks_client = PyJWKClient(
            jwks_url,
            cache_keys=True,
            lifespan=JWKS_DEFAULT_LIFETIME_SECONDS,
        )
        _jwks_client_url = jwks_url
        _jwks_client_cached_at = now
    return _jwks_client


def _decode_with_secret(token: str, secret: str) -> dict:
    return jwt.decode(
        token,
        secret,
        algorithms=list(HMAC_ALGORITHMS),
        audience="authenticated",
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": True,
            "require": ["exp", "sub"],
        },
    )


def _decode_with_jwks(token: str, kid: str | None) -> dict:
    client = _get_jwks_client()
    # A missing kid means the token predates key rotation; PyJWKClient still
    # resolves the single published key, so only pass kid through when present.
    signing_key = client.get_signing_key_from_jwt(token) if kid is None else client.get_signing_key(kid)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=[signing_key.algorithm_name or "RS256"],
        audience="authenticated",
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": True,
            "require": ["exp", "sub"],
        },
    )


def _missing_key_error(alg: str) -> HTTPException:
    if alg in HMAC_ALGORITHMS:
        return _unauthorized(
            f"Token algorithm '{alg}' requires SUPABASE_JWT_SECRET, but it is not configured on this server."
        )
    return _unauthorized(
        f"Token algorithm '{alg}' requires the project JWKS. Set SUPABASE_URL or "
        "SUPABASE_JWT_JWKS_URL so signing keys can be fetched."
    )


def verify_supabase_jwt(token: str) -> dict:
    """Decode and verify a Supabase access token.

    The algorithm is taken from the token header and dispatched accordingly:
    HMAC algorithms are verified with SUPABASE_JWT_SECRET, while asymmetric
    algorithms (ES256/RS256/...) are verified against the project JWKS. Expiry,
    audience and subject claims are always enforced. If the key material
    required to verify the token is missing the request is rejected; a token is
    never trusted without a verified signature.
    """
    if not token or not token.strip():
        raise _unauthorized("Authentication token was not provided.")

    token = token.strip()

    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as e:
        raise _unauthorized(f"Malformed authentication token: {e}")

    alg = str(header.get("alg") or "").strip()
    kid = header.get("kid")

    if alg in ("", "none", "None"):
        raise _unauthorized("Authentication token is not signed and cannot be trusted.")

    if alg not in SUPPORTED_ALGORITHMS:
        raise _unauthorized(f"Authentication token algorithm '{alg}' is not supported by this server.")

    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if alg in HMAC_ALGORITHMS and not secret:
        raise _missing_key_error(alg)

    try:
        if alg in HMAC_ALGORITHMS:
            return _decode_with_secret(token, secret)
        return _decode_with_jwks(token, kid)
    except ExpiredSignatureError:
        raise _unauthorized("Authentication token has expired.")
    except InvalidAudienceError:
        raise _unauthorized("Invalid authentication token audience.")
    except InvalidAlgorithmError as e:
        raise _unauthorized(f"Invalid authentication token algorithm: {e}")
    except HTTPException:
        raise
    except jwt.PyJWTError as e:
        raise _unauthorized(f"Invalid authentication token signature or claims: {e}")
    except Exception as e:  # network/JWKS/key-derivation failures
        raise _unauthorized(f"Unable to verify authentication token: {e}")


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    """FastAPI dependency to retrieve authenticated user details from Supabase JWT."""
    if not credentials or not credentials.credentials:
        raise _unauthorized("Authentication credentials were not provided.")

    payload = verify_supabase_jwt(credentials.credentials)

    user_id = payload.get("sub")
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {}) or {}
    app_metadata = payload.get("app_metadata", {}) or {}

    if not user_id:
        raise _unauthorized("Invalid token claims: missing subject (sub) identifier.")

    # Check admin status via verified token claims or server admin email whitelist
    admin_emails = get_admin_emails()
    is_admin = (
        app_metadata.get("role") == "admin"
        or user_metadata.get("role") == "admin"
        or (email and email.lower() in admin_emails)
    )

    return {
        "id": user_id,
        "email": email,
        "name": user_metadata.get("full_name") or user_metadata.get("name") or (email.split("@")[0] if email else "Anonymous"),
        "user_metadata": user_metadata,
        "app_metadata": app_metadata,
        "is_admin": is_admin,
        "token": credentials.credentials,
    }


def get_current_user_optional(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict | None:
    """FastAPI dependency to optionally retrieve authenticated user details if Bearer token present."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """FastAPI dependency enforcing admin role permissions."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to perform this action.",
        )
    return current_user
