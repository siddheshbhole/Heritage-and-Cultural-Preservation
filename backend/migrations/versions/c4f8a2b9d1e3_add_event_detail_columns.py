"""events: detail/content columns for culture pages

Revision ID: c4f8a2b9d1e3
Revises: a1b2c3d4e5f6
Create Date: 2026-09-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4f8a2b9d1e3'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Guard helpers (see heritage_section migration for rationale)


def _bind():
    return op.get_bind()


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(_bind())
    try:
        cols = insp.get_columns(table)
    except Exception:
        return False
    return any(c["name"] == column for c in cols)


def upgrade() -> None:
    columns = [
        ("historical_background", sa.Text()),
        ("cultural_significance", sa.Text()),
        ("rituals_traditions", sa.Text()),
        ("gallery_images", sa.Text()),
        ("state_name", sa.String(120)),
        ("city_name", sa.String(120)),
    ]
    for col, coltype in columns:
        if not _has_column("events", col):
            op.add_column("events", sa.Column(col, coltype, nullable=True))


def downgrade() -> None:
    for col in [
        "city_name", "state_name", "gallery_images",
        "rituals_traditions", "cultural_significance", "historical_background",
    ]:
        if _has_column("events", col):
            op.drop_column("events", col)