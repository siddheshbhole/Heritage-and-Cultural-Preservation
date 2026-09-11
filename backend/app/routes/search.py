from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..search_engine import search as search_db, suggest as suggest_db

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
def search(
    q: str = Query(..., min_length=1),
    kind: str | None = None,
    state_id: int | None = None,
    city_id: int | None = None,
    heritage_type: str | None = None,
    period: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Intent-aware heritage search with entity extraction, weighted
    relevance scoring, match reasons and "Did you mean?" fallback."""
    return search_db(
        db,
        q,
        kind=kind,
        state_id=state_id,
        city_id=city_id,
        heritage_type=heritage_type,
        period=period,
        limit=limit,
        offset=offset,
    )


@router.get("/search/suggest")
def search_suggest(
    q: str = Query(..., min_length=1, max_length=80),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Fast autocomplete suggestions over site names, categories, locations
    and popular search phrases."""
    return suggest_db(db, q, limit=limit)