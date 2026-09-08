"""Endpoints for the Media section (Explore menu ▸ Photos / Videos / Brochure /
Bharat Beat / Sanskriti / Events / Latest News / Announcement / Webcast).

All data is seeded by :mod:`app.seed_media` from the Ministry of Culture's
official Media pages (culture.gov.in). Announcements reuse the existing
``GET /api/announcements`` endpoint.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    MediaAlbum, MediaArtist, MediaBrochure, MediaEvent, MediaLeader,
    MediaMonument, MediaNews, MediaSanskriti, MediaVideo, MediaWebcast,
)
from ..serializers import (
    media_album_row, media_artist_row, media_brochure_row, media_event_row,
    media_leader_row, media_monument_row, media_news_row, media_sanskriti_row,
    media_video_row, media_webcast_row,
)

router = APIRouter(prefix="/api/media", tags=["media"])

ARTIST_CATEGORIES = ["Dance", "Music", "Painting", "Poet", "Sculpture", "Writer"]

OFFICIAL = {
    "source_name": "Ministry of Culture, Government of India",
    "source_url": "https://culture.gov.in",
    "retrieved_at": "08.09.2026",
}


@router.get("/summary")
def media_summary(db: Session = Depends(get_db)):
    return {
        "photos": db.query(MediaAlbum).count(),
        "videos": db.query(MediaVideo).count(),
        "brochures": db.query(MediaBrochure).count(),
        "leaders": db.query(MediaLeader).count(),
        "monuments": db.query(MediaMonument).count(),
        "artists": db.query(MediaArtist).count(),
        "sanskriti": db.query(MediaSanskriti).count(),
        "events": db.query(MediaEvent).count(),
        "news": db.query(MediaNews).count(),
        "webcasts": db.query(MediaWebcast).count(),
        "webcast_live": db.query(MediaWebcast).filter(MediaWebcast.is_live == 1).count(),
        "source": OFFICIAL,
    }


@router.get("/photos")
def media_photos(
    order: str = Query("latest", pattern="^(latest|oldest)$"),
    db: Session = Depends(get_db),
):
    q = db.query(MediaAlbum)
    q = q.order_by(MediaAlbum.date.desc()) if order == "latest" else q.order_by(MediaAlbum.date.asc())
    return [media_album_row(a) for a in q.all()]


@router.get("/videos")
def media_videos(
    language: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(MediaVideo)
    if language:
        q = q.filter(MediaVideo.language == language)
    return [media_video_row(v) for v in q.order_by(MediaVideo.date.desc()).all()]


@router.get("/brochures")
def media_brochures(db: Session = Depends(get_db)):
    return [media_brochure_row(b) for b in db.query(MediaBrochure).order_by(MediaBrochure.display_order).all()]


@router.get("/leaders")
def media_leaders(db: Session = Depends(get_db)):
    return {
        "items": [media_leader_row(l) for l in db.query(MediaLeader).order_by(MediaLeader.display_order).all()],
        "source": OFFICIAL,
    }


@router.get("/leaders/{slug}")
def media_leader(slug: str, db: Session = Depends(get_db)):
    item = db.query(MediaLeader).filter(MediaLeader.slug == slug).first()
    if not item:
        raise HTTPException(status_code=404, detail="Leader not found")
    return media_leader_row(item)


@router.get("/monuments")
def media_monuments(db: Session = Depends(get_db)):
    return [media_monument_row(m) for m in db.query(MediaMonument).order_by(MediaMonument.display_order).all()]


@router.get("/artists")
def media_artists(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(MediaArtist)
    if category:
        q = q.filter(MediaArtist.category == category)
    return {
        "categories": ARTIST_CATEGORIES,
        "items": [media_artist_row(a) for a in q.order_by(MediaArtist.display_order).all()],
        "source": OFFICIAL,
    }


@router.get("/sanskriti")
def media_sanskriti(db: Session = Depends(get_db)):
    return {
        "items": [media_sanskriti_row(s) for s in db.query(MediaSanskriti).order_by(MediaSanskriti.display_order).all()],
        "source": OFFICIAL,
    }


@router.get("/news")
def media_news(db: Session = Depends(get_db)):
    return [media_news_row(n) for n in db.query(MediaNews).order_by(MediaNews.date.desc()).all()]


@router.get("/events")
def media_events(
    q: str | None = None,
    category: str | None = None,
    state: str | None = None,
    city: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    archive: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(MediaEvent)
    if q:
        like = f"%{q}%"
        query = query.filter(
            MediaEvent.title.ilike(like)
            | MediaEvent.venue.ilike(like)
            | MediaEvent.category.ilike(like)
        )
    if category:
        query = query.filter(MediaEvent.category == category)
    if state:
        query = query.filter(MediaEvent.state == state)
    if city:
        query = query.filter(MediaEvent.city == city)
    if start_date:
        query = query.filter(MediaEvent.start_date >= start_date)
    if end_date:
        query = query.filter(MediaEvent.end_date <= end_date)
    if archive is not None:
        query = query.filter(MediaEvent.is_archive == archive)
    rows = [media_event_row(e) for e in query.order_by(MediaEvent.start_date.desc()).all()]

    today = date.today()
    days = {
        "current": sum(1 for r in rows if not r["is_archive"]),
        "past": sum(1 for r in rows if r["is_archive"]),
    }
    return {
        "items": rows,
        "days": days,
        "categories": sorted({r["category"] for r in rows}),
        "states": sorted({r["state"] for r in rows if r["state"]}),
        "cities": sorted({r["city"] for r in rows if r["city"]}),
        "today": today.isoformat(),
        "source": OFFICIAL,
    }


@router.get("/webcast")
def media_webcast(db: Session = Depends(get_db)):
    live = db.query(MediaWebcast).filter(MediaWebcast.is_live == 1).order_by(MediaWebcast.display_order).all()
    archived = db.query(MediaWebcast).filter(MediaWebcast.is_live == 0).order_by(MediaWebcast.date.desc()).all()
    return {
        "live": [media_webcast_row(w) for w in live],
        "archived": [media_webcast_row(w) for w in archived],
        "official_page": "https://culture.gov.in/webcast",
        "youtube_channel": "https://www.youtube.com/user/sanskritigoi",
        "note": "The official Ministry of Culture Webcast page currently shows: No Web Cast data available.",
        "source": OFFICIAL,
    }