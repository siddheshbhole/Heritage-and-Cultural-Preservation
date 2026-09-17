import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_current_user_optional, require_admin
from ..database import get_db
from ..models import (
    AuditLog,
    GuideReport,
    GuideTour,
    HeritageGuide,
    HeritageSite,
)
from ..serializers import guide_admin_row, guide_row, guide_tour_row

router = APIRouter(prefix="/api", tags=["guides"])

VALID_STATUSES = ("pending", "approved", "rejected")
VALID_AVAILABILITY = ("free", "occupied")
VALID_TOUR_STATUSES = ("active", "completed", "cancelled")


class GuideRegistrationIn(BaseModel):
    full_name: str
    phone: str
    email: str
    state: str
    location: str | None = None


class GuideStatusIn(BaseModel):
    status: str


class GuideUpdateMeIn(BaseModel):
    availability: str = "free"
    location: str | None = None


class GuideChooseIn(BaseModel):
    site_name: str


class GuideTourCreateIn(BaseModel):
    guide_id: int
    heritage_site_id: int | None = None
    site_name: str
    tourist_name: str | None = None
    tourist_email: str | None = None
    tourist_phone: str | None = None


class GuideTourManageIn(BaseModel):
    tour_token: str | None = None


class GuideReportIn(BaseModel):
    reason: str
    details: str | None = None


def _normalise_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    return digits


def _log_admin_action(db: Session, admin_user: dict, action: str, record_id: str, details: dict):
    try:
        db.add(AuditLog(
            user_id=admin_user.get("id", "admin"),
            user_email=admin_user.get("email", ""),
            action=action,
            model_name="heritage_guides",
            record_id=str(record_id),
            details=json.dumps(details, default=str),
        ))
        db.commit()
    except Exception as e:
        print(f"Failed audit log for heritage guide: {e}")
        db.rollback()


def _owned_guide(db: Session, current_user: dict) -> HeritageGuide:
    """Return the guide registration owned by the authenticated user.

    Ownership is enforced server-side: the record must belong to the current
    Supabase user, so no user can ever read/update another guide's record.
    """
    guide = (
        db.query(HeritageGuide)
        .filter(
            HeritageGuide.user_id == current_user["id"],
            HeritageGuide.status.in_(("pending", "approved")),
        )
        .order_by(HeritageGuide.status == "approved", HeritageGuide.updated_at.desc())
        .first()
    )
    if not guide:
        raise HTTPException(
            status_code=404,
            detail="No guide registration found for your account. Please register as a Heritage Guide first.",
        )
    return guide


def _active_tours(db: Session, guide_id: int) -> list[GuideTour]:
    return (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide_id, GuideTour.status == "active")
        .order_by(GuideTour.created_at.desc(), GuideTour.id.desc())
        .all()
    )


def _sync_guide_availability(db: Session, guide: HeritageGuide) -> None:
    """Recompute a guide's public availability from their real active tours.

    The database tours are the single source of truth: the guide is Free only
    when no active tour remains, and Occupied whenever at least one active tour
    exists.
    """
    # Sessions run with ``autoflush=False``: flush any pending tour status
    # changes first so the availability lookup below never reads stale tours.
    db.flush()
    active = _active_tours(db, guide.id)
    if active:
        guide.availability = "occupied"
        guide.assigned_site = active[0].site_name
    else:
        guide.availability = "free"
        guide.assigned_site = None
    guide.updated_at = datetime.utcnow()


def _tour_writable(db: Session, tour: GuideTour, current_user: dict | None, tour_token: str | None) -> bool:
    """Whether the caller is entitled to manage a given tour.

    Allowed: the tourist who created it (authenticated user or tour token), and
    the assigned guide (authenticated owner).
    """
    user_id = (current_user or {}).get("id")
    if user_id:
        if tour.tourist_user_id and tour.tourist_user_id == user_id:
            return True
        guide = (
            db.query(HeritageGuide)
            .filter(
                HeritageGuide.id == tour.guide_id,
                HeritageGuide.user_id == user_id,
            )
            .first()
        )
        if guide:
            return True
    if tour_token and tour.tour_token and tour.tour_token == tour_token:
        return True
    return False


@router.post("/guides/register")
def register_guide(
    payload: GuideRegistrationIn,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Public registration for volunteer Heritage Guides.

    The application is stored with status ``pending`` so an administrator can
    review it before the guide appears on heritage site detail pages. When the
    registrant is signed in, the registration is linked to their account so the
    same user can later manage it from the Vacancies dashboard.
    """
    name = " ".join(payload.full_name.split())
    state = " ".join(payload.state.split())
    location = (" ".join(payload.location.split())) if payload.location else None
    phone = _normalise_phone(payload.phone)
    email = (payload.email or "").strip().lower()

    existing = (
        db.query(HeritageGuide)
        .filter(
            or_(
                HeritageGuide.phone == phone,
                HeritageGuide.email == email,
            )
        )
        .filter(HeritageGuide.status.in_(("pending", "approved")))
        .first()
    )
    if existing:
        # A signed-in user may claim a registration they previously submitted
        # while logged out, provided it uses their authenticated email. This
        # lets them manage availability from the Vacancies dashboard instead of
        # hitting a dead end (409) and being unable to see their own record.
        account_email = ((current_user or {}).get("email") or "").strip().lower()
        if current_user and existing.user_id is None and account_email and existing.email == account_email:
            existing.user_id = current_user["id"]
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return {
                **guide_row(existing),
                "message": "Your existing Heritage Guide registration has been linked to your account.",
            }
        raise HTTPException(
            status_code=409,
            detail="This phone number or email is already registered as a Heritage Guide.",
        )

    now = datetime.utcnow()
    guide = HeritageGuide(
        user_id=(current_user or {}).get("id"),
        full_name=name,
        phone=phone,
        email=email,
        state=state,
        location=location,
        status="pending",
        availability="free",
        created_at=now,
        updated_at=now,
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)
    return {**guide_row(guide), "message": "Registration received. It will be reviewed and shared once approved."}


@router.get("/guides/me")
def get_my_guides(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Signed-in dashboard: list guide registrations owned by the current user.

    Returns the guide's own contact details so they can verify what is on file.
    """
    rows = (
        db.query(HeritageGuide)
        .filter(HeritageGuide.user_id == current_user["id"])
        .order_by(HeritageGuide.created_at.desc(), HeritageGuide.id.desc())
        .all()
    )
    return {"items": [guide_admin_row(g) for g in rows], "total": len(rows)}


@router.get("/guides/me/dashboard")
def get_my_guide_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Signed-in guide dashboard: own profile plus REAL tour statistics.

    Everything is computed from the guide_tours table — no fabricated numbers.
    A guide only ever sees their own registrations, their own availability, and
    their own assignments. Other guides are never listed here.
    """
    guide = _owned_guide(db, current_user)

    my_ids = [t.id for t in _active_tours(db, guide.id)]
    active_list = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide.id, GuideTour.status == "active")
        .order_by(GuideTour.created_at.desc(), GuideTour.id.desc())
        .all()
    )
    completed_count = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide.id, GuideTour.status == "completed")
        .count()
    )
    cancelled_count = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide.id, GuideTour.status == "cancelled")
        .count()
    )
    total_count = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide.id)
        .count()
    )

    # The most recent active tour is the guide's "Current Tour"; any further
    # active tours surface as "Upcoming".
    active_tours = [guide_tour_row(t) for t in active_list]
    current_tour = active_tours[0] if active_tours else None

    return {
        "guide": guide_admin_row(guide),
        "tours_completed": completed_count,
        "tours_cancelled": cancelled_count,
        "tours_total": total_count,
        "current_tour": current_tour,
        "upcoming_tours": active_tours[1:],
        "active_tours_count": len(active_tours),
    }


@router.patch("/guides/me")
def update_my_guide(
    payload: GuideUpdateMeIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Signed-in guide: update their own availability / location.

    Ownership is enforced server-side: the guide record must belong to the
    authenticated user. A guide cannot be set Free while they still have an
    active tour — they must end the tour first, so availability always stays a
    faithful mirror of the real assignments.
    """
    availability = (payload.availability or "").strip().lower()
    if availability not in VALID_AVAILABILITY:
        raise HTTPException(status_code=400, detail="Availability must be one of free or occupied.")

    guide = _owned_guide(db, current_user)

    active = _active_tours(db, guide.id)
    if availability == "free" and active:
        raise HTTPException(
            status_code=409,
            detail=(
                "You still have an active tour. End the current tour first — "
                "your availability will update automatically."
            ),
        )

    guide.availability = availability
    if availability == "free":
        guide.assigned_site = None
    if payload.location is not None:
        guide.location = " ".join(payload.location.split()) or None
    guide.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(guide)
    return {**guide_admin_row(guide), "message": f"You are now marked as {availability}."}


@router.delete("/guides/me")
def delete_my_guide(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Signed-in guide: permanently remove their own registration.

    Ownership is enforced server-side: the record must belong to the
    authenticated user. Any active tours are cancelled first so no broken
    assignment is left behind, then the guide disappears from every public
    site page immediately.
    """
    guide = _owned_guide(db, current_user)

    for tour in _active_tours(db, guide.id):
        tour.status = "cancelled"
        tour.updated_at = datetime.utcnow()

    removed = guide_admin_row(guide)
    db.delete(guide)
    db.commit()
    return {
        "message": f"Your registration as {removed['full_name']} has been removed.",
        "removed": removed,
    }


@router.post("/guides/tours")
def create_guide_tour(
    payload: GuideTourCreateIn,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Tourist action: book an approved, free guide for a specific site.

    Creates a real database assignment (tour) linking the tourist, the heritage
    site and the guide, then marks the guide Occupied so nobody else can book
    them for an overlapping active tour. Signed-in tourists are recorded by
    their Supabase user id; anonymous tourists get a unique tour token so they
    can remove/change the guide later without revealing who they are.
    """
    guide = db.get(HeritageGuide, payload.guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{payload.guide_id} not found.")
    if guide.status != "approved":
        raise HTTPException(status_code=409, detail="This guide is not available for selection yet.")
    if _active_tours(db, guide.id):
        raise HTTPException(status_code=409, detail="This guide is currently occupied with another site tour.")

    site = None
    if payload.heritage_site_id:
        site = db.get(HeritageSite, payload.heritage_site_id)
        if not site:
            raise HTTPException(status_code=404, detail=f"Heritage site #{payload.heritage_site_id} not found.")

    site_name = " ".join((payload.site_name or site.name if site else payload.site_name or "").split())
    if not site_name:
        raise HTTPException(status_code=400, detail="A site name is required.")

    now = datetime.utcnow()
    tour = GuideTour(
        guide_id=guide.id,
        heritage_site_id=(site.id if site else payload.heritage_site_id),
        site_name=site_name,
        status="active",
        tourist_user_id=((current_user or {}).get("id") or None),
        tourist_name=" ".join((payload.tourist_name or "").split()) or None,
        tourist_email=((payload.tourist_email or "").strip().lower()) or None,
        tourist_phone=_normalise_phone(payload.tourist_phone) if payload.tourist_phone else None,
        created_at=now,
        updated_at=now,
    )
    db.add(tour)
    db.flush()  # assign tour.id / tour_token

    guide.availability = "occupied"
    guide.assigned_site = site_name
    guide.updated_at = now
    db.commit()
    db.refresh(tour)
    db.refresh(guide)
    return {
        "tour": guide_tour_row(tour),
        "guide": guide_admin_row(guide),
        "message": f"You are now connected with {guide.full_name}. The guide has been marked occupied.",
    }


@router.get("/guides/tours/active")
def get_active_tour(
    heritage_site_id: int | None = Query(default=None),
    tour_token: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """The tourist's active tour (if any) for a site.

    Lets the heritage page re-render the "Selected Guide → Remove Guide" state
    on reload. Matches either the authenticated tourist's user id or the tour
    token kept for anonymous visitors.
    """
    user_id = (current_user or {}).get("id")
    q = db.query(GuideTour).filter(GuideTour.status == "active")
    if user_id and tour_token:
        q = q.filter(or_(GuideTour.tourist_user_id == user_id, GuideTour.tour_token == tour_token))
    elif user_id:
        q = q.filter(GuideTour.tourist_user_id == user_id)
    elif tour_token:
        q = q.filter(GuideTour.tour_token == tour_token)
    else:
        return {"tour": None, "guide": None}

    if heritage_site_id is not None:
        q = q.filter(GuideTour.heritage_site_id == heritage_site_id)

    tour = q.order_by(GuideTour.created_at.desc(), GuideTour.id.desc()).first()
    guide = db.get(HeritageGuide, tour.guide_id) if tour else None
    return {"tour": guide_tour_row(tour) if tour else None, "guide": guide_admin_row(guide) if guide else None}


@router.post("/guides/tours/{tour_id}/cancel")
def cancel_guide_tour(
    tour_id: int,
    payload: GuideTourManageIn,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Tourist action: remove/change a guide for their tour.

    Removes the assignment from the database (tour → cancelled) and, when the
    guide has no other active tour, frees them so other tourists can book. On
    every heritage page the guide immediately shows Free again.
    """
    tour = db.get(GuideTour, tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour assignment not found.")

    caller = _tour_writable(db, tour, current_user, (payload.tour_token or "").strip() or None)
    if not caller:
        raise HTTPException(status_code=403, detail="You can only manage your own tour selection.")

    if tour.status != "active":
        return {
            "tour": guide_tour_row(tour),
            "guide": guide_admin_row(db.get(HeritageGuide, tour.guide_id)) if db.get(HeritageGuide, tour.guide_id) else None,
            "message": "This tour is no longer active.",
        }

    tour.status = "cancelled"
    tour.updated_at = datetime.utcnow()

    guide = db.get(HeritageGuide, tour.guide_id)
    if guide:
        _sync_guide_availability(db, guide)
    db.commit()
    db.refresh(tour)
    if guide:
        db.refresh(guide)
    return {
        "tour": guide_tour_row(tour),
        "guide": guide_admin_row(guide) if guide else None,
        "message": "The guide is no longer assigned to this tour.",
    }


@router.post("/guides/tours/{tour_id}/complete")
def complete_guide_tour(
    tour_id: int,
    payload: GuideTourManageIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Guide/tourist action: finish an active tour.

    The tour becomes ``completed`` and contributes to the guide's real
    "Tours Completed" count. The guide is freed automatically when no other
    active tour remains.
    """
    tour = db.get(GuideTour, tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour assignment not found.")

    caller = _tour_writable(db, tour, current_user, (payload.tour_token or "").strip() or None)
    if not caller:
        raise HTTPException(status_code=403, detail="You can only manage your own tour assignment.")

    if tour.status == "completed":
        guide = db.get(HeritageGuide, tour.guide_id)
        return {
            "tour": guide_tour_row(tour),
            "guide": guide_admin_row(guide) if guide else None,
            "message": "This tour was already completed.",
        }
    if tour.status != "active":
        raise HTTPException(status_code=409, detail="Only active tours can be completed.")

    tour.status = "completed"
    tour.updated_at = datetime.utcnow()

    guide = db.get(HeritageGuide, tour.guide_id)
    if guide:
        _sync_guide_availability(db, guide)
    db.commit()
    db.refresh(tour)
    if guide:
        db.refresh(guide)
    return {
        "tour": guide_tour_row(tour),
        "guide": guide_admin_row(guide) if guide else None,
        "message": "Tour completed. The guide is now free for new visitors.",
    }


@router.post("/guides/{guide_id}/choose")
def choose_guide(
    guide_id: int,
    payload: GuideChooseIn,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Compat wrapper for the legacy single-guide selection.

    Persists the assignment as a real database tour exactly like
    ``POST /api/guides/tours``.
    """
    result = create_guide_tour(
        GuideTourCreateIn(
            guide_id=guide_id,
            heritage_site_id=None,
            site_name=payload.site_name,
        ),
        db,
        current_user,
    )
    return {**result["guide"], "message": result["message"]}


@router.post("/guides/{guide_id}/release")
def release_guide(
    guide_id: int,
    payload: GuideTourManageIn | None = None,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional),
):
    """Compat wrapper: release the assigned guide by cancelling their tour."""
    active = (
        db.query(GuideTour)
        .filter(GuideTour.guide_id == guide_id, GuideTour.status == "active")
        .order_by(GuideTour.created_at.desc())
        .all()
    )
    if not active:
        guide = db.get(HeritageGuide, guide_id)
        if guide and guide.availability != "occupied":
            return {**guide_row(guide), "message": "This guide is already free and available."}
        if guide:
            _sync_guide_availability(db, guide)
            db.commit()
            db.refresh(guide)
        else:
            raise HTTPException(status_code=404, detail=f"Heritage Guide #{guide_id} not found.")
        return {**guide_row(guide), "message": f"{guide.full_name} has been released and is available for other visitors."}

    chosen = active[0]
    token = (payload.tour_token if payload else None) or None
    if not _tour_writable(db, chosen, current_user, token):
        raise HTTPException(status_code=403, detail="You can only release a guide you selected.")

    chosen.status = "cancelled"
    chosen.updated_at = datetime.utcnow()
    guide = db.get(HeritageGuide, chosen.guide_id)
    if guide:
        _sync_guide_availability(db, guide)
    db.commit()
    if guide:
        db.refresh(guide)
    return {**guide_row(guide), "message": f"{guide.full_name} has been released and is available for other visitors."}


@router.post("/guides/{guide_id}/report")
def report_guide(
    guide_id: int,
    payload: GuideReportIn,
    db: Session = Depends(get_db),
):
    """Tourist action: report an issue with an approved Heritage Guide.

    Reports are stored for administrator review and never change the guide's
    public availability by themselves.
    """
    guide = db.get(HeritageGuide, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{guide_id} not found.")

    reason = " ".join(payload.reason.split())[:120] if payload.reason else "Other"
    details = (" ".join(payload.details.split()))[:1000] if payload.details else None
    if not reason:
        reason = "Other"

    now = datetime.utcnow()
    report = GuideReport(
        guide_id=guide.id,
        guide_name=guide.full_name,
        reason=reason,
        details=details,
        status="open",
        created_at=now,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "message": "Your report has been submitted. An administrator will review it shortly.",
        "report_id": report.id,
    }


@router.get("/guides/available")
def list_available_guides(
    state: str | None = Query(default=None, description="Site state name used to find relevant local guides"),
    location: str | None = Query(default=None, description="Free-text site location / region string"),
    db: Session = Depends(get_db),
):
    """Public list of `approved` Heritage Guides relevant to a site's location.

    Only guides with status ``approved`` are ever exposed. Matching is done
    against the site's existing state / region / location fields so visitors
    are shown local guides rather than every approved guide in India. The
    guide's availability comes straight from the database.
    """
    q = db.query(HeritageGuide).filter(HeritageGuide.status == "approved")
    guides = q.order_by(HeritageGuide.created_at.desc(), HeritageGuide.id.desc()).all()

    if not guides:
        return []

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

    def _matches(guide, site_state: str | None, site_location: str | None) -> bool:
        g_state = guide.state.strip().lower()
        g_locs = _tokens(guide.location)
        candidates = _tokens(site_state, site_location)

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

        return any(hit(v) for v in [g_state, *g_locs])

    if not state and not location:
        return [guide_row(g) for g in guides]

    filtered = [g for g in guides if _matches(g, state, location)]
    return [guide_row(g) for g in filtered]


@router.get("/admin/guides")
def list_admin_guides(
    status_filter: str | None = Query(default=None, description="pending | approved | rejected | all"),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Admin: list, filter and search Heritage Guide registrations."""
    q = db.query(HeritageGuide)
    if status_filter and status_filter.strip().lower() != "all":
        q = q.filter(HeritageGuide.status == status_filter.strip().lower())
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(or_(
            HeritageGuide.full_name.ilike(term),
            HeritageGuide.email.ilike(term),
            HeritageGuide.phone.ilike(term),
            HeritageGuide.state.ilike(term),
        ))
    total = q.count()
    items = (
        q.order_by(HeritageGuide.created_at.desc(), HeritageGuide.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": [guide_admin_row(g) for g in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


@router.patch("/admin/guides/{guide_id}")
def update_guide_status(
    guide_id: int,
    payload: GuideStatusIn,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Admin: approve or reject a Heritage Guide registration."""
    new_status = (payload.status or "").strip().lower()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Status must be one of pending, approved, or rejected.",
        )

    guide = db.get(HeritageGuide, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{guide_id} not found.")

    old_status = guide.status
    guide.status = new_status
    guide.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(guide)
    _log_admin_action(
        db,
        admin_user,
        "APPROVE" if new_status == "approved" else ("REJECT" if new_status == "rejected" else "UPDATE"),
        str(guide.id),
        {"old_status": old_status, "new_status": new_status, "full_name": guide.full_name, "state": guide.state},
    )
    return {**guide_admin_row(guide), "message": f"Guide status updated to {new_status}."}


@router.delete("/admin/guides/{guide_id}")
def delete_guide(
    guide_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Admin: permanently remove a Heritage Guide registration.

    Active tours are cancelled first so no broken assignment is left behind,
    then the guide disappears from every public site page immediately.
    """
    guide = db.get(HeritageGuide, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Heritage Guide #{guide_id} not found.")

    active = _active_tours(db, guide.id)
    for tour in active:
        tour.status = "cancelled"
        tour.updated_at = datetime.utcnow()

    removed = {
        "id": guide.id,
        "full_name": guide.full_name,
        "state": guide.state,
        "status": guide.status,
        "email": guide.email,
        "phone": guide.phone,
    }
    db.delete(guide)
    db.commit()
    _log_admin_action(
        db,
        admin_user,
        "DELETE",
        str(removed["id"]),
        {"full_name": removed["full_name"], "state": removed["state"], "prior_status": removed["status"], "cancelled_tours": len(active)},
    )
    return {"message": f"Heritage Guide #{removed['id']} ({removed['full_name']}) has been removed.", "removed": removed}