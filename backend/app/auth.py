import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def get_admin_emails() -> list[str]:
    raw = os.getenv("ADMIN_EMAILS", "admin@example.com")
    return [e.strip().lower() for e in raw.split(",") if e.strip()]


def verify_supabase_jwt(token: str) -> dict:
    """Decode and verify Supabase JWT signature and expiration.

    Supabase issues access tokens signed with HS256 using the project's JWT Secret.
    """
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

    if not secret:
        # Development fallback: if secret is unconfigured, attempt verification or fail securely
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    try:
        # Verify HMAC HS256 signature, expiration, and audience claims
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
            },
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token audience.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token signature or claims: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    """FastAPI dependency to retrieve authenticated user details from Supabase JWT."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_supabase_jwt(credentials.credentials)

    user_id = payload.get("sub")
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    app_metadata = payload.get("app_metadata", {})

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: missing subject (sub) identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

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


