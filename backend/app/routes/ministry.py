"""Ministry of Culture "About the Ministry" homepage section API.

The database (``ministry_profile`` + ``ministry_leaders``) is the source of
truth for the homepage About-the-Ministry section. ``GET /api/ministry`` returns
current official facts (mission/vision text, organisation stats, leadership) so
the facts can be refreshed centrally whenever the Ministry updates its own
site, without any frontend code change.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MinistryLeader, MinistryProfile
from ..serializers import ministry_row

router = APIRouter(prefix="/api", tags=["ministry"])


@router.get("/ministry")
def get_ministry(db: Session = Depends(get_db)):
    profile = (
        db.query(MinistryProfile).order_by(MinistryProfile.id.asc()).first()
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Ministry profile not seeded yet")
    leaders = (
        db.query(MinistryLeader)
        .order_by(MinistryLeader.sort_order.asc(), MinistryLeader.id.asc())
        .all()
    )
    return ministry_row(profile, leaders)