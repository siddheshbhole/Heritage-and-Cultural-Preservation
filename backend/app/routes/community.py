import html
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CommunityPost, CommunityProfile, Provenance
from ..serializers import post_row

router = APIRouter(prefix="/api", tags=["community"])


class PostIn(BaseModel):
    kind: str
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5, max_length=5000)
    author_name: str | None = None
    related_resource: str | None = None
    related_city: str | None = None
    image_url: str | None = None


@router.get("/community/posts")
def list_posts(kind: str | None = None, db: Session = Depends(get_db)):
    q = db.query(CommunityPost).filter(CommunityPost.status == "APPROVED")
    if kind:
        q = q.filter(CommunityPost.kind == kind)
    rows = [post_row(p) for p in q.order_by(CommunityPost.created_at.desc()).all()]
    for r in rows:
        prov = db.query(Provenance).filter(
            Provenance.resource_type == "community_post",
            Provenance.resource_id == r["id"],
        ).first()
        r["trust_level"] = "COMMUNITY"
        r["provenance"] = {
            "organization": prov.organization if prov else "Community",
            "rights_status": prov.rights_status if prov else "CC-BY 4.0",
            "verification_status": prov.verification_status if prov else "Verified by moderation",
        }
    return rows


@router.post("/community/posts")
def create_post(
    payload: PostIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Sanitize text inputs against XSS and HTML injection
    clean_title = html.escape(payload.title.strip())
    clean_content = html.escape(payload.content.strip())
    
    # Obtain verified user ID and author identity strictly from JWT claims
    user_id = current_user.get("id")
    display_author = current_user.get("name") or current_user.get("email", "Community Contributor")

    post = CommunityPost(
        kind=payload.kind,
        title=clean_title,
        content=clean_content,
        author_name=display_author,
        supabase_user_id=user_id,
        related_resource=html.escape(payload.related_resource.strip()) if payload.related_resource else None,
        related_city=html.escape(payload.related_city.strip()) if payload.related_city else None,
        image_url=payload.image_url,
        status="PENDING",
        created_at=date.today().isoformat(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    db.add(Provenance(
        resource_type="community_post",
        resource_id=post.id,
        organization="Community",
        retrieved_at=date.today().isoformat(),
        last_updated=date.today().isoformat(),
        rights_status="CC-BY 4.0",
        verification_status="Pending moderation",
    ))
    db.commit()
    return {**post_row(post), "message": "Submitted for moderation."}





@router.get("/profiles")
def list_profiles(db: Session = Depends(get_db)):
    return [
        {
            "id": p.id,
            "display_name": p.display_name,
            "bio": p.bio,
            "interests": p.interests,
            "image_url": p.image_url,
        }
        for p in db.query(CommunityProfile).all()
    ]