"""Rebuild Guide System: database-driven guide profiles, tours, reviews, reports

Drops the legacy ``heritage_guides`` / ``guide_tours`` / ``guide_reports``
tables (orphaned by the removal of the old Vacancy module) and creates the
rebuilt tables backed by the new ``/api/guide`` endpoints:

* ``guide_profiles``   — 1:1 with an authenticated user (unique user_id)
* ``tour_assignments`` — the single source of truth for guide bookings
* ``guide_reviews``    — 1-5 star tourist reviews of a guide
* ``guide_reports``    — private reports, admin-visibility only

Note ``guide_reports`` is re-created: the legacy and rebuilt models share the
same table name but have incompatible columns.

Revision ID: c1d2e3f4a5b6
Revises: a9b2c4d6e8f0
Create Date: 2026-09-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'a9b2c4d6e8f0'
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
    # --- 1. Drop the legacy guide system tables ----------------------------
    for table in ("guide_reports", "guide_tours", "heritage_guides"):
        if _has_table(table):
            op.drop_table(table)

    # --- 2. guide_profiles -------------------------------------------------
    op.create_table(
        "guide_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(160), nullable=True),
        sa.Column("state", sa.String(120), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("availability", sa.String(20), nullable=False, server_default="open_to_work"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_guide_profiles_id", "guide_profiles", ["id"], unique=True)
    op.create_index("ix_guide_profiles_user_id", "guide_profiles", ["user_id"], unique=True)
    op.create_index("ix_guide_profiles_name", "guide_profiles", ["name"])
    op.create_index("ix_guide_profiles_phone", "guide_profiles", ["phone"])
    op.create_index("ix_guide_profiles_email", "guide_profiles", ["email"])
    op.create_index("ix_guide_profiles_state", "guide_profiles", ["state"])
    op.create_index("ix_guide_profiles_availability", "guide_profiles", ["availability"])
    op.create_index("ix_guide_profiles_created_at", "guide_profiles", ["created_at"])

    # --- 3. tour_assignments ----------------------------------------------
    op.create_table(
        "tour_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("guide_id", sa.Integer(), sa.ForeignKey("guide_profiles.id"), nullable=False),
        sa.Column("tourist_user_id", sa.String(255), nullable=False),
        sa.Column("site_id", sa.Integer(), nullable=True),
        sa.Column("site_name", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_tour_assignments_id", "tour_assignments", ["id"], unique=True)
    op.create_index("ix_tour_assignments_guide_id", "tour_assignments", ["guide_id"])
    op.create_index("ix_tour_assignments_tourist_user_id", "tour_assignments", ["tourist_user_id"])
    op.create_index("ix_tour_assignments_site_id", "tour_assignments", ["site_id"])
    op.create_index("ix_tour_assignments_site_name", "tour_assignments", ["site_name"])
    op.create_index("ix_tour_assignments_status", "tour_assignments", ["status"])
    op.create_index("ix_tour_assignments_created_at", "tour_assignments", ["created_at"])

    # --- 4. guide_reviews --------------------------------------------------
    op.create_table(
        "guide_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tour_id", sa.Integer(), sa.ForeignKey("tour_assignments.id"), nullable=False),
        sa.Column("guide_id", sa.Integer(), sa.ForeignKey("guide_profiles.id"), nullable=False),
        sa.Column("tourist_user_id", sa.String(255), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("review_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_guide_reviews_id", "guide_reviews", ["id"], unique=True)
    op.create_index("ix_guide_reviews_tour_id", "guide_reviews", ["tour_id"])
    op.create_index("ix_guide_reviews_guide_id", "guide_reviews", ["guide_id"])
    op.create_index("ix_guide_reviews_tourist_user_id", "guide_reviews", ["tourist_user_id"])
    op.create_index("ix_guide_reviews_created_at", "guide_reviews", ["created_at"])

    # --- 5. guide_reports (rebuilt) ----------------------------------------
    op.create_table(
        "guide_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tour_id", sa.Integer(), sa.ForeignKey("tour_assignments.id"), nullable=True),
        sa.Column("guide_id", sa.Integer(), sa.ForeignKey("guide_profiles.id"), nullable=False),
        sa.Column("tourist_user_id", sa.String(255), nullable=False),
        sa.Column("reason_category", sa.String(120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_guide_reports_id", "guide_reports", ["id"], unique=True)
    op.create_index("ix_guide_reports_tour_id", "guide_reports", ["tour_id"])
    op.create_index("ix_guide_reports_guide_id", "guide_reports", ["guide_id"])
    op.create_index("ix_guide_reports_tourist_user_id", "guide_reports", ["tourist_user_id"])
    op.create_index("ix_guide_reports_status", "guide_reports", ["status"])
    op.create_index("ix_guide_reports_created_at", "guide_reports", ["created_at"])


def downgrade() -> None:
    # --- 1. Drop the rebuilt tables (reverse dependency order) -------------
    for table in ("guide_reports", "guide_reviews", "tour_assignments", "guide_profiles"):
        if _has_table(table):
            op.drop_table(table)

    # --- 2. Restore the legacy guide tables ---------------------------------
    if not _has_table("heritage_guides"):
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
        op.add_column("heritage_guides", sa.Column("user_id", sa.String(255), nullable=True))
        op.add_column("heritage_guides", sa.Column("location", sa.String(255), nullable=True))
        op.add_column(
            "heritage_guides",
            sa.Column("availability", sa.String(20), nullable=False, server_default="free"),
        )
        op.add_column("heritage_guides", sa.Column("assigned_site", sa.String(255), nullable=True))
        op.create_index("ix_heritage_guides_status", "heritage_guides", ["status"])
        op.create_index("ix_heritage_guides_full_name", "heritage_guides", ["full_name"])
        op.create_index("ix_heritage_guides_state", "heritage_guides", ["state"])
        op.create_index("ix_heritage_guides_email", "heritage_guides", ["email"])
        op.create_index("ix_heritage_guides_user_id", "heritage_guides", ["user_id"])
        op.create_index("ix_heritage_guides_availability", "heritage_guides", ["availability"])

    if not _has_table("guide_tours"):
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

    # Legacy GuideReport shared the "guide_reports" name; restore the old shape.
    if not _has_table("guide_reports"):
        op.create_table(
            "guide_reports",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("guide_id", sa.Integer(), nullable=False),
            sa.Column("tourist_user_id", sa.String(255), nullable=True),
            sa.Column("reason_category", sa.String(120), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(20), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )