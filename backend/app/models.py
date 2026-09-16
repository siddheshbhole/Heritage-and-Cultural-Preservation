from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from .database import Base


class TrendingItem(Base):
    """A featured heritage / cultural item shown in the homepage trending carousel.

    The database is the source of truth: the frontend only fetches the current
    active items from ``GET /api/trending``. A scheduled updater can add, re-score,
    deactivate and rotate these records without any frontend code change.
    """

    __tablename__ = "trending_items"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    slug = Column(String, index=True)
    category = Column(String)  # Heritage Site / Festival / Living Culture / Script / Dance ...
    kind = Column(String, default="heritage")  # heritage | culture
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    image_url = Column(String)
    image_position = Column(String, default="center")  # object-position focal point
    summary = Column(Text)
    external_url = Column(String)
    explore_url = Column(String)
    trends_on = Column(Integer, default=0)

    # Trend score (0-100) built from weighted signals; higher = more prominent.
    current_event_score = Column(Float, default=0.0)
    recent_activity_score = Column(Float, default=0.0)
    cultural_significance_score = Column(Float, default=0.0)
    user_interest_score = Column(Float, default=0.0)
    recency_score = Column(Float, default=0.0)
    trend_score = Column(Float, default=0.0)

    source_name = Column(String)
    source_url = Column(String, nullable=True)
    is_active = Column(Integer, default=1)
    published_at = Column(String)
    created_at = Column(String)
    updated_at = Column(String)


class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    code = Column(String)
    region = Column(String)
    capital = Column(String)
    description = Column(Text)
    history = Column(Text)
    culture = Column(Text)
    rituals = Column(Text)
    handicrafts = Column(Text)
    food = Column(Text)
    festivals = Column(Text)
    iconic_battles = Column(Text)
    image_url = Column(String)

    # Extended cultural dataset
    cultural_identity = Column(String, nullable=True)
    historical_overview = Column(Text, nullable=True)
    arts_and_crafts = Column(Text, nullable=True)
    festivals_and_rituals = Column(Text, nullable=True)
    cuisine_and_languages = Column(Text, nullable=True)
    important_personalities = Column(Text, nullable=True)

    # Source tracking
    source_name = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    last_verified_at = Column(String, nullable=True)

    cities = relationship("City", back_populates="state", cascade="all, delete-orphan")
    heritage_sites = relationship("HeritageSite", back_populates="state")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
    name = Column(String, index=True)
    description = Column(Text)
    history = Column(Text)
    culture = Column(Text)
    rituals = Column(Text)
    handicrafts = Column(Text)
    food = Column(Text)
    iconic_battles = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    image_url = Column(String)

    # Extended cultural dataset
    cultural_identity = Column(String, nullable=True)
    historical_overview = Column(Text, nullable=True)
    arts_and_crafts = Column(Text, nullable=True)
    festivals_and_rituals = Column(Text, nullable=True)
    cuisine_and_languages = Column(Text, nullable=True)
    important_personalities = Column(Text, nullable=True)

    # Source tracking
    source_name = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    last_verified_at = Column(String, nullable=True)

    state = relationship("State", back_populates="cities")
    heritage_sites = relationship("HeritageSite", back_populates="city")


class HeritageSite(Base):
    __tablename__ = "heritage_sites"

    id = Column(Integer, primary_key=True)
    city_id = Column(Integer, ForeignKey("cities.id"), index=True, nullable=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True, nullable=True)
    name = Column(String, index=True)
    category = Column(String)  # Fort / Temple / Monument / Palace / Archaeological
    description = Column(Text)
    history = Column(Text)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    historical_period = Column(String)
    architecture = Column(Text)
    significance = Column(Text)
    famous_people = Column(Text)
    related_events = Column(Text)
    image_url = Column(String)
    featured = Column(Integer, default=0)

    # Heritage section (added by the heritage migration)
    slug = Column(String, index=True)
    heritage_type = Column(String, index=True)  # tangible | intangible | world
    region = Column(String)
    unesco_status = Column(String)  # WORLD | TENTATIVE | NOMINATED | INTANGIBLE
    unesco_year = Column(String)
    unesco_category = Column(String)
    google_360_url = Column(String)
    main_image = Column(String)
    established = Column(String)

    created_at = Column(String)
    updated_at = Column(String)

    city = relationship("City", back_populates="heritage_sites")
    state = relationship("State", back_populates="heritage_sites")
    images = relationship(
        "HeritageImage",
        back_populates="site",
        cascade="all, delete-orphan",
        order_by="HeritageImage.display_order",
    )


class HeritageCategory(Base):
    """Categories for the Heritage section.

    ``kind`` groups entries:
      * ``tangible``   -> man-made / natural / mixed
      * ``intangible`` -> art-form / cultural-practice categories
    """

    __tablename__ = "heritage_categories"

    id = Column(Integer, primary_key=True)
    slug = Column(String, index=True)
    name = Column(String, index=True)
    kind = Column(String, index=True)
    parent_slug = Column(String, nullable=True)
    description = Column(Text)
    image_url = Column(String)
    display_order = Column(Integer, default=0)


class HeritageImage(Base):
    __tablename__ = "heritage_images"

    id = Column(Integer, primary_key=True)
    heritage_site_id = Column(Integer, ForeignKey("heritage_sites.id"), index=True)
    url = Column(String)
    caption = Column(String)
    display_order = Column(Integer, default=0)

    site = relationship("HeritageSite", back_populates="images")


class Museum(Base):
    __tablename__ = "museums"

    id = Column(Integer, primary_key=True)
    city_id = Column(Integer, index=True, nullable=True)
    name = Column(String, index=True)
    description = Column(Text)
    collections = Column(Text)
    location = Column(String)
    image_url = Column(String)
    official_url = Column(String)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    category = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    location = Column(String)
    state_id = Column(Integer, index=True, nullable=True)
    city_id = Column(Integer, index=True, nullable=True)
    description = Column(Text)
    image_url = Column(String)
    organizer = Column(String)
    official_url = Column(String)
    registration_url = Column(String, nullable=True)
    event_type = Column(String, default="culture")  # "culture" | "ritual"
    bookable = Column(Integer, default=0)  # 1 = ticket booking available

    # Culture detail page fields (added for the festival detail flow)
    historical_background = Column(Text, nullable=True)
    cultural_significance = Column(Text, nullable=True)
    rituals_traditions = Column(Text, nullable=True)
    gallery_images = Column(Text, nullable=True)  # JSON array of image URLs
    state_name = Column(String, nullable=True)
    city_name = Column(String, nullable=True)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    date = Column(String)
    source = Column(String)
    summary = Column(Text)
    url = Column(String)


class CultureApp(Base):
    __tablename__ = "culture_apps"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    official_url = Column(String)
    image_url = Column(String)
    action = Column(String)


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    description = Column(Text)
    category = Column(String)
    eligibility = Column(Text)
    benefits = Column(Text)
    application_info = Column(Text)
    year = Column(String)
    organization = Column(String)
    official_url = Column(String)


class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    year = Column(String)
    recipient = Column(String)
    field = Column(String)
    citation = Column(Text)
    description = Column(Text)
    official_url = Column(String)


class Commemoration(Base):
    __tablename__ = "commemorations"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    period = Column(String)
    field = Column(String)
    contribution = Column(Text)
    significance = Column(Text)
    locations = Column(Text)
    people = Column(Text)
    related_events = Column(Text)
    sources = Column(Text)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    year = Column(String)
    organization = Column(String)
    description = Column(Text)
    doc_type = Column(String)
    source_url = Column(String)
    file_url = Column(String, nullable=True)
    rights_status = Column(String, default="LINK_ONLY")


class DocumentCategory(Base):
    """One of the Ministry of Culture document categories (Reports, Schemes …).

    ``slug`` is the canonical URL segment used by the frontend
    (e.g. ``circular-orders-notices``). ``display_order`` keeps the strict
    ordering used in the site navigation.
    """

    __tablename__ = "document_categories"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    icon = Column(String, nullable=True)
    display_order = Column(Integer, default=0)


class DocumentItem(Base):
    """An official Ministry of Culture document served by the Documents section.

    The actual file lives under ``data/documents/`` (extracted from the Ministry
    archive by :mod:`scripts.ingest_documents`); ``file_path`` stores the path
    relative to that root and ``file_url`` the public URL through which it is
    served by ``GET /api/documents/file/{id}``.
    """

    __tablename__ = "document_items"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    slug = Column(String, index=True)
    category = Column(String, index=True)  # DocumentCategory.slug
    file_path = Column(String)
    file_url = Column(String, nullable=True)
    file_type = Column(String)  # pdf / docx / doc / pptx …
    file_size = Column(Integer, default=0)
    published_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(String)


class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    biography = Column(Text)
    field = Column(String)
    period = Column(String)
    institutions = Column(Text)
    research = Column(Text)
    image_url = Column(String)

    publications = relationship("Publication", back_populates="author")


class Publication(Base):
    __tablename__ = "publications"

    id = Column(Integer, primary_key=True)
    author_id = Column(Integer, ForeignKey("authors.id"), nullable=True, index=True)
    title = Column(String, index=True)
    publisher = Column(String)
    year = Column(String)
    language = Column(String)
    subject = Column(String)
    isbn = Column(String, nullable=True)
    description = Column(Text)
    institution = Column(String, nullable=True)
    catalogue_url = Column(String, nullable=True)
    digital_url = Column(String, nullable=True)

    author = relationship("Author", back_populates="publications")


class MoU(Base):
    __tablename__ = "mous"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    parties = Column(String)
    date = Column(String)
    purpose = Column(Text)
    description = Column(Text)
    institution = Column(String)
    document_url = Column(String, nullable=True)
    source_url = Column(String)
    category = Column(String)


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    type = Column(String)
    location = Column(String)
    description = Column(Text)
    responsibilities = Column(Text)
    official_url = Column(String)


class MinistryProfile(Base):
    """Content for the homepage "About the Ministry" section (single row).

    The database is the source of truth: current facts about the Ministry
    (about/mission/vision text, organisation stats, action URLs) can be updated
    in place without any frontend code change.
    """

    __tablename__ = "ministry_profile"

    id = Column(Integer, primary_key=True)
    heading = Column(String)
    about = Column(Text)
    mission = Column(Text)
    vision = Column(Text)
    attached_offices = Column(Integer, default=0)
    subordinate_offices = Column(Integer, default=0)
    autonomous_organizations = Column(Integer, default=0)
    directory_url = Column(String)
    organisations_url = Column(String)
    source_name = Column(String)
    source_url = Column(String)
    updated_at = Column(String)


class MinistryLeader(Base):
    __tablename__ = "ministry_leaders"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    title = Column(String, nullable=True)  # e.g. "Hon'ble"
    designation = Column(String)  # e.g. "Minister of Culture"
    image_url = Column(String)
    official_url = Column(String)
    sort_order = Column(Integer, default=0)


class AboutEntry(Base):
    __tablename__ = "about_entries"

    id = Column(Integer, primary_key=True)
    section = Column(String)  # mission / presentation / objectives / functions / team
    title = Column(String)
    content = Column(Text)


class CommunityProfile(Base):
    __tablename__ = "community_profiles"

    id = Column(Integer, primary_key=True)
    display_name = Column(String)
    bio = Column(Text)
    interests = Column(Text)
    image_url = Column(String)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True)
    kind = Column(String)  # photo / experience / review / story
    title = Column(String)
    content = Column(Text)
    author_name = Column(String)
    status = Column(String, default="APPROVED")
    created_at = Column(String)
    related_resource = Column(String, nullable=True)
    related_city = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    supabase_user_id = Column(String, nullable=True)



class GovernmentProgramme(Base):
    __tablename__ = "government_programmes"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String)  # Campaign / Programme / Portal / Commemoration
    image_url = Column(String, nullable=True)
    official_url = Column(String)
    source_label = Column(String)  # issuing body, e.g. "Ministry of Culture"
    source_url = Column(String, nullable=True)
    active = Column(Integer, default=1)
    sort_order = Column(Integer, default=0)


class Provenance(Base):
    __tablename__ = "provenance"

    id = Column(Integer, primary_key=True)
    resource_type = Column(String, index=True)
    resource_id = Column(Integer, index=True)
    source_id = Column(String, nullable=True)
    organization = Column(String)
    dataset_name = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    retrieved_at = Column(String)
    last_updated = Column(String)
    license = Column(String, nullable=True)
    rights_status = Column(String)
    verification_status = Column(String)


# ---------------------------------------------------------------------------
# Media section (Explore ▸ Photos / Videos / Brochure / Bharat Beat / Sanskriti /
# Events / Latest News / Announcement / Webcast).
#
# Rows are populated by :mod:`app.seed_media` from the Ministry of Culture's
# official Media pages (culture.gov.in). ``source_url`` keeps official attribution
# on every record; image urls point at local copies under
# ``frontend/public/images/media/`` (so the prototype works offline).
# ---------------------------------------------------------------------------


class MediaNews(Base):
    """Ministry of Culture “Latest News” items (culture.gov.in/news)."""

    __tablename__ = "media_news"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    date = Column(String)  # DD.MM.YYYY as published by the Ministry
    image_url = Column(String)
    source_url = Column(String)  # official article URL
    display_order = Column(Integer, default=0)


class MediaAlbum(Base):
    """Ministry of Culture photo albums (culture.gov.in/photo-gallery)."""

    __tablename__ = "media_albums"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    date = Column(String)
    items_count = Column(Integer, default=0)
    cover_image = Column(String)
    gallery_url = Column(String)  # official album URL
    display_order = Column(Integer, default=0)


class MediaVideo(Base):
    """Ministry of Culture video library (culture.gov.in/video-gallery)."""

    __tablename__ = "media_videos"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    date = Column(String)
    duration = Column(String)  # as published, e.g. "4MINS 17SEC"
    language = Column(String, default="English")  # English | Hindi
    youtube_id = Column(String)  # official embed on the Ministry's site
    thumbnail_url = Column(String)
    display_order = Column(Integer, default=0)


class MediaBrochure(Base):
    """Ministry of Culture brochures (culture.gov.in/brochure)."""

    __tablename__ = "media_brochures"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    pdf_url = Column(String)  # official PDF document URL
    source_url = Column(String)
    display_order = Column(Integer, default=0)


class MediaLeader(Base):
    """Bharat Beat → Leader's Corner (culture.gov.in/leaders-corner)."""

    __tablename__ = "media_leaders"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    slug = Column(String, index=True)
    bio = Column(Text)
    image_url = Column(String)
    official_url = Column(String)
    display_order = Column(Integer, default=0)


class MediaMonument(Base):
    """Bharat Beat → 360 view of Monuments (culture.gov.in/monuments)."""

    __tablename__ = "media_monuments"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    image_url = Column(String)
    streetview_url = Column(String)  # Google Arts & Culture streetview
    display_order = Column(Integer, default=0)


class MediaArtist(Base):
    """Bharat Beat → Various Artist (culture.gov.in/various-artist)."""

    __tablename__ = "media_artists"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    category = Column(String)  # Dance | Music | Painting | Poet | Sculpture | Writer
    image_url = Column(String)
    official_url = Column(String)
    display_order = Column(Integer, default=0)


class MediaSanskriti(Base):
    """Curated collections from Sanskriti (culture.gov.in/sanskriti)."""

    __tablename__ = "media_sanskriti"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    slug = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    official_url = Column(String)
    source_label = Column(String, default="Ministry of Culture · Sanskriti")
    display_order = Column(Integer, default=0)


class MediaEvent(Base):
    """Ministry of Culture events (culture.gov.in/latests-events + /pasts-events).

    ``is_archive`` distinguishes past events (the official archive) from
    current/upcoming ones shown on the official “Events” page.
    """

    __tablename__ = "media_events"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    category = Column(String, index=True)
    start_date = Column(String)
    end_date = Column(String)
    venue = Column(Text)
    city = Column(String)
    state = Column(String)
    event_time = Column(String)
    image_url = Column(String)
    official_url = Column(String)
    is_archive = Column(Integer, default=1)
    display_order = Column(Integer, default=0)


class MediaWebcast(Base):
    """Ministry of Culture webcasts (culture.gov.in/webcast).

    The official page currently lists “No Web Cast data available”; rows are
    seeded when the Ministry publishes live/archived broadcasts.
    """

    __tablename__ = "media_webcasts"

    id = Column(Integer, primary_key=True)
    title = Column(String, index=True)
    date = Column(String)
    youtube_url = Column(String)
    is_live = Column(Integer, default=0)
    source_url = Column(String)
    display_order = Column(Integer, default=0)


class AuditLog(Base):
    """Audit log for administrative operations across all entities."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String, index=True)
    user_email = Column(String, nullable=True)
    action = Column(String, index=True)  # CREATE, UPDATE, DELETE, APPROVE, REJECT
    model_name = Column(String, index=True)
    record_id = Column(String, index=True)
    details = Column(Text, nullable=True)

