"""heritage section: site columns, categories, images

Revision ID: 7f2a1c9b4e5d
Revises: 343c706628e7
Create Date: 2026-09-06 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7f2a1c9b4e5d'
down_revision: Union[str, None] = '343c706628e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Guard helpers
#
# The tables/columns below may already exist: ``Base.metadata.create_all`` runs
# at app startup and this migration may be applied against a database that was
# created by the app rather than by a previous Alembic run.  Every DDL step is
# therefore guarded so ``alembic upgrade head`` is a safe no-op when the schema
# objects already exist (also keeps re-applies safe on SQLite).
# ---------------------------------------------------------------------------


def _bind():
    return op.get_bind()


def _has_table(name: str) -> bool:
    insp = sa.inspect(_bind())
    return name in insp.get_table_names()


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(_bind())
    try:
        cols = insp.get_columns(table)
    except Exception:
        return False
    return any(c["name"] == column for c in cols)


def _has_index(table: str, index: str) -> bool:
    insp = sa.inspect(_bind())
    return index in {i["name"] for i in insp.get_indexes(table)}


def _create_index(name: str, table: str, columns: list[str], unique: bool = False):
    if not _has_index(table, name):
        op.create_index(name, table, columns, unique=unique)


def upgrade() -> None:
    # --- extend heritage_sites (nullable only; SQLite ALTER can't add NOT NULL) ---
    site_columns = [
        ("slug", sa.String(64)),
        ("heritage_type", sa.String(32)),
        ("region", sa.String(64)),
        ("unesco_status", sa.String(32)),
        ("unesco_year", sa.String(16)),
        ("unesco_category", sa.String(128)),
        ("google_360_url", sa.String(512)),
        ("main_image", sa.String(512)),
        ("established", sa.String(64)),
        ("created_at", sa.String()),
        ("updated_at", sa.String()),
    ]
    if _has_table("heritage_sites"):
        for col, coltype in site_columns:
            if not _has_column("heritage_sites", col):
                op.add_column(
                    "heritage_sites",
                    sa.Column(col, coltype, nullable=True),
                )

    # --- heritage_categories ---
    if not _has_table("heritage_categories"):
        op.create_table(
            "heritage_categories",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("slug", sa.String(64), nullable=True),
            sa.Column("name", sa.String(128), nullable=True),
            sa.Column("kind", sa.String(32), nullable=True),
            sa.Column("parent_slug", sa.String(64), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("image_url", sa.String(512), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=True),
        )
    if _has_table("heritage_categories"):
        _create_index("ix_heritage_categories_slug", "heritage_categories", ["slug"])
        _create_index("ix_heritage_categories_name", "heritage_categories", ["name"])
        _create_index("ix_heritage_categories_kind", "heritage_categories", ["kind"])

    # --- heritage_images ---
    if not _has_table("heritage_images"):
        op.create_table(
            "heritage_images",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "heritage_site_id",
                sa.Integer(),
                sa.ForeignKey("heritage_sites.id"),
                nullable=True,
            ),
            sa.Column("url", sa.String(512), nullable=True),
            sa.Column("caption", sa.String(255), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=True),
        )
    if _has_table("heritage_images"):
        _create_index(
            "ix_heritage_images_heritage_site_id",
            "heritage_images",
            ["heritage_site_id"],
        )

    # site-column indexes
    if _has_table("heritage_sites"):
        _create_index("ix_heritage_sites_slug", "heritage_sites", ["slug"])
        _create_index("ix_heritage_sites_heritage_type", "heritage_sites", ["heritage_type"])


def downgrade() -> None:
    if _has_index("heritage_images", "ix_heritage_images_heritage_site_id"):
        op.drop_index(
            "ix_heritage_images_heritage_site_id",
            table_name="heritage_images",
        )
    if _has_table("heritage_images"):
        op.drop_table("heritage_images")
    if _has_table("heritage_categories"):
        op.drop_table("heritage_categories")

    site_columns = [
        "updated_at", "created_at", "established", "main_image",
        "google_360_url", "unesco_category", "unesco_year", "unesco_status",
        "region", "heritage_type", "slug",
    ]
    if _has_table("heritage_sites"):
        for col in site_columns:
            if _has_column("heritage_sites", col):
                op.drop_column("heritage_sites", col)