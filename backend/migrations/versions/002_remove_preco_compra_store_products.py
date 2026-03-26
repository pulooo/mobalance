"""remove preco_compra from store_products

Revision ID: 002
Revises: 001
Create Date: 2026-03-25
"""
import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("store_products", "preco_compra")


def downgrade() -> None:
    op.add_column(
        "store_products",
        sa.Column("preco_compra", sa.Numeric(10, 2), nullable=True),
    )
