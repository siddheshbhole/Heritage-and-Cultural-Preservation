from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import HeritageCategory, HeritageSite
from ..serializers import heritage_category_row, heritage_row

router = APIRouter(prefix="/api", tags=["heritage"])


def _site_row(h, db: Session = None):
    data = heritage_row(h)
    if db is not None:
        data["city_name"] = h.city.name if h.city else None
        data["state_name"] = h.state.name if h.state else None
    return data


def _category(db: Session, kind: str, slug: str):
    cat = (
        db.query(HeritageCategory)
        .filter(HeritageCategory.kind == kind, HeritageCategory.slug == slug)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Heritage category not found")
    return cat


def _sites(db: Session, **filters):
    q = db.query(HeritageSite).filter_by(**filters)
    return [_site_row(h, db) for h in q.order_by(HeritageSite.name).all()]


@router.get("/heritage/categories")
def list_categories(
    kind: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(HeritageCategory)
    if kind:
        q = q.filter(HeritageCategory.kind == kind)
    cats = q.order_by(HeritageCategory.display_order).all()
    counts = _category_counts(db)
    return [heritage_category_row(c, counts.get((c.kind, c.slug), 0)) for c in cats]


@router.get("/heritage/tangible")
def list_tangible(
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(HeritageSite).filter(HeritageSite.heritage_type == "tangible")
    if q:
        query = query.filter(HeritageSite.name.ilike(f"%{q}%"))
    return [_site_row(h, db) for h in query.order_by(HeritageSite.name).all()]


@router.get("/heritage/tangible/{category}")
def list_tangible_category(category: str, db: Session = Depends(get_db)):
    cat = _category(db, "tangible", category)
    sites = _sites(db, heritage_type="tangible", category=category)
    return {"category": heritage_category_row(cat, len(sites)), "sites": sites}


@router.get("/heritage/intangible")
def list_intangible(db: Session = Depends(get_db)):
    return _sites(db, heritage_type="intangible")


@router.get("/heritage/intangible/{art_form}")
def list_intangible_art_form(art_form: str, db: Session = Depends(get_db)):
    cat = _category(db, "intangible", art_form)
    sites = _sites(db, heritage_type="intangible", category=art_form)
    return {"category": heritage_category_row(cat, len(sites)), "sites": sites}


@router.get("/heritage/world")
def list_world(
    q: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(HeritageSite).filter(HeritageSite.heritage_type == "world")
    if q:
        query = query.filter(HeritageSite.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(HeritageSite.unesco_category == category)
    return [_site_row(h, db) for h in query.order_by(HeritageSite.unesco_year).all()]


def _category_counts(db: Session) -> dict[tuple, int]:
    from sqlalchemy import func

    counts: dict[tuple, int] = {}
    rows = (
        db.query(HeritageSite.heritage_type, HeritageSite.category, func.count(HeritageSite.id))
        .filter(HeritageSite.category.isnot(None))
        .group_by(HeritageSite.heritage_type, HeritageSite.category)
        .all()
    )
    for htype, category, n in rows:
        counts[(htype, category)] = n
    return counts