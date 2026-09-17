"""heritage_guides: volunteer Heritage Guide registrations

Revision ID: f7a3b9c2d4e6
Revises: c4f8a2b9d1e3
Create Date: 2026-09-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7a3b9c2d4e6'
down_revision: Union[str, None] = 'c4f8a2b9d1e3'
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
    if _has_table("heritage_guides"):
        return
    op.create_table(
        "heritage_guides",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(160), nullable=False),
        sa.Column("state", sa.String(120), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_heritage_guides_status", "heritage_guides", ["status"])
    op.create_index("ix_heritage_guides_full_name", "heritage_guides", ["full_name"])
    op.create_index("ix_heritage_guides_state", "heritage_guides", ["state"])
    op.create_index("ix_heritage_guides_email", "heritage_guides", ["email"])


def downgrade() -> None:
    if _has_table("heritage_guides"):
        op.drop_index("ix_heritage_guides_status", table_name="heritage_guides")
        op.drop_index("ix_heritage_guides_full_name", table_name="heritage_guides")
        op.drop_index("ix_heritage_guides_state", table_name="heritage_guides")
        op.drop_index("ix_heritage_guides_email", table_name="heritage_guides")
        op.drop_table("heritage_guides")