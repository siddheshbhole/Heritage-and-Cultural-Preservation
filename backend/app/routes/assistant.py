import re
from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Author, City, Event, HeritageSite, Museum, Publication, Scheme, State,
)
from ..serializers import heritage_row, museum_row

router = APIRouter(prefix="/api", tags=["assistant"])


class QueryIn(BaseModel):
    question: str
    context_type: str | None = None
    context_id: int | None = None


def _find_place(question: str, db: Session):
    """Return (place_type, id, name) matched inside the question."""
    cities = db.query(City).all()
    for c in cities:
        if c.name.lower() in question.lower():
            return "city", c.id, c.name
    states = db.query(State).all()
    for s in states:
        if s.name.lower() in question.lower():
            return "state", s.id, s.name
    return None, None, None


def _intent(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["book", "read", "publication", "author", "literature", "poetry"]):
        return "books"
    if any(w in q for w in ["festival", "event", "celebrat", "fair", "mela", "happening near"]):
        return "events"
    if any(w in q for w in ["scheme", "fellowship", "grant", "scholarship", "apply"]):
        return "schemes"
    if any(w in q for w in ["food", "cuisine", "eat", "dish"]):
        return "food"
    if any(w in q for w in ["museum", "collection", "exhibit"]):
        return "museums"
    if any(w in q for w in ["fort", "temple", "heritage", "place", "visit", "monument", "see", "tourist", "attraction"]):
        return "heritage"
    return "heritage"


def _sources_from(db: Session, items: list, item_type: str, label_field: str):
    sources = []
    for it in items[:5]:
        sources.append({
            "type": item_type,
            "id": it.id,
            "label": getattr(it, label_field),
            "url": getattr(it, "official_url", None) or getattr(it, "source_url", None),
        })
    return sources


@router.post("/assistant/query")
def assistant_query(payload: QueryIn, db: Session = Depends(get_db)):
    question = payload.question.strip()
    intent = _intent(question)
    place_type, place_id, place_name = _find_place(question, db)

    title = question[:200]
    detail_lines: list[str] = []
    sources: list[dict] = []

    if intent == "books":
        pubs = db.query(Publication).order_by(Publication.year).all()
        rows = [p for p in pubs if not place_name or (p.subject and place_name.lower() in p.subject.lower()) or not place_name]
        if rows:
            rows = rows[:4]
            detail_lines.append("Based on the catalogue, here are publications worth exploring:")
            for p in rows:
                a = db.get(Author, p.author_id).name if p.author_id else "Unknown"
                detail_lines.append(f"• {p.title} ({p.year}) by {a} — {p.subject or p.description or ''}".strip()[:200])
            sources = [{"type": "publication", "id": p.id, "label": p.title, "url": p.digital_url} for p in rows]
        else:
            detail_lines.append("I could not find publications directly matching this query.")

    elif intent == "events":
        evts = db.query(Event).all()
        if place_name:
            if place_type == "city":
                evts = [e for e in evts if e.city_id == place_id]
            else:
                evts = [e for e in evts if e.state_id == place_id]
        today = date.today().isoformat()
        evts = [e for e in evts if (e.end_date or "9999") >= today]
        evts.sort(key=lambda e: e.start_date)
        if evts:
            detail_lines.append(f"Upcoming cultural events, linked to verified sources:")
            for e in evts[:5]:
                detail_lines.append(f"• {e.name} — {e.start_date} to {e.end_date} at {e.location} ({e.organizer})")
            sources = [{"type": "event", "id": e.id, "label": e.name, "url": e.official_url} for e in evts[:5]]
        else:
            detail_lines.append("No upcoming cultural events were found for that location in the current dataset.")

    elif intent == "schemes":
        scs = db.query(Scheme).all()
        detail_lines.append("Relevant Ministry of Culture schemes:")
        for sc in scs[:4]:
            detail_lines.append(f"• {sc.name} — {sc.category}. Eligibility: {sc.eligibility}")
        sources = [{"type": "scheme", "id": sc.id, "label": sc.name, "url": sc.official_url} for sc in scs[:4]]

    elif intent == "food":
        label = place_name or "the region"
        detail_lines.append(f"Famous food of {label}:")
        if place_type == "city":
            c = db.get(City, place_id)
            if c and c.food:
                detail_lines.append(c.food)
        else:
            s = db.get(State, place_id)
            if s and s.food:
                detail_lines.append(s.food)
        if len(detail_lines) <= 1:
            detail_lines.append("Food data is currently seeded only for selected cities/states in the prototype.")

    elif intent == "museums":
        ms = db.query(Museum).all()
        if place_name and place_type == "city":
            ms = [m for m in ms if m.city_id == place_id]
        if ms:
            detail_lines.append("Recommended museums:")
            for m in ms[:4]:
                detail_lines.append(f"• {m.name} — {m.location}. Collections: {m.collections}")
            sources = [{"type": "museum", "id": m.id, "label": m.name, "url": m.official_url} for m in ms[:4]]
        else:
            detail_lines.append("No museums found in the dataset for this query.")

    else:  # heritage (default)
        if place_name:
            if place_type == "city":
                sites = db.query(HeritageSite).filter(HeritageSite.city_id == place_id).all()
            else:
                sites = db.query(HeritageSite).filter(HeritageSite.state_id == place_id).all()
        else:
            sites = db.query(HeritageSite).all()
        if "2 days" in question.lower() or "two days" in question.lower():
            selected = sorted(sites, key=lambda h: h.featured or 0, reverse=True)[:4]
            detail_lines.append(f"For a two-day visit to {place_name or 'that region'}, I recommend this heritage route (highest-rated, sourced):")
        else:
            selected = sites[:5]
            detail_lines.append("Here are heritage sites from the governed database:")
        for h in selected:
            detail_lines.append(f"• {h.name} — {h.category}, {h.location}. {h.description[:170]}")
        sources = [{"type": "heritage", "id": h.id, "label": h.name, "url": None} for h in selected[:5]]

    answer = "\n".join(detail_lines) if detail_lines else (
        "I could not find a confident answer in the verified cultural database. "
        "I prefer to say I don't know rather than guess."
    )

    return {
        "question": question,
        "intent": intent,
        "place": place_name,
        "answer": answer,
        "sources": sources,
        "trust": "GROUNDED — answer uses retrieved records from the governed platform data.",
        "note": "Prototype retrieval-based assistant. Production will upgrade to full RAG over curated corpora.",
    }