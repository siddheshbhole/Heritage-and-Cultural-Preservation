import json
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..serializers import post_row
from ..models import (
    AuditLog,
    Artifact,
    Discussion,
    Contribution,
    CulturalStory,
    CommunityPost,
    User,
    SiteAnalytics,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class StatusUpdateIn(BaseModel):
    status: str  # APPROVED | REJECTED | PENDING


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
    """Get comprehensive platform overview statistics."""
    total_posts = db.query(CommunityPost).count()
    pending_posts = db.query(CommunityPost).filter(CommunityPost.status == "PENDING").count()
    approved_posts = db.query(CommunityPost).filter(CommunityPost.status == "APPROVED").count()
    rejected_posts = db.query(CommunityPost).filter(CommunityPost.status == "REJECTED").count()

    heritage_sites = db.query(HeritageSite).count()
    categories_count = db.query(HeritageCategory).count()
    audit_logs_count = db.query(AuditLog).count()
    states_count = db.query(State).count()
    cities_count = db.query(City).count()
    documents_count = db.query(DocumentItem).count()
    doc_categories_count = db.query(DocumentCategory).count()
    museums_count = db.query(Museum).count()
    events_count = db.query(Event).count()
    trending_count = db.query(TrendingItem).count()

    media_count = (
        db.query(MediaNews).count()
        + db.query(MediaAlbum).count()
        + db.query(MediaVideo).count()
        + db.query(MediaBrochure).count()
        + db.query(MediaLeader).count()
        + db.query(MediaMonument).count()
        + db.query(MediaArtist).count()
        + db.query(MediaSanskriti).count()
        + db.query(MediaEvent).count()
        + db.query(MediaWebcast).count()
    )

    return {
        "total_posts": total_posts,
        "pending_posts": pending_posts,
        "approved_posts": approved_posts,
        "rejected_posts": rejected_posts,
        "heritage_sites": heritage_sites,
        "categories_count": categories_count,
        "audit_logs_count": audit_logs_count,
        "states_count": states_count,
        "cities_count": cities_count,
        "documents_count": documents_count,
        "doc_categories_count": doc_categories_count,
        "museums_count": museums_count,
        "events_count": events_count,
        "trending_count": trending_count,
        "media_count": media_count,
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

