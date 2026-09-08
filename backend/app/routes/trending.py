"""Trending heritage & culture API.

The database (``trending_items``) is the source of truth for the homepage
trending carousel. ``GET /api/trending`` returns only active items sorted by
``trend_score``, so the frontend can render whatever is current without any
code change when the cultural landscape shifts.

A scheduled updater (see :func:`refresh_trending`) periodically re-scores and
rotates items. For the prototype it recomputes scores from stored seed signals;
in production it can fetch official sources (MoC / ASI / UNESCO / IGNCA / state
cultural departments), register new items, decay outdated ones and deactivate
them — all behind the same ``GET /api/trending`` contract.
"""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TrendingItem
from ..serializers import trending_row

router = APIRouter(prefix="/api", tags=["trending"])

# Weighting used to derive trend_score from component signals (0-100 each).
WEIGHTS = {
    "current_event": 0.35,
    "recent_activity": 0.25,
    "cultural_significance": 0.20,
    "user_interest": 0.10,
    "recency": 0.10,
}


def compute_trend_score(item: TrendingItem) -> float:
    """Combine per-signal scores into the single trending score."""
    score = (
        (item.current_event_score or 0.0) * WEIGHTS["current_event"]
        + (item.recent_activity_score or 0.0) * WEIGHTS["recent_activity"]
        + (item.cultural_significance_score or 0.0) * WEIGHTS["cultural_significance"]
        + (item.user_interest_score or 0.0) * WEIGHTS["user_interest"]
        + (item.recency_score or 0.0) * WEIGHTS["recency"]
    )
    return max(0.0, min(100.0, score))


def recompute_scores(db: Session):
    """Persist freshly computed trend_score for every active item."""
    today = date.today().isoformat()
    for item in db.query(TrendingItem).all():
        item.trend_score = compute_trend_score(item)
        item.updated_at = today
    db.commit()


def refresh_trending(db: Session):
    """Periodic updater entry point.

    For the prototype it recomputes scores and (optionally) decoys inactive
    items. Production deployments would extend this to pull live signals from
    trusted official sources before calling :func:`recompute_scores`.
    """
    recompute_scores(db)


@router.get("/trending")
def list_trending(db: Session = Depends(get_db)):
    """Return currently active trending items, best score first.

    Read-only on purpose: scoring/rotation happens in the scheduled updater
    (``app.trending_updater``), so a read never resets timestamps and never
    mutates the source of truth.
    """
    items = (
        db.query(TrendingItem)
        .filter(TrendingItem.is_active == 1)
        .order_by(TrendingItem.trend_score.desc())
        .all()
    )
    return {"items": [trending_row(i) for i in items]}
