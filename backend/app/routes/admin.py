import json
import os
import time
from collections import Counter
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_jwks_url, get_supabase_url, require_admin
from ..database import get_db
from ..serializers import post_row
from ..models import (
    AuditLog,
    City,
    CommunityPost,
    DocumentCategory,
    DocumentItem,
    Event,
    GuideProfile,
    GuideReport,
    GuideReview,
    HeritageCategory,
    HeritageSite,
    MediaAlbum,
    MediaArtist,
    MediaBrochure,
    MediaEvent,
    MediaLeader,
    MediaMonument,
    MediaNews,
    MediaSanskriti,
    MediaVideo,
    MediaWebcast,
    Museum,
    Provenance,
    State,
    TourAssignment,
    TrendingItem,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Heritage categories that describe ritual practice, ceremony or oral tradition.
# Compared case-insensitively because the seeded catalogue contains mixed-case
# duplicates such as "natural" and "Natural".
RITUAL_HERITAGE_CATEGORIES = (
    "rituals-traditions",
    "festivals-cultural-practices",
    "oral-traditions",
)


class StatusUpdateIn(BaseModel):
    status: str  # APPROVED | REJECTED | PENDING


@router.get("/session")
def get_admin_session(current_user: dict = Depends(get_current_user)):
    """Report whether the caller's verified token carries administrative rights.

    The frontend uses this as the single source of truth for showing the admin
    portal, so the ADMIN_EMAILS whitelist and the app_metadata/user_metadata role
    claims are evaluated in exactly one place: here, from a verified token. Any
    client-side guess would drift from the checks that actually guard the routes.
    """
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "is_admin": current_user["is_admin"],
    }


def _log_admin_action(db: Session, admin_user: dict, action: str, record_id: str, details: dict):
    try:
        log = AuditLog(
            user_id=admin_user.get("id", "admin"),
            user_email=admin_user.get("email", ""),
            action=action,
            model_name="community_posts",
            record_id=str(record_id),
            details=json.dumps(details, default=str),
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed audit log: {e}")
        db.rollback()


@router.get("/posts")
def list_admin_posts(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """List all community posts for moderation with optional status filtering."""
    q = db.query(CommunityPost)
    if status_filter and status_filter.upper() != "ALL":
        q = q.filter(CommunityPost.status == status_filter.upper())
    
    posts = q.order_by(CommunityPost.created_at.desc(), CommunityPost.id.desc()).all()
    rows = [post_row(p) for p in posts]
    
    for r in rows:
        prov = db.query(Provenance).filter(
            Provenance.resource_type == "community_post",
            Provenance.resource_id == r["id"],
        ).first()
        r["provenance"] = {
            "organization": prov.organization if prov else "Community",
            "rights_status": prov.rights_status if prov else "CC-BY 4.0",
            "verification_status": prov.verification_status if prov else "Pending moderation",
        }
    return rows


@router.patch("/posts/{post_id}")
def update_post_status(
    post_id: int,
    payload: StatusUpdateIn,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Update moderation status of a community post."""
    new_status = payload.status.upper()
    if new_status not in ("APPROVED", "REJECTED", "PENDING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of APPROVED, REJECTED, or PENDING.",
        )

    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community post #{post_id} not found.",
        )

    old_status = post.status
    post.status = new_status
    
    # Update provenance status
    prov = db.query(Provenance).filter(
        Provenance.resource_type == "community_post",
        Provenance.resource_id == post.id,
    ).first()
    if prov:
        prov.verification_status = "Approved by admin" if new_status == "APPROVED" else f"Status: {new_status}"

    db.commit()
    db.refresh(post)
    _log_admin_action(db, admin_user, new_status, str(post_id), {"old_status": old_status, "new_status": new_status, "title": post.title})
    return {**post_row(post), "message": f"Post status updated to {new_status}."}


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Delete a community post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community post #{post_id} not found.",
        )

    old_data = {"title": post.title, "author_name": post.author_name, "kind": post.kind}
    # Delete provenance record
    db.query(Provenance).filter(
        Provenance.resource_type == "community_post",
        Provenance.resource_id == post.id,
    ).delete()

    db.delete(post)
    db.commit()
    _log_admin_action(db, admin_user, "DELETE", str(post_id), old_data)
    return {"message": f"Post #{post_id} has been deleted."}


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Get comprehensive platform overview statistics.

    Every value is an exact integer row count so the dashboard never has to
    render a placeholder for a metric that is simply zero.
    """

    def count(model, *filters) -> int:
        """Count rows of ``model``, applying each filter.

        A filter is either a ``(column, value)`` pair for equality or a bare
        SQLAlchemy expression when the condition needs more than one column.
        """
        q = db.query(model)
        for flt in filters:
            if isinstance(flt, tuple):
                q = q.filter(flt[0] == flt[1])
            else:
                q = q.filter(flt)
        return int(q.count())

    total_posts = count(CommunityPost)
    pending_posts = count(CommunityPost, (CommunityPost.status, "PENDING"))
    approved_posts = count(CommunityPost, (CommunityPost.status, "APPROVED"))
    rejected_posts = count(CommunityPost, (CommunityPost.status, "REJECTED"))

    heritage_sites = count(HeritageSite)
    tangible_sites = count(HeritageSite, (HeritageSite.heritage_type, "tangible"))
    intangible_sites = count(HeritageSite, (HeritageSite.heritage_type, "intangible"))
    world_sites = count(HeritageSite, (HeritageSite.heritage_type, "world"))
    unclassified_sites = max(
        heritage_sites - (tangible_sites + intangible_sites + world_sites), 0
    )
    world_unesco = count(HeritageSite, (HeritageSite.unesco_status, "WORLD"))
    # 360 virtual tours are only rendered for sites carrying a Street View link.
    virtual_tours_count = int(
        db.query(HeritageSite)
        .filter(HeritageSite.google_360_url.isnot(None), HeritageSite.google_360_url != "")
        .count()
    )
    categories_count = count(HeritageCategory)
    audit_logs_count = count(AuditLog)
    states_count = count(State)
    cities_count = count(City)
    documents_count = count(DocumentItem)
    doc_categories_count = count(DocumentCategory)
    museums_count = count(Museum)
    events_count = count(Event)
    trending_count = count(TrendingItem)

    media_breakdown = {
        "news": count(MediaNews),
        "albums": count(MediaAlbum),
        "videos": count(MediaVideo),
        "brochures": count(MediaBrochure),
        "leaders": count(MediaLeader),
        "monuments": count(MediaMonument),
        "artists": count(MediaArtist),
        "sanskriti": count(MediaSanskriti),
        "events": count(MediaEvent),
        "webcasts": count(MediaWebcast),
    }
    media_count = sum(media_breakdown.values())

    guide_profiles_count = count(GuideProfile)
    guides_available_count = count(GuideProfile, (GuideProfile.availability, "open_to_work"))
    tour_assignments_count = count(TourAssignment)
    active_tours_count = count(TourAssignment, (TourAssignment.status, "active"))
    completed_tours_count = count(TourAssignment, (TourAssignment.status, "completed"))
    guide_reviews_count = count(GuideReview)
    open_guide_reports_count = count(GuideReport, (GuideReport.status, "open"))

    # Culture and ritual coverage. ``Event.event_type`` is the only structured
    # culture/ritual classification in the schema, so it drives the "Cultural
    # Records" and "Ritual Events" figures. Ritual practice also lives on the
    # heritage catalogue as categories, tracked separately so neither number
    # hides behind a single blended total.
    culture_events_count = count(Event, (Event.event_type, "culture"))
    ritual_events_count = count(Event, (Event.event_type, "ritual"))
    ritual_heritage_count = count(
        HeritageSite,
        func.lower(HeritageSite.category).in_(RITUAL_HERITAGE_CATEGORIES),
    )

    return {
        # Community moderation
        "total_posts": total_posts,
        "pending_posts": pending_posts,
        "approved_posts": approved_posts,
        "rejected_posts": rejected_posts,
        # Heritage
        "heritage_sites": heritage_sites,
        "tangible_sites": tangible_sites,
        "intangible_sites": intangible_sites,
        "world_sites": world_sites,
        "unclassified_sites": unclassified_sites,
        "world_unesco_sites": world_unesco,
        "virtual_tours_count": virtual_tours_count,
        "categories_count": categories_count,
        # Geography
        "states_count": states_count,
        "cities_count": cities_count,
        # Archives & discovery
        "documents_count": documents_count,
        "doc_categories_count": doc_categories_count,
        "museums_count": museums_count,
        "events_count": events_count,
        "trending_count": trending_count,
        "culture_events_count": culture_events_count,
        "ritual_events_count": ritual_events_count,
        "ritual_heritage_count": ritual_heritage_count,
        "media_count": media_count,
        "media_breakdown": media_breakdown,
        # Guide system
        "guide_profiles_count": guide_profiles_count,
        "guides_available_count": guides_available_count,
        "tour_assignments_count": tour_assignments_count,
        "active_tours_count": active_tours_count,
        "completed_tours_count": completed_tours_count,
        "guide_reviews_count": guide_reviews_count,
        "open_guide_reports_count": open_guide_reports_count,
        # Governance
        "audit_logs_count": audit_logs_count,
    }


@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Return analytics breakdowns for heritage sites, categories, moderation, and activity."""
    # Heritage sites by category
    sites_by_category = dict(
        db.query(HeritageSite.category, func.count(HeritageSite.id))
        .group_by(HeritageSite.category)
        .all()
    )

    # Heritage sites by UNESCO status
    sites_by_unesco = dict(
        db.query(HeritageSite.unesco_status, func.count(HeritageSite.id))
        .filter(HeritageSite.unesco_status.isnot(None))
        .group_by(HeritageSite.unesco_status)
        .all()
    )

    # Heritage sites by heritage_type
    sites_by_type = dict(
        db.query(HeritageSite.heritage_type, func.count(HeritageSite.id))
        .filter(HeritageSite.heritage_type.isnot(None))
        .group_by(HeritageSite.heritage_type)
        .all()
    )

    # Heritage sites by state (top 15)
    sites_by_state = dict(
        db.query(State.name, func.count(HeritageSite.id))
        .join(State, HeritageSite.state_id == State.id)
        .group_by(State.name)
        .order_by(func.count(HeritageSite.id).desc())
        .limit(15)
        .all()
    )

    # Heritage categories breakdown
    categories_breakdown = dict(
        db.query(HeritageCategory.kind, func.count(HeritageCategory.id))
        .group_by(HeritageCategory.kind)
        .all()
    )

    # Moderation activity breakdown
    moderation_breakdown = {
        "approved": db.query(CommunityPost).filter(CommunityPost.status == "APPROVED").count(),
        "pending": db.query(CommunityPost).filter(CommunityPost.status == "PENDING").count(),
        "rejected": db.query(CommunityPost).filter(CommunityPost.status == "REJECTED").count(),
    }

    # Recent audit activity (last 20 entries)
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(20)
        .all()
    )
    recent_activity = [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "user_email": l.user_email,
            "action": l.action,
            "model_name": l.model_name,
            "record_id": l.record_id,
        }
        for l in recent_logs
    ]

    # Document categories distribution
    doc_categories = dict(
        db.query(DocumentCategory.name, func.count(DocumentItem.id))
        .join(DocumentItem, DocumentItem.category == DocumentCategory.slug)
        .group_by(DocumentCategory.name)
        .all()
    )

    # Media asset counts by type
    media_breakdown = {
        "news": db.query(MediaNews).count(),
        "albums": db.query(MediaAlbum).count(),
        "videos": db.query(MediaVideo).count(),
        "brochures": db.query(MediaBrochure).count(),
        "leaders": db.query(MediaLeader).count(),
        "monuments": db.query(MediaMonument).count(),
        "artists": db.query(MediaArtist).count(),
        "sanskriti": db.query(MediaSanskriti).count(),
        "events": db.query(MediaEvent).count(),
        "webcasts": db.query(MediaWebcast).count(),
    }

    return {
        "sites_by_category": sites_by_category,
        "sites_by_unesco": sites_by_unesco,
        "sites_by_type": sites_by_type,
        "sites_by_state": sites_by_state,
        "categories_breakdown": categories_breakdown,
        "moderation_breakdown": moderation_breakdown,
        "recent_activity": recent_activity,
        "doc_categories": doc_categories,
        "media_breakdown": media_breakdown,
    }


@router.get("/users")
def get_admin_users(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Return user activity summaries based on community post authors."""
    # Aggregate post counts per author
    author_stats = (
        db.query(
            CommunityPost.author_name,
            func.count(CommunityPost.id).label("total_posts"),
        )
        .group_by(CommunityPost.author_name)
        .order_by(func.count(CommunityPost.id).desc())
        .all()
    )

    users = []
    for author_name, total_posts in author_stats:
        approved = (
            db.query(CommunityPost)
            .filter(CommunityPost.author_name == author_name, CommunityPost.status == "APPROVED")
            .count()
        )
        pending = (
            db.query(CommunityPost)
            .filter(CommunityPost.author_name == author_name, CommunityPost.status == "PENDING")
            .count()
        )
        rejected = (
            db.query(CommunityPost)
            .filter(CommunityPost.author_name == author_name, CommunityPost.status == "REJECTED")
            .count()
        )
        # Get latest post date
        latest = (
            db.query(CommunityPost.created_at)
            .filter(CommunityPost.author_name == author_name)
            .order_by(CommunityPost.created_at.desc())
            .first()
        )
        users.append({
            "author_name": author_name,
            "total_posts": total_posts,
            "approved_posts": approved,
            "pending_posts": pending,
            "rejected_posts": rejected,
            "last_active": latest[0] if latest else None,
        })

    # Also check for supabase_user_id based users
    user_id_posts = (
        db.query(
            CommunityPost.supabase_user_id,
            func.count(CommunityPost.id).label("total"),
        )
        .filter(CommunityPost.supabase_user_id.isnot(None))
        .group_by(CommunityPost.supabase_user_id)
        .all()
    )

    return {
        "authors": users,
        "total_unique_authors": len(users),
        "supabase_users_with_posts": len(user_id_posts),
    }


# ---------------------------------------------------------------------------
# System status
# ---------------------------------------------------------------------------
# ``GET /api/health`` is intentionally a static liveness stub. The status panel
# in the admin portal has to report *measured* signals, so this endpoint probes
# the real dependencies instead. Anything that cannot be checked is reported as
# ``unavailable`` rather than optimistically marked healthy.


def _check(name: str, label: str, probe, detail_fn) -> dict:
    """Run one dependency probe, recording latency and any failure detail."""

    started = time.perf_counter()
    try:
        probe()
        status, detail = "operational", detail_fn()
    except Exception as exc:  # pragma: no cover - depends on live infrastructure
        status = "down"
        detail = f"{type(exc).__name__}: {exc}".strip()
    return {
        "name": name,
        "label": label,
        "status": status,
        "detail": detail,
        "latency_ms": round((time.perf_counter() - started) * 1000, 1),
    }


@router.get("/health")
def get_admin_health(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(require_admin),
):
    """Report measured platform health for the admin system status panel.

    Each signal is produced by actually touching the dependency. Configuration
    that is absent is surfaced as ``unavailable`` with the reason, so an
    unconfigured integration is never displayed as a working one.
    """

    def probe_database():
        db.execute(text("SELECT 1")).scalar()

    checks = [
        _check("database", "Database", probe_database,
               lambda: "Connection and query round-trip successful"),
    ]

    # Authentication: report which verification path the server can actually use.
    supabase_url = get_supabase_url()
    jwt_secret = bool(os.getenv("SUPABASE_JWT_SECRET", "").strip())
    jwks_url = get_jwks_url()
    if jwt_secret:
        auth_detail = "HS256 verification via SUPABASE_JWT_SECRET"
    elif supabase_url:
        auth_detail = f"Asymmetric verification via {jwks_url}"
    else:
        auth_detail = "Not configured: set SUPABASE_URL or SUPABASE_JWT_SECRET"
    checks.append(
        {
            "name": "authentication",
            "label": "Authentication",
            "status": "operational" if (jwt_secret or supabase_url) else "unavailable",
            "detail": auth_detail,
            "latency_ms": 0.0,
        }
    )

    # Supabase Storage is optional; the platform serves local media instead.
    storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "").strip()
    checks.append(
        {
            "name": "storage",
            "label": "Media storage",
            "status": "operational" if storage_bucket else "unavailable",
            "detail": (
                f"Supabase Storage bucket '{storage_bucket}'"
                if storage_bucket
                else "Serving bundled local media; no Supabase Storage bucket configured"
            ),
            "latency_ms": 0.0,
        }
    )

    statuses = {check["status"] for check in checks}
    if "down" in statuses:
        overall = "degraded"
    elif "unavailable" in statuses:
        overall = "partial"
    else:
        overall = "operational"

    return {
        "status": overall,
        "checks": checks,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }