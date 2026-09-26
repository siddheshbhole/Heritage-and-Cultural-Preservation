"""Self-contained Heritage Guide authentication.

The guide system intentionally does NOT reuse the main Sanskriti Setu website
login. Guide identities live inside the Vacancies module and are authenticated
with their own access token issued here.

Design notes:

* No Supabase confirmation emails are ever sent, so the guide registration
  flow is immune to Supabase's *email provider* / daily email quota limits.
* The guide PIN is derived deterministically from the guide's own stored
  fields (email + phone + user id) using HMAC-SHA256 keyed by the project's
  JWT secret — no PIN column is required and nothing sensitive is stored.
* The issued access token is a standard HS256 JWT signed with the same
  ``SUPABASE_JWT_SECRET`` that ``auth.verify_supabase_jwt`` accepts, so the
  existing ``/api/guide/*`` endpoints keep working with zero changes and
  ownership is still enforced server-side per guide.
* A guide can never see another guide's private profile — every endpoint
  resolves the caller from the token's ``sub`` claim.

Endpoints (under ``/api/guide/auth``):

* POST ``/register`` — create a guide account, returns access token + PIN
* POST ``/login``    — guide member sign-in with email + Guide PIN
"""
import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import GuideProfile
from .heritage_guides import _normalise_phone, _profile_row

router = APIRouter(prefix="/api/guide/auth", tags=["heritage-guides-auth"])

# No ambiguous 0/O/1/I characters so PINs can be read and typed reliably.
_PIN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_PIN_LENGTH = 8


def _guide_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip() or "sanskriti-setu-guide-dev-secret"


def _derive_pin(email: str, phone: str, user_id: str) -> str:
    """Deterministic 8-char guide PIN from the guide's own stable fields.

    Recomputable at login without storing anything extra (and cannot leak the
    PIN back out of the hash).
    """
    message = f"{email}|{phone}|{user_id}".encode("utf-8")
    digest = hmac.new(_guide_secret().encode("utf-8"), message, hashlib.sha256).digest()
    number = int.from_bytes(digest, "big")
    out = []
    for _ in range(_PIN_LENGTH):
        number, rem = divmod(number, len(_PIN_ALPHABET))
        out.append(_PIN_ALPHABET[rem])
    return "".join(out)


def _make_guide_token(user_id: str, email: str) -> str:
    """Issue a JWT the existing ``get_current_user`` dependency will accept."""
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + timedelta(hours=12),
        "user_metadata": {"role": "guide"},
        "app_metadata": {"role": "authenticated"},
    }
    return jwt.encode(payload, _guide_secret(), algorithm="HS256")


class GuideAuthRegisterIn(BaseModel):
    name: str
    phone: str
    email: str
    state: str
    location: str | None = None


class GuideAuthLoginIn(BaseModel):
    email: str
    pin: str


@router.post("/register")
def register_guide_account(
    payload: GuideAuthRegisterIn,
    db: Session = Depends(get_db),
):
    """Create a dedicated guide account (separate from the main website login).

    No confirmation email is sent and no Supabase Auth user is created — the
    identity lives entirely inside the guide system. A guide PIN is returned
    once so the guide can sign back in under ``/auth/login``.
    """
    email = (payload.email or "").strip().lower()
    name = " ".join(payload.name.split())
    state = " ".join(payload.state.split())
    location = " ".join(payload.location.split()) if payload.location else None
    phone = _normalise_phone(payload.phone)

    if not email or not name or not phone or not state:
        raise HTTPException(status_code=400, detail="Name, phone, email and state are all required.")

    existing = db.query(GuideProfile).filter(GuideProfile.email == email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered as a Heritage Guide. Use “Already a Member” to sign in.",
        )

    user_id = f"guide-{uuid.uuid4().hex}"
    now = datetime.utcnow()
    profile = GuideProfile(
        user_id=user_id,
        name=name,
        phone=phone,
        email=email,
        state=state,
        location=location,
        avatar_url=None,
        availability="open_to_work",
        created_at=now,
        updated_at=now,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    pin = _derive_pin(email, phone, user_id)
    return {
        "access_token": _make_guide_token(user_id, email),
        "profile": _profile_row(profile),
        "pin": pin,
        "message": "Welcome aboard! Your Heritage Guide profile is now live and you are set to OPEN TO WORK.",
    }


@router.post("/login")
def guide_member_login(
    payload: GuideAuthLoginIn,
    db: Session = Depends(get_db),
):
    """Guide member sign-in with the registered email and Guide PIN."""
    email = (payload.email or "").strip().lower()
    pin = (payload.pin or "").strip().upper()
    if not email or not pin:
        raise HTTPException(status_code=400, detail="Email and Guide PIN are both required.")

    profile = db.query(GuideProfile).filter(GuideProfile.email == email).first()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No guide account found for this email. Please complete New Registration first.",
        )

    expected_pin = _derive_pin(email, profile.phone, profile.user_id)
    if not hmac.compare_digest(expected_pin.encode("utf-8"), pin.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Incorrect email or Guide PIN. Please try again.")

    return {
        "access_token": _make_guide_token(profile.user_id, email),
        "profile": _profile_row(profile),
        "message": "Welcome back! Your guide dashboard is ready.",
    }