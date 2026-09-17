"""heritage_guides: guide ownership + availability + assigned site

Revision ID: f8b4c3d5e6f7
Revises: f7a3b9c2d4e6
Create Date: 2026-09-17 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f8b4c3d5e6f7'
down_revision: Union[str, None] = 'f7a3b9c2d4e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(_bind())
    try:
        return column in [c["name"] for c in insp.get_columns(table)]
    except Exception:
        return False


def upgrade() -> None:
    if _has_column("heritage_guides", "user_id"):
        return
    op.add_column("heritage_guides", sa.Column("user_id", sa.String(255), nullable=True))
    op.add_column("heritage_guides", sa.Column("location", sa.String(255), nullable=True))
    op.add_column(
        "heritage_guides",
        sa.Column("availability", sa.String(20), nullable=False, server_default="free"),
    )
    op.add_column("heritage_guides", sa.Column("assigned_site", sa.String(255), nullable=True))
    op.create_index("ix_heritage_guides_user_id", "heritage_guides", ["user_id"])
    op.create_index("ix_heritage_guides_availability", "heritage_guides", ["availability"])


def downgrade() -> None:
    if not _has_column("heritage_guides", "user_id"):
        return
    op.drop_index("ix_heritage_guides_availability", table_name="heritage_guides")
    op.drop_index("ix_heritage_guides_user_id", table_name="heritage_guides")
    op.drop_column("heritage_guides", "assigned_site")
    op.drop_column("heritage_guides", "availability")
    op.drop_column("heritage_guides", "location")
    op.drop_column("heritage_guides", "user_id")