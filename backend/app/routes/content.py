from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    AboutEntry, Announcement, Author, Award, City, Commemoration, CultureApp,
    Document, Event, GovernmentProgramme, HeritageSite, Institution, MoU, Museum,
    Provenance, Publication, Scheme, State,
)
from ..serializers import (
    announcement_row, app_row, author_row, award_row, commemoration_row,
    document_row, event_row, heritage_image_row, heritage_row, institution_row,
    mou_row, museum_row, programme_row, provenance_row, publication_row, scheme_row,
)

router = APIRouter(prefix="/api", tags=["content"])


# Current India-wide totals (verified against 2026 official sources), shown instead
# of the small seeded database counts so the platform reflects national volumes:
#   states:       36 = 28 States + 8 Union Territories (Constitution, unchanged since 2020)
#   heritage:     3,688 centrally protected monuments/sites of national importance
#                 (MoC replies to Lok Sabha 03.08.2026 and Rajya Sabha 14.08.2026; ASI)
#   museums:      1,176 museums (Ministry of Culture, Directory of Museums in India, 2023)
#   publications: 1.19 crore+ manuscripts reported under Gyan Bharatam National
#                 Manuscript Survey (PIB, MoC, 03.08.2026)
#   cities:       7,935 towns = 4,041 statutory + 3,894 census towns (Census 2011 / MoHUA)
#   events:       51 major national & regional festivals each year (Rajya Sabha study)
OFFICIAL_STATS = {
    "states": 36,
    "cities": 7935,
    "heritage_sites": 3688,
    "museums": 1176,
    "publications": 11900000,
    "events": 51,
}


def with_provenance(db: Session, row: dict, resource_type: str):
    p = db.query(Provenance).filter(
        Provenance.resource_type == resource_type,
        Provenance.resource_id == row["id"],
    ).first()
    row["provenance"] = provenance_row(p)
    return row


@router.get("/home")
def home(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    apps = db.query(CultureApp).all()
    announcements = db.query(Announcement).order_by(Announcement.date.desc()).limit(8).all()
    events = db.query(Event).all()
    upcoming = [event_row(e) for e in events if e.end_date is None or e.end_date >= today]
    upcoming.sort(key=lambda x: x["start_date"])
    featured = db.query(HeritageSite).filter(HeritageSite.featured == 1).limit(6).all()
    programmes = (
        db.query(GovernmentProgramme)
        .filter(GovernmentProgramme.active == 1)
        .order_by(GovernmentProgramme.sort_order)
        .all()
    )
    return {
        "apps": [app_row(a) for a in apps],
        "announcements": [announcement_row(a) for a in announcements],
        "events": upcoming[:10],
        "featured_heritage": [heritage_row(h) for h in featured],
        "showcase": [programme_row(p) for p in programmes],
        "stats": dict(OFFICIAL_STATS),
    }


@router.get("/statistics")
def statistics(db: Session = Depends(get_db)):
    return {
        "states_ut": OFFICIAL_STATS["states"],
        "heritage_resources": OFFICIAL_STATS["heritage_sites"],
        "museums": OFFICIAL_STATS["museums"],
        "festivals_events": OFFICIAL_STATS["events"],
        "publications": OFFICIAL_STATS["publications"],
        "cities": OFFICIAL_STATS["cities"],
    }


@router.get("/events")
def list_events(
    state: int | None = None,
    city: int | None = None,
    category: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if state:
        q = q.filter(Event.state_id == state)
    if city:
        q = q.filter(Event.city_id == city)
    if category:
        q = q.filter(Event.category == category)
    rows = [event_row(e) for e in q.all()]
    if status:
        rows = [r for r in rows if r["status"] == status]
    return rows


@router.get("/announcements")
def list_announcements(db: Session = Depends(get_db)):
    return [announcement_row(a) for a in db.query(Announcement).order_by(Announcement.date.desc()).all()]


@router.get("/apps")
def list_apps(db: Session = Depends(get_db)):
    return [app_row(a) for a in db.query(CultureApp).all()]


@router.get("/schemes")
def list_schemes(db: Session = Depends(get_db)):
    return [scheme_row(s) for s in db.query(Scheme).order_by(Scheme.name).all()]


@router.get("/awards")
def list_awards(db: Session = Depends(get_db)):
    return [award_row(a) for a in db.query(Award).order_by(Award.year.desc()).all()]


@router.get("/commemorations")
def list_commemorations(db: Session = Depends(get_db)):
    return [commemoration_row(c) for c in db.query(Commemoration).order_by(Commemoration.name).all()]


@router.get("/documents")
def list_documents(
    doc_type: str | None = None,
    year: str | None = None,
    organization: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Document)
    if doc_type:
        q = q.filter(Document.doc_type == doc_type)
    if year:
        q = q.filter(Document.year == year)
    if organization:
        q = q.filter(Document.organization == organization)
    return [document_row(d) for d in q.all()]


@router.get("/publications")
def list_publications(
    subject: str | None = None,
    language: str | None = None,
    author_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Publication)
    if subject:
        q = q.filter(Publication.subject == subject)
    if language:
        q = q.filter(Publication.language == language)
    if author_id:
        q = q.filter(Publication.author_id == author_id)
    return [publication_row(p) for p in q.order_by(Publication.year).all()]


@router.get("/authors")
def list_authors(db: Session = Depends(get_db)):
    return [author_row(a) for a in db.query(Author).order_by(Author.name).all()]


@router.get("/authors/{author_id}")
def get_author(author_id: int, db: Session = Depends(get_db)):
    a = db.get(Author, author_id)
    if not a:
        raise HTTPException(status_code=404, detail="Author not found")
    data = author_row(a)
    data["publications"] = [publication_row(p) for p in a.publications]
    return data


@router.get("/mous")
def list_mous(
    year: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(MoU)
    if year:
        q = q.filter(MoU.date.startswith(year))
    if category:
        q = q.filter(MoU.category == category)
    return [mou_row(m) for m in q.order_by(MoU.date.desc()).all()]


@router.get("/institutions")
def list_institutions(db: Session = Depends(get_db)):
    return [institution_row(i) for i in db.query(Institution).order_by(Institution.name).all()]


@router.get("/heritage")
def list_heritage(
    state_id: int | None = None,
    city_id: int | None = None,
    category: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(HeritageSite)
    if state_id:
        query = query.filter(HeritageSite.state_id == state_id)
    if city_id:
        query = query.filter(HeritageSite.city_id == city_id)
    if category:
        query = query.filter(HeritageSite.category == category)
    if q:
        query = query.filter(HeritageSite.name.ilike(f"%{q}%"))
    return [heritage_row(h) for h in query.order_by(HeritageSite.name).all()]


@router.get("/heritage/{heritage_id}")
def get_heritage(heritage_id: str, db: Session = Depends(get_db)):
    if heritage_id.isdigit():
        h = db.get(HeritageSite, int(heritage_id))
    else:
        h = db.query(HeritageSite).filter(HeritageSite.slug == heritage_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Heritage site not found")
    data = heritage_row(h)
    data["city_name"] = h.city.name if h.city else None
    data["state_name"] = h.state.name if h.state else None
    data["gallery"] = [heritage_image_row(i) for i in h.images]
    data["nearby"] = [
        heritage_row(n) for n in
        db.query(HeritageSite).filter(
            HeritageSite.city_id == h.city_id,
            HeritageSite.id != h.id,
        ).limit(4).all()
    ]
    return with_provenance(db, data, "heritage_site")


@router.get("/museums")
def list_museums(city_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Museum)
    if city_id:
        q = q.filter(Museum.city_id == city_id)
    return [museum_row(m) for m in q.all()]


@router.get("/museums/{museum_id}")
def get_museum(museum_id: int, db: Session = Depends(get_db)):
    m = db.get(Museum, museum_id)
    if not m:
        raise HTTPException(status_code=404, detail="Museum not found")
    data = museum_row(m)
    if m.city_id:
        city = db.get(City, m.city_id)
        if city:
            data["city_name"] = city.name
            data["state_name"] = city.state.name if city.state else None
    return with_provenance(db, data, "museum")


@router.get("/about")
def about(db: Session = Depends(get_db)):
    entries = db.query(AboutEntry).all()
    by_section: dict[str, list] = {}
    for e in entries:
        by_section.setdefault(e.section, []).append({"title": e.title, "content": e.content})
    return by_section