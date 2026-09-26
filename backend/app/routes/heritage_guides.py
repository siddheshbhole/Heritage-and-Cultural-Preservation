"""Rebuilt, database-driven Heritage Guide system.

Replaces the legacy Vacancy / Heritage Guide / Tourist Tour module
(``routes/guides.py``). Every GuideProfile is tied 1:1 to an authenticated
Supabase user so ownership is always enforced server-side.

Endpoints (all under ``/api/guide``):

* POST ``/register``               — create a GuideProfile (auth required)
* GET  ``/me``                     — own dashboard profile + real statistics
* PATCH ``/me/availability``       — only ``open_to_work`` / ``not_ready``
* GET  ``/site/{site_id}``         — available guides near a site (+ my tour)
* POST ``/tour/start``             — tourist books an available guide
* POST ``/tour/end``               — tourist (or guide) finishes a tour
* POST ``/guide/{guide_id}/report``— private report, admin-only visibility
* POST ``/tour/{tour_id}/review``  — 1-5 star review appended to guide profile

Availability contract:

* ``open_to_work`` — manual choice; guide appears on heritage site pages
* ``not_ready``    — manual choice; guide is hidden from heritage site pages
* ``occupied``     — ALWAYS set by the system while an active tour exists;
  it can never be chosen manually and always resolves back to ``open_to_work``
  when the last active tour ends.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..models import GuideProfile, GuideReport, GuideReview, HeritageSite, TourAssignment

router = APIRouter(prefix="/api/guide", tags=["heritage-guides"])

VALID_AVAILABILITY = ("open_to_work", "not_ready")
REPORT_REASONS = ("misconduct", "misinformation", "no_show", "unsafe", "other")


def _normalise_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    return digits


def _profile_row(profile: GuideProfile, rating: float = 0, reviews_count: int = 0) -> dict:
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "name": profile.name,
        "phone": profile.phone,
        "email": profile.email,
        "state": profile.state,
        "location": profile.location,
        "avatar_url": profile.avatar_url,
        "availability": profile.availability,
        "rating": round(rating or 0, 1),
        "reviews_count": reviews_count,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def _tour_row(tour: TourAssignment, guide: GuideProfile | None = None) -> dict:
    row = {
        "id": tour.id,
        "guide_id": tour.guide_id,
        "tourist_user_id": tour.tourist_user_id,
        "site_id": tour.site_id,
        "site_name": tour.site_name,
        "status": tour.status,
        "created_at": tour.created_at.isoformat() if tour.created_at else None,
        "updated_at": tour.updated_at.isoformat() if tour.updated_at else None,
    }
    if guide is not None:
        row["guide"] = _profile_row(guide)
    return row


def _review_row(review: GuideReview) -> dict:
    return {
        "id": review.id,
        "tour_id": review.tour_id,
        "guide_id": review.guide_id,
        "tourist_user_id": review.tourist_user_id,
        "rating": review.rating,
        "review_text": review.review_text,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


def _guide_stats_map(db: Session, guide_ids: list[int]) -> dict[int, dict]:
    """Rating average + review count for a set of guide profiles."""
    stats = {guid: {"rating": 0.0, "reviews_count": 0} for guid in guide_ids}
    if not guide_ids:
        return stats
    rows = (
        db.query(
            GuideReview.guide_id,
            func.avg(GuideReview.rating).label("avg_rating"),
            func.count(GuideReview.id).label("review_count"),
        )
        .filter(GuideReview.guide_id.in_(guide_ids))
        .group_by(GuideReview.guide_id)
        .all()
    )
    for guide_id, avg_rating, review_count in rows:
        stats[guide_id] = {"rating": float(avg_rating or 0), "reviews_count": int(review_count or 0)}
    return stats


def _active_tours(db: Session, guide_id: int) -> list[TourAssignment]:
    return (
        db.query(TourAssignment)
        .filter(TourAssignment.guide_id == guide_id, TourAssignment.status == "active")
        .order_by(TourAssignment.created_at.desc(), TourAssignment.id.desc())
        .all()
    )


def _owned_profile(db: Session, user_id: str) -> GuideProfile:
    profile = (
        db.query(GuideProfile).filter(GuideProfile.user_id == user_id).first()
    )
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No guide profile found for your account. Please register as a Heritage Guide first.",
        )
    return profile


def _sync_guide_availability(db: Session, profile: GuideProfile) -> None:
    """Availability is a faithful mirror of real active assignments."""
    db.flush()
    active = _active_tours(db, profile.id)
    profile.availability = "occupied" if active else "open_to_work"
    profile.updated_at = datetime.utcnow()
    # flush so the caller's subsequent query never reads stale availability
    db.flush()


class GuideRegistrationIn(BaseModel):
    name: str
    phone: str
    email: str
    state: str
    location: str | None = None
    avatar_url: str | None = None


class GuideAvailabilityIn(BaseModel):
    availability: str


class GuideTourStartIn(BaseModel):
    guide_id: int
    site_id: int | None = None
    site_name: str | None = None


class GuideTourEndIn(BaseModel):
    tour_id: int


class GuideReportIn(BaseModel):
    reason_category: str = "other"
    description: str | None = None
    tour_id: int | None = None


class GuideReviewIn(BaseModel):
    rating: int
    review_text: str | None = None


@router.post("/register")
def register_guide_profile(
    payload: GuideRegistrationIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Register the authenticated user as a Heritage Guide.

    Tied 1:1 to the Supabase ``user_id`` — a second submission for the same
    account is rejected so no duplicate profiles can ever exist.
    """
    existing = db.query(GuideProfile).filter(GuideProfile.user_id == current_user["id"]).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a Heritage Guide profile. Manage it from your dashboard.",
        )

    name = " ".join(payload.name.split())
    state = " ".join(payload.state.split())
    location = " ".join(payload.location.split()) if payload.location else None
    phone = _normalise_phone(payload.phone)
    email = (payload.email or "").strip().lower()

    now = datetime.utcnow()
    profile = GuideProfile(
        user_id=current_user["id"],
        name=name,
        phone=phone,
        email=email,
        state=state,
        location=location,
        avatar_url=(payload.avatar_url or "").strip() or None,
        availability="open_to_work",
        created_at=now,
        updated_at=now,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "profile": _profile_row(profile),
        "message": "Welcome aboard! Your Heritage Guide profile is now live and you are set to OPEN TO WORK.",
    }


@router.get("/me")
def get_my_guide_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Signed-in dashboard for the guide: own profile plus real statistics.

    Everything is computed from the live database — a guide can only ever see
    their own profile, reviews, reports and assignments.
    """
    profile = _owned_profile(db, current_user["id"])

    active = _active_tours(db, profile.id)
    completed_count = (
        db.query(TourAssignment)
        .filter(TourAssignment.guide_id == profile.id, TourAssignment.status == "completed")
        .count()
    )
    reviews_count = (
        db.query(GuideReview).filter(GuideReview.guide_id == profile.id).count()
    )
    reports_count = (
        db.query(GuideReport).filter(GuideReport.guide_id == profile.id).count()
    )
    stats = _guide_stats_map(db, [profile.id])[profile.id]

    return {
        "profile": _profile_row(profile, stats["rating"], stats["reviews_count"]),
        "tours_completed": completed_count,
        "tours_total": completed_count + len(active),
        "reviews_count": reviews_count,
        "rating": stats["rating"],
        "reports_count": reports_count,
        "current_tour": _tour_row(active[0]) if active else None,
    }


@router.patch("/me/availability")
def update_my_availability(
    payload: GuideAvailabilityIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Guide toggles their own availability: OPEN TO WORK or NOT READY.

    ``occupied`` is never accepted: it can only be set by the system while an
    active tour exists, so a guide running a tour cannot silently disable it.
    """
    availability = (payload.availability or "").strip().lower()
    if availability not in VALID_AVAILABILITY:
        raise HTTPException(
            status_code=400,
            detail="Availability must be one of open_to_work or not_ready.",
        )

    profile = _owned_profile(db, current_user["id"])

    if availability == "not_ready" and _active_tours(db, profile.id):
        raise HTTPException(
            status_code=409,
            detail=(
                "You still have an active tour. End the current tour first — "
                "your availability will update automatically."
            ),
        )

    profile.availability = availability
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return {
        "profile": _profile_row(profile),
        "message": f"You are now marked as {'OPEN TO WORK' if availability == 'open_to_work' else 'NOT READY'}.",
    }


@router.get("/site/{site_id}")
def list_site_guides(
    site_id: int,
    state: str | None = Query(default=None, description="Site state name used to find relevant local guides"),
    location: str | None = Query(default=None, description="Free-text site location / region string"),
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Public list of ``open_to_work`` guides relevant to a heritage site.

    Matching is done against the site's own state / region / location fields so
    visitors are shown local guides rather than every guide in India. The
    tourist's own active tour for the site (if any) is returned so the page can
    re-render the "Current Guide" state on reload.
    """
    site = db.get(HeritageSite, site_id)
    state_name = state
    site_location = location
    if site:
        state_name = state_name or (site.state.name if site.state else None)
        site_location = site_location or site.location

    profiles = (
        db.query(GuideProfile)
        .filter(GuideProfile.availability == "open_to_work")
        .order_by(GuideProfile.created_at.desc(), GuideProfile.id.desc())
        .all()
    )

    if profiles and (state_name or site_location):
        def _tokens(*values: str | None) -> list[str]:
            out = []
            for value in values:
                if not value:
                    continue
                for part in str(value).split(","):
                    part = part.strip()
                    if part:
                        out.append(part.lower())
            return out

        def _matches(profile: GuideProfile, site_state: str | None, site_loc: str | None) -> bool:
            p_state = (profile.state or "").strip().lower()
            p_locs = _tokens(profile.location)
            candidates = _tokens(site_state, site_loc)

            if not candidates:
                return True
            if not p_state and not p_locs:
                return False

            def hit(value: str) -> bool:
                value = value or ""
                if not value:
                    return False
                return any(
                    value == c or c == value
                    or (len(value) > 3 and (value.endswith(c) or c.endswith(value)))
                    or (c in value or value in c)
                    for c in candidates
                )

            return any(hit(v) for v in [p_state, *p_locs])

        profiles = [p for p in profiles if _matches(p, state_name, site_location)]

    stats = _guide_stats_map(db, [p.id for p in profiles])
    guides = [_profile_row(p, stats[p.id]["rating"], stats[p.id]["reviews_count"]) for p in profiles]

    my_tour = None
    user_id = (current_user or {}).get("id")
    if user_id:
        tour = (
            db.query(TourAssignment)
            .filter(
                TourAssignment.tourist_user_id == user_id,
                TourAssignment.status == "active",
            )
            .order_by(TourAssignment.created_at.desc(), TourAssignment.id.desc())
            .first()
        )
        if tour:
            guide = db.get(GuideProfile, tour.guide_id)
            my_tour = _tour_row(tour, guide)

    return {
        "site_id": site_id,
        "guides": guides,
        "my_tour": my_tour,
    }


@router.post("/tour/start")
def start_guide_tour(
    payload: GuideTourStartIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tourist action: book an available guide for a site.

    Creates a real assignment (the guide becomes ``occupied``) so nobody else
    can book them until the tour ends.
    """
    guide = db.get(GuideProfile, payload.guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{payload.guide_id} not found.")
    if guide.availability != "open_to_work":
        raise HTTPException(status_code=409, detail="This guide is not available for selection right now.")

    my_active = (
        db.query(TourAssignment)
        .filter(
            TourAssignment.tourist_user_id == current_user["id"],
            TourAssignment.status == "active",
        )
        .order_by(TourAssignment.created_at.desc(), TourAssignment.id.desc())
        .all()
    )
    if any(t.guide_id == guide.id for t in my_active):
        raise HTTPException(status_code=409, detail="You are already connected with this guide.")

    site = None
    if payload.site_id:
        site = db.get(HeritageSite, payload.site_id)
        if not site:
            raise HTTPException(status_code=404, detail=f"Heritage site #{payload.site_id} not found.")

    site_name = " ".join((payload.site_name or site.name if site else payload.site_name or "").split())
    if not site_name:
        raise HTTPException(status_code=400, detail="A site name is required.")

    now = datetime.utcnow()
    tour = TourAssignment(
        guide_id=guide.id,
        tourist_user_id=current_user["id"],
        site_id=(site.id if site else payload.site_id),
        site_name=site_name,
        status="active",
        created_at=now,
        updated_at=now,
    )
    db.add(tour)
    guide.availability = "occupied"
    guide.updated_at = now
    db.commit()
    db.refresh(tour)
    db.refresh(guide)

    stats = _guide_stats_map(db, [guide.id])[guide.id]
    return {
        "tour": _tour_row(tour),
        "guide": _profile_row(guide, stats["rating"], stats["reviews_count"]),
        "message": f"You are now connected with {guide.name}. The guide has been marked occupied.",
    }


@router.post("/tour/end")
def end_guide_tour(
    payload: GuideTourEndIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tourist (or guide) action: finish an active assignment.

    The tour becomes ``completed`` and feeds the guide's real "Tours Completed"
    count. The guide is released back to OPEN TO WORK automatically.
    """
    tour = db.get(TourAssignment, payload.tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour assignment not found.")

    user_id = current_user["id"]
    guide = db.get(GuideProfile, tour.guide_id)
    is_guide_owner = bool(guide and guide.user_id == user_id)
    if not (tour.tourist_user_id == user_id or is_guide_owner):
        raise HTTPException(status_code=403, detail="You can only end your own tour assignment.")

    if tour.status == "completed":
        return {
            "tour": _tour_row(tour, guide),
            "guide": _profile_row(guide) if guide else None,
            "message": "This tour was already completed.",
        }
    if tour.status != "active":
        raise HTTPException(status_code=409, detail="Only active tours can be ended.")

    tour.status = "completed"
    tour.updated_at = datetime.utcnow()
    if guide:
        _sync_guide_availability(db, guide)
    db.commit()
    db.refresh(tour)
    if guide:
        db.refresh(guide)
    stats = _guide_stats_map(db, [guide.id])[guide.id] if guide else {"rating": 0.0, "reviews_count": 0}
    return {
        "tour": _tour_row(tour, guide),
        "guide": _profile_row(guide, stats["rating"], stats["reviews_count"]) if guide else None,
        "message": "Tour ended. The guide is now OPEN TO WORK for other visitors.",
    }


@router.post("/guide/{guide_id}/report")
def report_guide_profile(
    guide_id: int,
    payload: GuideReportIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tourist action: privately report an issue with a guide.

    Reports are only ever visible to administrators and never change the
    guide's public availability.
    """
    guide = db.get(GuideProfile, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{guide_id} not found.")

    reason = (payload.reason_category or "other").strip().lower()
    if reason not in REPORT_REASONS:
        reason = "other"
    description = (" ".join(payload.description.split()))[:1000] if payload.description else None
    if reason == "other" and not description:
        raise HTTPException(status_code=400, detail="Please describe the issue you want to report.")

    report = GuideReport(
        tour_id=payload.tour_id,
        guide_id=guide.id,
        tourist_user_id=current_user["id"],
        reason_category=reason,
        description=description,
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "message": "Your report has been submitted. An administrator will review it shortly.",
        "report_id": report.id,
        "status": "open",
    }


@router.post("/tour/{tour_id}/review")
def review_guide_tour(
    tour_id: int,
    payload: GuideReviewIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tourist action: leave a 1-5 star review with optional text.

    Written to GuideReviews and rolled into the guide's public rating. One
    review per tour — re-submitting updates the original.
    """
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars.")

    tour = db.get(TourAssignment, tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour assignment not found.")
    if tour.tourist_user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only review your own tour.")

    review = (
        db.query(GuideReview)
        .filter(
            GuideReview.tour_id == tour.id,
            GuideReview.tourist_user_id == current_user["id"],
        )
        .first()
    )
    if review:
        review.rating = payload.rating
        review.review_text = (" ".join(payload.review_text.split()))[:1000] if payload.review_text else None
        message = "Your review has been updated."
    else:
        review = GuideReview(
            tour_id=tour.id,
            guide_id=tour.guide_id,
            tourist_user_id=current_user["id"],
            rating=payload.rating,
            review_text=(" ".join(payload.review_text.split()))[:1000] if payload.review_text else None,
            created_at=datetime.utcnow(),
        )
        db.add(review)
        message = "Thank you for reviewing your guide!"

    db.commit()
    db.refresh(review)
    return {"review": _review_row(review), "message": message}