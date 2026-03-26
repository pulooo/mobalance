"""add foto_url to store_products

Revision ID: 003
Revises: 002
Create Date: 2026-03-26
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("store_products", sa.Column("foto_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("store_products", "foto_url")
