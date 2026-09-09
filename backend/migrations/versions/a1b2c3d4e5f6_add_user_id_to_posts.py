"""add_user_id_to_posts

Revision ID: a1b2c3d4e5f6
Revises: 9f8e7d6c5b4a
Create Date: 2026-09-09 19:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9f8e7d6c5b4a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('community_posts', sa.Column('supabase_user_id', sa.String(), nullable=True))


def downgrade():
    op.drop_column('community_posts', 'supabase_user_id')
