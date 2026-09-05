from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CommunityPost, CommunityProfile, Provenance
from ..serializers import post_row

router = APIRouter(prefix="/api", tags=["community"])


class PostIn(BaseModel):
    kind: str
    title: str
    content: str
    author_name: str
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
def create_post(payload: PostIn, db: Session = Depends(get_db)):
    post = CommunityPost(
        kind=payload.kind,
        title=payload.title,
        content=payload.content,
        author_name=payload.author_name,
        related_resource=payload.related_resource,
        related_city=payload.related_city,
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