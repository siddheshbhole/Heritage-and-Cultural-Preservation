"""add media_videos.source_name for non-Ministry heritage videos

The Media ▸ Video Gallery was seeded exclusively from the Ministry of
Culture's own YouTube channel, so every row was implicitly attributable to
the Ministry. Heritage videos published on other channels (Prasar Bharati's
DD India, MyGov, the PMO channel, and non-government publishers) are now
listed alongside them, so each row needs to name its actual publishing
channel. The column is nullable: ``NULL`` keeps the original meaning of
"Ministry of Culture, Government of India".

Revision ID: d3e4f5a6b7c8
Revises: c1d2e3f4a5b6
Create Date: 2026-09-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _has_table(name: str) -> bool:
    insp = sa.inspect(_bind())
    return name in insp.get_table_names()


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(_bind())
    return column in {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    if _has_table("media_videos") and not _has_column("media_videos", "source_name"):
        op.add_column(
            "media_videos",
            sa.Column("source_name", sa.String(128), nullable=True),
        )


def downgrade() -> None:
    if _has_table("media_videos") and _has_column("media_videos", "source_name"):
        op.drop_column("media_videos", "source_name")
