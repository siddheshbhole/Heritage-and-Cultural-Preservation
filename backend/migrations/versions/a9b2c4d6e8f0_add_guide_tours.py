"""guide_tours: persistent tourist↔site↔guide assignment table

Revision ID: a9b2c4d6e8f0
Revises: f8b4c3d5e6f7
Create Date: 2026-09-17 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a9b2c4d6e8f0'
down_revision: Union[str, None] = 'f8b4c3d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _has_table(table: str) -> bool:
    insp = sa.inspect(_bind())
    try:
        insp.get_columns(table)
        return True
    except Exception:
        return False


def upgrade() -> None:
    if _has_table("guide_tours"):
        return
    op.create_table(
        "guide_tours",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("guide_id", sa.Integer(), nullable=False),
        sa.Column("heritage_site_id", sa.Integer(), nullable=True),
        sa.Column("site_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("tourist_user_id", sa.String(255), nullable=True),
        sa.Column("tourist_name", sa.String(120), nullable=True),
        sa.Column("tourist_email", sa.String(160), nullable=True),
        sa.Column("tourist_phone", sa.String(20), nullable=True),
        sa.Column("tour_token", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_guide_tours_guide_id", "guide_tours", ["guide_id"])
    op.create_index("ix_guide_tours_heritage_site_id", "guide_tours", ["heritage_site_id"])
    op.create_index("ix_guide_tours_status", "guide_tours", ["status"])
    op.create_index("ix_guide_tours_tourist_user_id", "guide_tours", ["tourist_user_id"])
    op.create_index("ix_guide_tours_tour_token", "guide_tours", ["tour_token"])


def downgrade() -> None:
    if not _has_table("guide_tours"):
        return
    op.drop_index("ix_guide_tours_tour_token", table_name="guide_tours")
    op.drop_index("ix_guide_tours_tourist_user_id", table_name="guide_tours")
    op.drop_index("ix_guide_tours_status", table_name="guide_tours")
    op.drop_index("ix_guide_tours_heritage_site_id", table_name="guide_tours")
    op.drop_index("ix_guide_tours_guide_id", table_name="guide_tours")
    op.drop_table("guide_tours")