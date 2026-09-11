import math
import os
import re
from collections import OrderedDict
from datetime import date

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Author, City, Event, HeritageSite, Museum, Publication, Scheme, State,
)
from ..search_engine import normalize, parse_query, search

router = APIRouter(prefix="/api", tags=["assistant"])


class MessageHistoryItem(BaseModel):
    role: str  # "user" or "assistant"
    text: str


class PageContext(BaseModel):
    pathname: str | None = None
    entity_name: str | None = None
    entity_type: str | None = None
    location: str | None = None


class QueryIn(BaseModel):
    question: str
    history: list[MessageHistoryItem] | None = None
    page_context: PageContext | None = None
    lat: float | None = None
    lng: float | None = None
    lang: str | None = "en"
    # legacy fields, kept for backward compatibility
    context_type: str | None = None
    context_id: int | None = None



# ---------------------------------------------------------------------------
# Gemini (Google generative AI) integration — backend-only, key never leaves
# the server. Requests fire only when the user submits a message; conversation
# history is capped at the last 6 messages (3 turns) to stay token-efficient.
# ---------------------------------------------------------------------------

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_MAX_HISTORY = 6
_MAX_GROUNDING_CHARS = 6000


def _call_gemini_api(prompt: str, system_instruction: str,
                     history: list[MessageHistoryItem]) -> tuple[str | None, str]:
    """Ask Gemini to generate a conversational answer.

    Returns ``(answer_text_or_None, status)``. ``status`` is ``"no key"`` when
    ``GEMINI_API_KEY`` is unset, an error string on failure, or empty on success.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, "no key"

    contents = []
    for h in (history or [])[-_MAX_HISTORY:]:
        role = "model" if (h.role or "").lower() == "assistant" else "user"
        text = (h.text or "").strip()
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {"temperature": 0.55, "maxOutputTokens": 700, "topP": 0.95},
    }
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    url = _GEMINI_URL.format(model=GEMINI_MODEL)

    try:
        resp = httpx.post(url, headers=headers, json=payload, timeout=25.0)
    except httpx.HTTPError:
        return None, "network error"
    except Exception:
        return None, "request error"
    if resp.status_code != 200:
        return None, f"HTTP {resp.status_code}"
    try:
        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return None, "empty response"
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
        return (text or None), ""
    except Exception:
        return None, "parse error"


def _flat_profile(profile: dict) -> str:
    """Render a heritage-site profile as compact grounding text."""
    bits = []
    for key, label in (
        ("name", "Name"), ("category", "Category"), ("period", "Period"),
        ("location", "Location"), ("city_name", "City"), ("state_name", "State"),
        ("unesco_status", "UNESCO"), ("heritage_type", "Heritage type"),
        ("history", "History"), ("significance", "Significance"),
        ("architecture", "Architecture"), ("description", "Description"),
    ):
        val = profile.get(key)
        if val:
            bits.append(f"{label}: {str(val).strip()[:400]}")
    return " | ".join(bits)


def _page_profile(h: HeritageSite) -> dict:
    """Compact heritage-site profile mirroring the ``_profile_answer`` shape."""
    return {
        "id": h.id,
        "name": h.name,
        "slug": h.slug,
        "category": h.category,
        "location": h.location,
        "city_name": h.city.name if h.city else None,
        "state_name": h.state.name if h.state else None,
        "description": (h.description or "").strip()[:400],
        "history": (h.history or "").strip()[:400],
        "significance": (h.significance or "").strip()[:260],
        "architecture": (h.architecture or "").strip()[:400],
        "period": h.historical_period,
        "unesco_status": h.unesco_status,
        "unesco_year": h.unesco_year,
        "heritage_type": h.heritage_type,
        "image_url": h.image_url or h.main_image or None,
    }


def _page_entity(db: Session, page_context: PageContext | None) -> dict | None:
    """Resolve the currently viewed page ('entity_name') to a platform record."""
    if not page_context or not page_context.entity_name:
        return None
    nm = re.sub(r"[-_]+", " ", page_context.entity_name).strip().lower()
    if not nm:
        return None
    h = (
        db.query(HeritageSite)
        .filter((HeritageSite.name.ilike(f"%{nm}%")) | (HeritageSite.slug == nm))
        .order_by(HeritageSite.id)
        .first()
    )
    if h:
        return {"kind": "heritage", "label": h.name, "profile": _page_profile(h)}
    m = db.query(Museum).filter(Museum.name.ilike(f"%{nm}%")).first()
    if m:
        return {"kind": "museum", "label": m.name, "profile": {
            "name": m.name, "category": "Museum", "location": m.location,
            "city_name": None, "state_name": None,
            "description": (m.description or m.collections or "")[:400],
        }}
    s = db.query(State).filter(State.name.ilike(f"%{nm}%")).first()
    if s:
        return {"kind": "state", "label": s.name, "profile": {
            "name": s.name, "category": "State", "location": s.name,
            "description": (s.description or "")[:400],
        }}
    c = db.query(City).filter(City.name.ilike(f"%{nm}%")).first()
    if c:
        return {"kind": "city", "label": c.name, "profile": {
            "name": c.name, "category": "City", "location": c.name,
            "description": None,
        }}
    return None


def _build_grounding_text(sources: list[dict], recommendations: list[dict],
                          profile: dict | None, primary_topic: str | None,
                          page_context: PageContext | None,
                          itinerary: list[dict],
                          page_entity: dict | None = None) -> str:
    """Filter the retrieved platform records into a compact grounding block."""
    chunks: list[str] = []
    if page_entity:
        chunks.append(
            f"The user is currently viewing the {page_entity['kind']} \"{page_entity['label']}\"."
        )
        pages_profile = _flat_profile(page_entity.get("profile") or {})
        if pages_profile:
            chunks.append("Current page profile:")
            chunks.append("  " + pages_profile.replace("\n", " "))
    if page_context and (page_context.entity_name or page_context.entity_type):
        bits = [b for b in (page_context.entity_name, page_context.entity_type,
                            page_context.location) if b]
        if bits:
            chunks.append("The user is currently viewing " + " — ".join(bits) + ".")
    if primary_topic:
        chunks.append(f"Primary topic identified for this query: {primary_topic}.")
    if profile:
        chunks.append("Profile of the main heritage site:")
        chunks.append("  " + _flat_profile(profile).replace("\n", " "))
    if recommendations:
        chunks.append("Top matching records from the platform database:")
        for r in recommendations[:8]:
            line = f"- {r.get('name')} ({r.get('category') or 'heritage'})"
            loc = r.get("location") or r.get("city_name") or r.get("state_name")
            if loc:
                line += f", {loc}"
            if r.get("period"):
                line += f", {r['period']}"
            if r.get("unesco_status"):
                line += ", UNESCO listed"
            if r.get("description"):
                line += f". {r['description'][:220]}"
            chunks.append(line)
    if itinerary:
        chunks.append("Suggested itinerary:")
        for d in itinerary[:4]:
            stops = ", ".join(s["name"] for s in d["stops"])
            chunks.append(f"- Day {d['day']} ({d['area']}): {stops}")
    if not chunks:
        chunks.append("No exact database record matched this query.")
    return "\n".join(chunks)[:_MAX_GROUNDING_CHARS]


SYSTEM_INSTRUCTION = (
    "You are Sanskriti AI, the warm, knowledgeable heritage guide of 'Sanskriti Setu', "
    "an Indian heritage & cultural preservation platform."
    "Always answer in a natural, friendly, conversational tone, as if chatting with a traveller."
    "Ground every factual claim in the DATABASE CONTEXT block below."
    "If asked about something not covered by the provided context, say so honestly and suggest "
    "how to explore it — never invent specific facts, dates or names."
    "Resolve follow-up references such as 'it', 'this site', 'they' or 'the festival' using the "
    "conversation history and the page the user is currently viewing."
    "Be concise yet engaging: roughly 2-5 short sentences unless the user asks for more detail."
    "A light, warm touch (e.g. 'Namaste', 'That is one for the bucket list!') is welcome but do "
    "not overdo emojis or exclamations.\n\n"
    "DATABASE CONTEXT:\n{grounding}"
)


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


# ---------------------------------------------------------------------------
# Heritage grounding helpers (reuse the intent-aware search engine)
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _geo_base(payload: QueryIn, intent, db: Session):
    """Return (lat, lng, label) for distance computation, if determinable."""
    if payload.lat is not None and payload.lng is not None:
        return payload.lat, payload.lng, "your location"
    if intent.city_id:
        c = db.get(City, intent.city_id)
        if c and c.latitude and c.longitude:
            return c.latitude, c.longitude, c.name
    return None


def _resolve_primary_site(db: Session, intent):
    """Return the exact site when a query targets a single monument."""
    if intent.site_id:
        h = db.get(HeritageSite, intent.site_id)
        if h:
            return h
    if intent.site_name:
        return db.query(HeritageSite).filter(HeritageSite.name == intent.site_name).first()
    return None


_ITINERARY_HINTS = (
    "itinerary", "plan a", "planning", "route", "trip",
    "tour around", "tour of", "day trip", "day 1",
    "two-day", "2-day", "3-day", "4-day", "-day",
)


def _wants_itinerary(question: str) -> bool:
    low = question.lower().strip()
    return any(h in low for h in _ITINERARY_HINTS)


def _heritage_recommendations(db: Session, sresp: dict, hub, limit: int = 10) -> list[dict]:
    """Shape grounded heritage cards from the search-engine results."""
    recs: list[dict] = []
    for res in sresp.get("results", []):
        if res.get("type") != "heritage":
            continue
        rid = (res.get("data") or {}).get("id")
        h = db.get(HeritageSite, rid) if rid else None
        if h is None:
            continue
        if hub and (h.latitude is None or h.longitude is None):
            continue
        loc = h.location
        if not loc:
            parts = [p for p in (h.city.name if h.city else None, h.state.name if h.state else None) if p]
            loc = ", ".join(parts) or None
        rec = {
            "id": h.id,
            "name": h.name,
            "slug": h.slug,
            "category": h.category,
            "location": loc,
            "description": re.sub(r"\s+", " ", (h.description or "")).strip()[:260],
            "match_reasons": res.get("match_reasons") or [],
            "image_url": h.image_url or h.main_image or None,
            "heritage_type": h.heritage_type,
            "period": h.historical_period,
            "unesco_status": h.unesco_status,
            "state_name": h.state.name if h.state else None,
            "city_name": h.city.name if h.city else None,
        }
        if hub and h.latitude is not None and h.longitude is not None:
            rec["distance_km"] = round(_haversine(hub[0], hub[1], h.latitude, h.longitude), 1)
        recs.append(rec)
        if len(recs) >= limit:
            break
    if hub and any("distance_km" in r for r in recs):
        recs.sort(key=lambda r: r.get("distance_km") if r.get("distance_km") is not None else float("inf"))
    return recs


def _nearby_fill(db: Session, intent, recs: list[dict], hub, limit: int = 6) -> list[dict]:
    """Expand sparse city-filtered results with same-state sites by proximity."""
    if len(recs) >= limit:
        return recs
    have = {r["id"] for r in recs}
    constraints = [v for v in (intent.category, intent.religion, intent.period) if v and v != "Heritage"]
    cands = []
    for h in db.query(HeritageSite).all():
        if h.id in have or h.latitude is None or h.longitude is None:
            continue
        if h.state and intent.state and normalize(h.state.name) != normalize(intent.state):
            continue
        if constraints:
            text = normalize(" ".join(x for x in (h.name, h.category, h.description, h.heritage_type) if x))
            if not any(normalize(cc) in text for cc in constraints):
                continue
        cands.append(h)
    cands.sort(key=lambda h: _haversine(hub[0], hub[1], h.latitude, h.longitude))
    for h in cands[: max(0, limit - len(recs))]:
        recs.append({
            "id": h.id,
            "name": h.name,
            "slug": h.slug,
            "category": h.category,
            "location": h.location or (h.city.name if h.city else None),
            "description": re.sub(r"\s+", " ", (h.description or "")).strip()[:260],
            "match_reasons": [hub[2] or "Nearby"],
            "image_url": h.image_url or h.main_image or None,
            "heritage_type": h.heritage_type,
            "period": h.historical_period,
            "unesco_status": h.unesco_status,
            "state_name": h.state.name if h.state else None,
            "city_name": h.city.name if h.city else None,
            "distance_km": round(_haversine(hub[0], hub[1], h.latitude, h.longitude), 1),
        })
    return recs


def _build_itinerary(recs: list[dict], hub_label: str | None) -> list[dict]:
    """Group recommendations into multi-stop daily legs."""
    if not recs:
        return []
    groups: "OrderedDict[str, list[dict]]" = OrderedDict()
    for r in recs:
        key = r.get("city_name") or hub_label or "Heritage circuit"
        groups.setdefault(key, []).append(r)
    days: list[dict] = []
    if len(groups) == 1:
        stops = next(iter(groups.values()))
        chunk = 2
        for i in range(0, len(stops), chunk):
            part = stops[i:i + chunk]
            area = part[0].get("city_name") or hub_label or "Heritage circuit"
            days.append({"day": len(days) + 1, "area": area, "stops": part})
    else:
        for city, stops in groups.items():
            days.append({"day": len(days) + 1, "area": city, "stops": stops})
    return days[:6]


def _itinerary_lines(days: list[dict], intent, hub, near_me: bool, geo_base) -> list[str]:
    hub_label = hub[2] if hub else intent.city or intent.state
    out: list[str] = []
    if near_me and not geo_base:
        out.append("I can't compute a \"near me\" route without coordinates. Enable location access or name a city, e.g. \"heritage sites near Pune\".")
        out.append("Route overview (sources of the governed database):")
    elif hub_label:
        out.append(f"Suggested {len(days)}-day heritage route around {hub_label}, sourced from the governed database:")
    else:
        out.append(f"Suggested {len(days)}-day heritage route:")
    for d in days:
        out.append(f"Day {d['day']} - {d['area']}")
        for s in d["stops"]:
            dist = f" ({s['distance_km']} km)" if "distance_km" in s else ""
            out.append(f"   * {s['name']} ({s['category']}){dist} - {s['location']}")
    return out


def _discovery_lines(recs: list[dict], question: str, near_me: bool, geo_base, hub) -> list[str]:
    out: list[str] = []
    count = len(recs)
    if near_me and not geo_base:
        out.append("I can't compute \"near me\" without a location. Enable location access or name a city, e.g. \"heritage sites near Pune\".")
        out.append(f"Meanwhile, here are {count} top heritage sites:")
    elif hub:
        out.append(f"Heritage sites closest to {hub[2]}, matched to \"{question}\":")
    else:
        out.append(f"Here are {count} heritage sites matched to \"{question}\", ranked by relevance:")
    for r in recs:
        dist = f" | {r['distance_km']} km" if "distance_km" in r else ""
        out.append(f"* {r['name']} - {r['category']}, {r['location']}{dist}")
        if r["description"]:
            out.append(f"   {r['description'][:170]}")
        if r["match_reasons"]:
            out.append(f"   ✓ {', '.join(r['match_reasons'])}")
    return out


def _profile_answer(db: Session, h: HeritageSite, intent, sresp: dict):
    lines: list[str] = []
    meta = [h.category, h.location or (h.city.name if h.city else None)]
    meta = [m for m in meta if m]
    if h.state and h.state.name not in meta:
        meta.append(h.state.name)
    head = h.name + (" - " + ", ".join(dict.fromkeys(meta)) if meta else "")
    lines.append(head + ".")
    if intent.site_correction and intent.site_correction != h.name:
        lines.append(f"Did you mean \"{h.name}\" (spelt as \"{intent.site_correction}\")?")
    if h.description:
        lines.append(re.sub(r"\s+", " ", h.description).strip()[:340])
    if h.significance:
        lines.append(f"Significance: {re.sub(r'\s+', ' ', h.significance).strip()[:220]}")
    if h.historical_period:
        lines.append(f"Period: {h.historical_period}")
    if h.unesco_status:
        extra = f" (since {h.unesco_year})" if h.unesco_year else ""
        lines.append(f"UNESCO status: {h.unesco_status}{extra}")
    related_rows = []
    if h.state_id:
        related_rows = (
            db.query(HeritageSite)
            .filter(HeritageSite.id != h.id, HeritageSite.state_id == h.state_id)
            .order_by(HeritageSite.featured.desc())
            .limit(4)
            .all()
        )
    if related_rows:
        lines.append("Related heritage to explore: " + "; ".join(r.name for r in related_rows) + ".")
    profile = {
        "id": h.id,
        "name": h.name,
        "slug": h.slug,
        "category": h.category,
        "location": h.location,
        "city_name": h.city.name if h.city else None,
        "state_name": h.state.name if h.state else None,
        "description": (h.description or "").strip()[:420],
        "history": (h.history or "").strip()[:420],
        "significance": (h.significance or "").strip()[:260],
        "architecture": (h.architecture or "").strip()[:420],
        "period": h.historical_period,
        "unesco_status": h.unesco_status,
        "unesco_year": h.unesco_year,
        "heritage_type": h.heritage_type,
        "image_url": h.image_url or h.main_image or None,
    }
    sources = [{"type": "heritage", "id": h.id, "label": h.name, "url": None}]
    return lines, sources, profile


@router.post("/assistant/query")
def assistant_query(payload: QueryIn, db: Session = Depends(get_db)):
    question = payload.question.strip()
    intent = _intent(question)
    place_type, place_id, place_name = _find_place(question, db)
    resp_place = place_name

    detail_lines: list[str] = []
    sources: list[dict] = []
    recommendations: list[dict] = []
    itinerary: list[dict] = []
    profile = None
    interpreted = None
    matched_count = 0
    primary = None

    if intent == "books":
        pubs = db.query(Publication).order_by(Publication.year).all()
        rows = [p for p in pubs if not place_name or (p.subject and place_name.lower() in p.subject.lower()) or not place_name]
        if rows:
            rows = rows[:4]
            detail_lines.append("Based on the catalogue, here are publications worth exploring:")
            for p in rows:
                a = db.get(Author, p.author_id).name if p.author_id else "Unknown"
                detail_lines.append(f"* {p.title} ({p.year}) by {a} - {p.subject or p.description or ''}".strip()[:200])
            sources = [{"type": "publication", "id": p.id, "label": p.title, "url": p.digital_url} for p in rows]
            matched_count = len(sources)
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
            detail_lines.append("Upcoming cultural events, linked to verified sources:")
            for e in evts[:5]:
                detail_lines.append(f"* {e.name} - {e.start_date} to {e.end_date} at {e.location} ({e.organizer})")
            sources = [{"type": "event", "id": e.id, "label": e.name, "url": e.official_url} for e in evts[:5]]
            matched_count = len(sources)
        else:
            detail_lines.append("No upcoming cultural events were found for that location in the current dataset.")

    elif intent == "schemes":
        scs = db.query(Scheme).all()
        detail_lines.append("Relevant Ministry of Culture schemes:")
        for sc in scs[:4]:
            detail_lines.append(f"* {sc.name} - {sc.category}. Eligibility: {sc.eligibility}")
        sources = [{"type": "scheme", "id": sc.id, "label": sc.name, "url": sc.official_url} for sc in scs[:4]]
        matched_count = len(sources)

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
        resp_place = place_name or resp_place

    elif intent == "museums":
        ms = db.query(Museum).all()
        if place_name and place_type == "city":
            ms = [m for m in ms if m.city_id == place_id]
        if ms:
            city_names = {c.id: c.name for c in db.query(City).all()}
            detail_lines.append("Recommended museums:")
            for m in ms[:4]:
                detail_lines.append(f"* {m.name} - {m.location}. Collections: {m.collections}")
            sources = [{"type": "museum", "id": m.id, "label": m.name, "url": m.official_url} for m in ms[:4]]
            recommendations = [
                {
                    "id": m.id,
                    "name": m.name,
                    "slug": None,
                    "category": "Museum",
                    "location": m.location,
                    "description": (m.collections or m.description or "").strip()[:260],
                    "match_reasons": [],
                    "image_url": m.image_url,
                    "state_name": None,
                    "city_name": city_names.get(m.city_id),
                }
                for m in ms[:6]
            ]
            matched_count = len(ms)
        else:
            detail_lines.append("No museums found in the dataset for this query.")

    else:  # heritage (default) - grounded via the intent-aware search engine
        heritage_intent = parse_query(db, question)
        geo_base = _geo_base(payload, heritage_intent, db)
        low = question.lower()
        near_me = "near me" in low or "around me" in low
        want_distance = near_me or any(
            w in low for w in ("near ", "nearby", "nearest", "close to", "around ", " aroud", "km")
        )
        hub = geo_base if want_distance else None

        primary = _resolve_primary_site(db, heritage_intent)
        want_itin = primary is None and _wants_itinerary(question)

        sresp = search(db, question, limit=20)
        recs = _heritage_recommendations(db, sresp, hub, limit=10)
        if primary is None and hub:
            recs = _nearby_fill(db, heritage_intent, recs, hub, limit=6)

        matched_count = len(recs)
        interpreted = heritage_intent.to_dict()
        resp_place = heritage_intent.city or heritage_intent.state or (primary.name if primary else None) or heritage_intent.site_name

        if primary:
            detail_lines, sources, profile = _profile_answer(db, primary, heritage_intent, sresp)
        elif want_itin and recs:
            itinerary = _build_itinerary(recs, hub[2] if hub else heritage_intent.city)
            detail_lines = _itinerary_lines(itinerary, heritage_intent, hub, near_me, geo_base)
            sources = [{"type": "heritage", "id": r["id"], "label": r["name"], "url": None} for r in recs[:5]]
        elif recs:
            detail_lines = _discovery_lines(recs, question, near_me, geo_base, hub)
            sources = [{"type": "heritage", "id": r["id"], "label": r["name"], "url": None} for r in recs[:5]]
        else:
            detail_lines = [
                f"I could not find entries matching \"{question}\" in the governed dataset. "
                "I prefer to say I don't know rather than guess."
            ]
            did_you_mean = sresp.get("did_you_mean")
            if did_you_mean:
                detail_lines.append(f"Did you mean \"{did_you_mean}\"?")
            suggested = sresp.get("suggestions") or []
            if suggested:
                detail_lines.append("Try: " + " • ".join(suggested[:3]))
            sources = []
        recommendations = recs

    # ------------------------------------------------------------------
    # 2. Gemini integration (when GEMINI_API_KEY is configured)
    #
    # The deterministically computed data above (detail_lines, sources,
    # recommendations, profile, itinerary) is reused both as (a) the
    # grounding context block injected into the Gemini system prompt, and
    # (b) the fallback answer when Gemini is unavailable.
    # ------------------------------------------------------------------
    page_entity = _page_entity(db, payload.page_context)
    grounding = _build_grounding_text(
        sources=sources,
        recommendations=recommendations,
        profile=profile,
        primary_topic=resp_place,
        page_context=payload.page_context,
        itinerary=itinerary,
        page_entity=page_entity,
    )
    system_instruction = SYSTEM_INSTRUCTION.format(grounding=grounding)
    if payload.lang == "hi":
        system_instruction += "\n\nIMPORTANT INSTRUCTION: Output your response fluently in Devanagari Hindi (हिन्दी)."
    elif payload.lang == "kn":
        system_instruction += "\n\nIMPORTANT INSTRUCTION: Output your response fluently in Kannada script (ಕನ್ನಡ)."
    gemini_text, gemini_status = _call_gemini_api(question, system_instruction, payload.history or [])

    if gemini_text:
        answer = gemini_text
        trust = "GEMINI — natural answer generated by Gemini, grounded in platform records."
        note = (
            f"Model {GEMINI_MODEL} · last {min(len(payload.history or []), _MAX_HISTORY)} messages in context · "
            f"{matched_count} platform records used as grounding."
        )
    else:
        answer = "\n".join(detail_lines) if detail_lines else (
            "I could not find a confident answer in the verified cultural database. "
            "I prefer to say I don't know rather than guess."
        )
        trust = "GROUNDED — answer uses retrieved records from the governed platform data."
        if gemini_status == "no key":
            note = "GEMINI_API_KEY is not configured — fell back to the grounded retrieval assistant."
        elif gemini_status:
            note = f"Gemini unavailable ({gemini_status}) — fell back to the grounded retrieval assistant."
        else:
            note = "Prototype retrieval-based assistant. Production will upgrade to full RAG over curated corpora."
        if primary is None and page_entity:
            detail_lines.append(
                f"From the page you are viewing ({page_entity['kind']}): {page_entity['label']}"
            )
            fp = _flat_profile(page_entity.get("profile") or {})
            if fp:
                detail_lines.append("  " + fp[:_MAX_GROUNDING_CHARS])
            if detail_lines:
                answer = "\n".join(detail_lines)

    return {
        "question": question,
        "intent": intent,
        "place": resp_place,
        "answer": answer,
        "sources": sources,
        "recommendations": recommendations,
        "itinerary": itinerary,
        "profile": profile,
        "interpreted": interpreted,
        "matched_count": matched_count,
        "trust": trust,
        "note": note,
    }