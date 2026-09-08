"""media section: news, albums, videos, brochures, bharat beat, sanskriti, events, webcasts

Revision ID: 9f8e7d6c5b4a
Revises: 7f2a1c9b4e5d
Create Date: 2026-09-08 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9f8e7d6c5b4a'
down_revision: Union[str, None] = '7f2a1c9b4e5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Guard helpers
#
# ``Base.metadata.create_all`` runs at app startup and may already have created
# these tables, so every step is guarded to make ``alembic upgrade head`` a
# safe no-op when the schema objects already exist (SQLite-safe re-applies).
# ---------------------------------------------------------------------------


def _bind():
    return op.get_bind()


def _has_table(name: str) -> bool:
    insp = sa.inspect(_bind())
    return name in insp.get_table_names()


def _has_index(table: str, index: str) -> bool:
    insp = sa.inspect(_bind())
    return index in {i["name"] for i in insp.get_indexes(table)}


def _create_index(name: str, table: str, columns: list[str], unique: bool = False):
    if _has_table(table) and not _has_index(table, name):
        op.create_index(name, table, columns, unique=unique)


def _create(name: str, *columns: sa.Column):
    if not _has_table(name):
        op.create_table(name, *columns)


def upgrade() -> None:
    _create(
        "media_news",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("date", sa.String(16), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("source_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_news_title", "media_news", ["title"])

    _create(
        "media_albums",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("date", sa.String(16), nullable=True),
        sa.Column("items_count", sa.Integer(), nullable=True),
        sa.Column("cover_image", sa.String(512), nullable=True),
        sa.Column("gallery_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_albums_title", "media_albums", ["title"])

    _create(
        "media_videos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("date", sa.String(16), nullable=True),
        sa.Column("duration", sa.String(32), nullable=True),
        sa.Column("language", sa.String(16), nullable=True),
        sa.Column("youtube_id", sa.String(64), nullable=True),
        sa.Column("thumbnail_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_videos_title", "media_videos", ["title"])

    _create(
        "media_brochures",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("pdf_url", sa.String(512), nullable=True),
        sa.Column("source_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_brochures_title", "media_brochures", ["title"])

    _create(
        "media_leaders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(128), nullable=True),
        sa.Column("slug", sa.String(64), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("official_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_leaders_name", "media_leaders", ["name"])
    _create_index("ix_media_leaders_slug", "media_leaders", ["slug"])

    _create(
        "media_monuments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(128), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("streetview_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_monuments_name", "media_monuments", ["name"])

    _create(
        "media_artists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(128), nullable=True),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("official_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_artists_name", "media_artists", ["name"])

    _create(
        "media_sanskriti",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(256), nullable=True),
        sa.Column("slug", sa.String(64), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("official_url", sa.String(512), nullable=True),
        sa.Column("source_label", sa.String(128), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_sanskriti_title", "media_sanskriti", ["title"])
    _create_index("ix_media_sanskriti_slug", "media_sanskriti", ["slug"])

    _create(
        "media_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("start_date", sa.String(16), nullable=True),
        sa.Column("end_date", sa.String(16), nullable=True),
        sa.Column("venue", sa.Text(), nullable=True),
        sa.Column("city", sa.String(64), nullable=True),
        sa.Column("state", sa.String(64), nullable=True),
        sa.Column("event_time", sa.String(16), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("official_url", sa.String(512), nullable=True),
        sa.Column("is_archive", sa.Integer(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_events_title", "media_events", ["title"])
    _create_index("ix_media_events_category", "media_events", ["category"])

    _create(
        "media_webcasts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("date", sa.String(64), nullable=True),
        sa.Column("youtube_url", sa.String(512), nullable=True),
        sa.Column("is_live", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.String(512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=True),
    )
    _create_index("ix_media_webcasts_title", "media_webcasts", ["title"])


def downgrade() -> None:
    for table in [
        "media_webcasts",
        "media_events",
        "media_sanskriti",
        "media_artists",
        "media_monuments",
        "media_leaders",
        "media_brochures",
        "media_videos",
        "media_albums",
        "media_news",
    ]:
        if _has_table(table):
            op.drop_table(table)