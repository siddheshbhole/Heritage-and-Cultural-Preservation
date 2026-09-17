def trending_row(t):
    return {
        "id": t.id,
        "title": t.title,
        "slug": t.slug,
        "category": t.category,
        "kind": t.kind,
        "state": t.state,
        "city": t.city,
        "image_url": t.image_url,
        "image_position": t.image_position or "center",
        "summary": t.summary,
        "external_url": t.external_url,
        "explore_url": t.explore_url,
        "trend_score": round(t.trend_score or 0.0, 1),
        "source_name": t.source_name,
        "source_url": t.source_url,
        "is_active": bool(t.is_active),
    }


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
        "cultural_identity": s.cultural_identity if hasattr(s, 'cultural_identity') else None,
        "historical_overview": s.historical_overview if hasattr(s, 'historical_overview') else None,
        "arts_and_crafts": s.arts_and_crafts if hasattr(s, 'arts_and_crafts') else None,
        "festivals_and_rituals": s.festivals_and_rituals if hasattr(s, 'festivals_and_rituals') else None,
        "cuisine_and_languages": s.cuisine_and_languages if hasattr(s, 'cuisine_and_languages') else None,
        "important_personalities": s.important_personalities if hasattr(s, 'important_personalities') else None,
        "source_name": s.source_name if hasattr(s, 'source_name') else None,
        "source_url": s.source_url if hasattr(s, 'source_url') else None,
        "source_type": s.source_type if hasattr(s, 'source_type') else None,
        "last_verified_at": s.last_verified_at if hasattr(s, 'last_verified_at') else None,
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
        "cultural_identity": c.cultural_identity if hasattr(c, 'cultural_identity') else None,
        "historical_overview": c.historical_overview if hasattr(c, 'historical_overview') else None,
        "arts_and_crafts": c.arts_and_crafts if hasattr(c, 'arts_and_crafts') else None,
        "festivals_and_rituals": c.festivals_and_rituals if hasattr(c, 'festivals_and_rituals') else None,
        "cuisine_and_languages": c.cuisine_and_languages if hasattr(c, 'cuisine_and_languages') else None,
        "important_personalities": c.important_personalities if hasattr(c, 'important_personalities') else None,
        "source_name": c.source_name if hasattr(c, 'source_name') else None,
        "source_url": c.source_url if hasattr(c, 'source_url') else None,
        "source_type": c.source_type if hasattr(c, 'source_type') else None,
        "last_verified_at": c.last_verified_at if hasattr(c, 'last_verified_at') else None,
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
        "slug": h.slug,
        "heritage_type": h.heritage_type,
        "region": h.region,
        "unesco_status": h.unesco_status,
        "unesco_year": h.unesco_year,
        "unesco_category": h.unesco_category,
        "google_360_url": h.google_360_url,
        "main_image": h.main_image,
        "established": h.established,
        "created_at": h.created_at,
        "updated_at": h.updated_at,
    }


def heritage_category_row(c, count=0):
    return {
        "id": c.id,
        "slug": c.slug,
        "name": c.name,
        "kind": c.kind,
        "parent_slug": c.parent_slug,
        "description": c.description,
        "image_url": c.image_url,
        "display_order": c.display_order,
        "count": count,
    }


def heritage_image_row(i):
    return {
        "id": i.id,
        "url": i.url,
        "caption": i.caption,
        "display_order": i.display_order,
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


def _event_gallery(e):
    if not getattr(e, "gallery_images", None):
        return []
    import json as _json
    try:
        data = _json.loads(e.gallery_images)
    except Exception:
        return []
    if isinstance(data, list):
        return [i for i in data if isinstance(i, str) and i.strip()]
    if isinstance(data, dict):
        first = [i for i in data.get("images", []) if i]
        return first if isinstance(first, list) else []
    return []


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
        "state_name": getattr(e, "state_name", None),
        "city_name": getattr(e, "city_name", None),
        "gallery_images": _event_gallery(e),
        "status": event_status(e),
        "event_type": getattr(e, "event_type", "culture") or "culture",
        "bookable": bool(getattr(e, "bookable", 0)),
    }


def event_row_detailed(e):
    row = event_row(e)
    row["historical_background"] = getattr(e, "historical_background", None)
    row["cultural_significance"] = getattr(e, "cultural_significance", None)
    row["rituals_traditions"] = getattr(e, "rituals_traditions", None)
    return row


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


def document_category_row(c, count: int = 0):
    return {
        "id": c.id,
        "slug": c.slug,
        "name": c.name,
        "description": c.description,
        "icon": c.icon,
        "display_order": c.display_order,
        "count": count,
    }


def document_item_row(d):
    # Public/CDN URLs (e.g. Supabase Storage) are passed through untouched;
    # local files known to the backend are served through the proxy endpoint.
    file_url = d.file_url
    if file_url and file_url.startswith(("http://", "https://")):
        pass  # external URL (Supabase Storage CDN / remote archive)
    elif d.file_path:
        file_url = f"/api/documents/file/{d.id}"
    return {
        "id": d.id,
        "title": d.title,
        "slug": d.slug,
        "category": d.category,
        "file_url": file_url,
        "file_type": (d.file_type or "").upper(),
        "file_size": d.file_size or 0,
        "published_date": d.published_date,
        "description": d.description,
        "sort_order": d.sort_order,
        "created_at": d.created_at,
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
        "supabase_user_id": getattr(p, "supabase_user_id", None),
    }



def ministry_leader_row(l):
    return {
        "id": l.id,
        "name": l.name,
        "title": l.title,
        "designation": l.designation,
        "image_url": l.image_url,
        "official_url": l.official_url,
    }


def ministry_row(m, leaders):
    return {
        "heading": m.heading,
        "about": m.about,
        "mission": m.mission,
        "vision": m.vision,
        "stats": {
            "attached_offices": m.attached_offices,
            "subordinate_offices": m.subordinate_offices,
            "autonomous_organizations": m.autonomous_organizations,
        },
        "leaders": [ministry_leader_row(l) for l in leaders],
        "directory_url": m.directory_url,
        "organisations_url": m.organisations_url,
        "source_name": m.source_name,
        "source_url": m.source_url,
        "updated_at": m.updated_at,
    }


def programme_row(p):
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "category": p.category,
        "image_url": p.image_url,
        "official_url": p.official_url,
        "source_label": p.source_label,
        "source_url": p.source_url,
        "action": "Explore",
    }


def media_news_row(n):
    return {
        "id": n.id,
        "title": n.title,
        "date": n.date,
        "image_url": n.image_url,
        "source_url": n.source_url,
    }


def media_album_row(a):
    return {
        "id": a.id,
        "title": a.title,
        "date": a.date,
        "items_count": a.items_count or 0,
        "cover_image": a.cover_image,
        "gallery_url": a.gallery_url,
    }


def media_video_row(v):
    return {
        "id": v.id,
        "title": v.title,
        "date": v.date,
        "duration": v.duration,
        "language": v.language,
        "youtube_id": v.youtube_id,
        "thumbnail_url": v.thumbnail_url,
    }


def media_brochure_row(b):
    return {
        "id": b.id,
        "title": b.title,
        "description": b.description,
        "image_url": b.image_url,
        "pdf_url": b.pdf_url,
        "source_url": b.source_url,
    }


def media_leader_row(l):
    return {
        "id": l.id,
        "name": l.name,
        "slug": l.slug,
        "bio": l.bio,
        "image_url": l.image_url,
        "official_url": l.official_url,
    }


def media_monument_row(m):
    return {
        "id": m.id,
        "name": m.name,
        "image_url": m.image_url,
        "streetview_url": m.streetview_url,
    }


def media_artist_row(a):
    return {
        "id": a.id,
        "name": a.name,
        "category": a.category,
        "image_url": a.image_url,
        "official_url": a.official_url,
    }


def media_sanskriti_row(s):
    return {
        "id": s.id,
        "title": s.title,
        "slug": s.slug,
        "description": s.description,
        "image_url": s.image_url,
        "official_url": s.official_url,
        "source_label": s.source_label,
    }


def media_event_row(e):
    return {
        "id": e.id,
        "category": e.category,
        "title": e.title,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "venue": e.venue,
        "city": e.city,
        "state": e.state,
        "event_time": e.event_time,
        "image_url": e.image_url,
        "official_url": e.official_url,
        "is_archive": bool(e.is_archive),
    }


def media_webcast_row(w):
    return {
        "id": w.id,
        "title": w.title,
        "date": w.date,
        "youtube_url": w.youtube_url,
        "is_live": bool(w.is_live),
        "source_url": w.source_url,
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


def guide_row(g):
    """Public serialiser for Heritage Guide registrations.

    Intentionally omits phone/email so the public endpoint never leaks contact
    details while a guide is pending review.
    """
    return {
        "id": g.id,
        "full_name": g.full_name,
        "state": g.state,
        "location": g.location,
        "status": g.status,
        "availability": g.availability or "free",
        "created_at": g.created_at.isoformat() if g.created_at else None,
    }


def guide_admin_row(g):
    """Admin/owner serialiser: full contact details plus ownership info."""
    return {
        **guide_row(g),
        "user_id": g.user_id,
        "phone": g.phone,
        "email": g.email,
        "assigned_site": g.assigned_site,
        "updated_at": g.updated_at.isoformat() if g.updated_at else None,
    }


def guide_tour_row(t):
    """Serialiser for a tour/guide assignment.

    Public by default: omits the tourist's contact details unless the caller
    (guide or tourist owner) is entitled to see them.
    """
    return {
        "id": t.id,
        "guide_id": t.guide_id,
        "heritage_site_id": t.heritage_site_id,
        "site_name": t.site_name,
        "status": t.status,
        "tourist_user_id": t.tourist_user_id,
        "tourist_name": t.tourist_name,
        "tourist_email": t.tourist_email,
        "tourist_phone": t.tourist_phone,
        "tour_token": t.tour_token,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }