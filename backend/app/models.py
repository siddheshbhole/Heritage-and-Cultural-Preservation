from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


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

    state = relationship("State", back_populates="cities")
    heritage_sites = relationship("HeritageSite", back_populates="city")


class HeritageSite(Base):
    __tablename__ = "heritage_sites"

    id = Column(Integer, primary_key=True)
    city_id = Column(Integer, ForeignKey("cities.id"), index=True, nullable=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
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

    city = relationship("City", back_populates="heritage_sites")
    state = relationship("State", back_populates="heritage_sites")


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