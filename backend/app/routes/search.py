import re

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Author, City, Commemoration, Document, Event, HeritageSite, Museum,
    Publication, Scheme, State,
)
from ..serializers import (
    author_row, city_row, commemoration_row, document_row, event_row,
    heritage_row, museum_row, publication_row, scheme_row,
)

router = APIRouter(prefix="/api", tags=["search"])


def _tokens(term: str):
    stop = {"in", "to", "near", "the", "a", "an", "and", "of", "at", "for", "with", "on", "about", "best", "what", "where", "find"}
    return [w for w in re.sub(r"[^a-z0-9 ]", " ", term.lower()).split() if w and w not in stop]


def _match(tokens: list, *fields):
    """Return a closeness score (0 = no match) for a set of fields."""
    text = " ".join(f or "" for f in fields).lower()
    hits = 0
    for t in tokens:
        if t in text:
            hits += 1
    if hits == 0:
        return 0
    return hits + (len(tokens) - hits) / 10


@router.get("/search")
def search(
    q: str = Query(..., min_length=1),
    kind: str | None = None,
    state_id: int | None = None,
    city_id: int | None = None,
    db: Session = Depends(get_db),
):
    tokens = _tokens(q.strip())
    if not tokens:
        return {"query": q, "total": 0, "results": []}
    results: list[dict] = []

    def push(item_type: str, label: str, summary: str, row: dict, score: float):
        results.append({
            "type": item_type,
            "label": label,
            "summary": summary,
            "data": row,
            "rank": score,
        })

    def eligible(kind: str | None, item_type: str) -> bool:
        return kind is None or kind == item_type or kind == item_type + "s"

    # States / cities
    if eligible(kind, "state"):
        for s in db.query(State).order_by(State.name).all():
            score = _match(tokens, s.name, s.capital, s.description, s.history)
            if score:
                push("state", s.name, (s.description or "")[:160], {"id": s.id, "code": s.code, "region": s.region, "capital": s.capital}, score * 1.2)

    if eligible(kind, "city"):
        for c in db.query(City).order_by(City.name).all():
            score = _match(tokens, c.name, c.description, c.history, c.state.name if c.state else "")
            if score:
                push("city", c.name, (c.description or "")[:160], city_row(c), score * 1.1)

    # Heritage sites
    if eligible(kind, "heritage"):
        qh = db.query(HeritageSite).order_by(HeritageSite.name)
        if state_id:
            qh = qh.filter(HeritageSite.state_id == state_id)
        if city_id:
            qh = qh.filter(HeritageSite.city_id == city_id)
        for h in qh.all():
            score = _match(tokens, h.name, h.description, h.history, h.significance, h.category, h.location, h.architecture)
            if score:
                push("heritage", h.name, (h.description or "")[:160], heritage_row(h), score * 1.4)

    # Museums
    if eligible(kind, "museum"):
        for m in db.query(Museum).all():
            score = _match(tokens, m.name, m.description, m.collections, m.location)
            if score:
                push("museum", m.name, (m.description or "")[:160], museum_row(m), score * 1.1)

    # Publications
    if eligible(kind, "publication"):
        for p in db.query(Publication).all():
            author = db.get(Author, p.author_id).name if p.author_id else None
            score = _match(tokens, p.title, p.subject, p.language, p.description, author)
            if score:
                push("publication", p.title, (p.description or f"{author or 'Unknown'} · {p.year}")[:160], publication_row(p), score * 1.3)

    # Authors
    if eligible(kind, "author"):
        for a in db.query(Author).all():
            score = _match(tokens, a.name, a.field, a.biography, a.period, a.institutions)
            if score:
                push("author", a.name, a.field or a.period or (a.biography or "")[:160], author_row(a), score * 1.2)

    # Events
    if eligible(kind, "event"):
        for e in db.query(Event).all():
            score = _match(tokens, e.name, e.category, e.location, e.description, e.organizer)
            if score:
                push("event", e.name, (e.description or "")[:160], event_row(e), score * 1.2)

    # Documents
    if eligible(kind, "document"):
        for d in db.query(Document).all():
            score = _match(tokens, d.title, d.doc_type, d.organization, d.description)
            if score:
                push("document", d.title, (d.description or "")[:160], document_row(d), score)

    # Schemes
    if eligible(kind, "scheme"):
        for sc in db.query(Scheme).all():
            score = _match(tokens, sc.name, sc.category, sc.description, sc.organization)
            if score:
                push("scheme", sc.name, (sc.description or "")[:160], scheme_row(sc), score)

    # Commemorations
    if eligible(kind, "commemoration"):
        for cm in db.query(Commemoration).all():
            score = _match(tokens, cm.name, cm.field, cm.contribution, cm.period, cm.significance)
            if score:
                push("commemoration", cm.name, cm.field or "Personality", commemoration_row(cm), score)

    results.sort(key=lambda r: r["rank"], reverse=True)
    results = results[:60]
    return {"query": q, "total": len(results), "results": results}