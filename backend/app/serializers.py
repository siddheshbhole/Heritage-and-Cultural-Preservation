def state_row(s):
    if s is None:
        return None
    return {
        "id": s.id,
        "name": s.name,
        "code": s.code,
        "region": s.region,
        "capital": s.capital,
        "description": s.description,
        "history": s.history,
        "culture": s.culture,
        "rituals": s.rituals,
        "handicrafts": s.handicrafts,
        "food": s.food,
        "festivals": s.festivals,
        "iconic_battles": s.iconic_battles,
        "image_url": s.image_url,
        "categories": [c for c, v in {
            "History": s.history,
            "Culture": s.culture,
            "Rituals & Traditions": s.rituals,
            "Handloom / Handicrafts": s.handicrafts,
            "Famous Food": s.food,
            "Festivals": s.festivals,
            "Iconic Battles": s.iconic_battles,
        }.items() if v],
    }


def city_row(c):
    if c is None:
        return None
    return {
        "id": c.id,
        "state_id": c.state_id,
        "name": c.name,
        "description": c.description,
        "history": c.history,
        "culture": c.culture,
        "rituals": c.rituals,
        "handicrafts": c.handicrafts,
        "food": c.food,
        "iconic_battles": c.iconic_battles,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "image_url": c.image_url,
        "categories": [cat for cat, v in {
            "History": c.history,
            "Culture": c.culture,
            "Rituals & Traditions": c.rituals,
            "Handloom / Handicrafts": c.handicrafts,
            "Famous Food": c.food,
            "Iconic Battles": c.iconic_battles,
        }.items() if v],
    }


def heritage_row(h):
    return {
        "id": h.id,
        "city_id": h.city_id,
        "state_id": h.state_id,
        "name": h.name,
        "category": h.category,
        "description": h.description,
        "history": h.history,
        "location": h.location,
        "latitude": h.latitude,
        "longitude": h.longitude,
        "historical_period": h.historical_period,
        "architecture": h.architecture,
        "significance": h.significance,
        "famous_people": h.famous_people,
        "related_events": h.related_events,
        "image_url": h.image_url,
        "featured": bool(h.featured),
    }


def museum_row(m):
    return {
        "id": m.id,
        "city_id": m.city_id,
        "name": m.name,
        "description": m.description,
        "collections": m.collections,
        "location": m.location,
        "image_url": m.image_url,
        "official_url": m.official_url,
    }


def event_status(e, today=None):
    from datetime import date
    today = today or date.today().isoformat()
    if e.end_date and e.end_date < today:
        return "COMPLETED"
    if e.start_date and e.start_date <= today <= (e.end_date or e.start_date):
        return "ONGOING"
    return "UPCOMING"


def event_row(e):
    return {
        "id": e.id,
        "name": e.name,
        "category": e.category,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "location": e.location,
        "state_id": e.state_id,
        "city_id": e.city_id,
        "description": e.description,
        "image_url": e.image_url,
        "organizer": e.organizer,
        "official_url": e.official_url,
        "registration_url": e.registration_url,
        "status": event_status(e),
    }


def announcement_row(a):
    return {
        "id": a.id,
        "title": a.title,
        "date": a.date,
        "source": a.source,
        "summary": a.summary,
        "url": a.url,
    }


def app_row(a):
    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "category": a.category,
        "official_url": a.official_url,
        "image_url": a.image_url,
        "action": a.action,
    }


def scheme_row(s):
    return {
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "eligibility": s.eligibility,
        "benefits": s.benefits,
        "application_info": s.application_info,
        "year": s.year,
        "organization": s.organization,
        "official_url": s.official_url,
    }


def award_row(a):
    return {
        "id": a.id,
        "name": a.name,
        "year": a.year,
        "recipient": a.recipient,
        "field": a.field,
        "citation": a.citation,
        "description": a.description,
        "official_url": a.official_url,
    }


def commemoration_row(c):
    return {
        "id": c.id,
        "name": c.name,
        "period": c.period,
        "field": c.field,
        "contribution": c.contribution,
        "significance": c.significance,
        "locations": c.locations,
        "people": c.people,
        "related_events": c.related_events,
        "sources": c.sources,
    }


def document_row(d):
    return {
        "id": d.id,
        "title": d.title,
        "year": d.year,
        "organization": d.organization,
        "description": d.description,
        "doc_type": d.doc_type,
        "source_url": d.source_url,
        "file_url": d.file_url,
        "rights_status": d.rights_status,
    }


def author_row(a):
    return {
        "id": a.id,
        "name": a.name,
        "biography": a.biography,
        "field": a.field,
        "period": a.period,
        "institutions": a.institutions,
        "research": a.research,
        "image_url": a.image_url,
    }


def publication_row(p):
    return {
        "id": p.id,
        "author_id": p.author_id,
        "title": p.title,
        "publisher": p.publisher,
        "year": p.year,
        "language": p.language,
        "subject": p.subject,
        "isbn": p.isbn,
        "description": p.description,
        "institution": p.institution,
        "catalogue_url": p.catalogue_url,
        "digital_url": p.digital_url,
    }


def mou_row(m):
    return {
        "id": m.id,
        "title": m.title,
        "parties": m.parties,
        "date": m.date,
        "purpose": m.purpose,
        "description": m.description,
        "institution": m.institution,
        "document_url": m.document_url,
        "source_url": m.source_url,
        "category": m.category,
    }


def institution_row(i):
    return {
        "id": i.id,
        "name": i.name,
        "type": i.type,
        "location": i.location,
        "description": i.description,
        "responsibilities": i.responsibilities,
        "official_url": i.official_url,
    }


def post_row(p):
    return {
        "id": p.id,
        "kind": p.kind,
        "title": p.title,
        "content": p.content,
        "author_name": p.author_name,
        "status": p.status,
        "created_at": p.created_at,
        "related_resource": p.related_resource,
        "related_city": p.related_city,
        "image_url": p.image_url,
    }


def provenance_row(p):
    if p is None:
        return None
    return {
        "source_id": p.source_id,
        "organization": p.organization,
        "dataset_name": p.dataset_name,
        "source_url": p.source_url,
        "retrieved_at": p.retrieved_at,
        "last_updated": p.last_updated,
        "license": p.license,
        "rights_status": p.rights_status,
        "verification_status": p.verification_status,
    }