import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import (
    CommunityPost, Provenance, HeritageSite, HeritageCategory, AuditLog
)
from ..serializers import post_row

router = APIRouter(prefix="/api/admin", tags=["admin"])


class StatusUpdateIn(BaseModel):
    status: str  # APPROVED | REJECTED | PENDING


def _log_admin_action(db: Session, admin_user: dict, action: str, record_id: str, details: dict):
    try:
        log = AuditLog(
            user_id=admin_user.get("sub", "admin"),
            user_email=admin_user.get("email", "admin@heritage.gov.in"),
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

    old_data = {"title": post.title, "author_name": post.author_name, "category": post.category}
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

    return {
        "total_posts": total_posts,
        "pending_posts": pending_posts,
        "approved_posts": approved_posts,
        "rejected_posts": rejected_posts,
        "heritage_sites": heritage_sites,
        "categories_count": categories_count,
        "audit_logs_count": audit_logs_count,
    }

