"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_admin", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("data_expiracao", sa.Date, nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # suppliers
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("regiao", sa.String(255), nullable=True),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # products
    op.create_table(
        "products",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("categoria", sa.String(100), nullable=True),
        sa.Column("unidade", sa.String(50), nullable=False, server_default="un"),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # supplier_prices
    op.create_table(
        "supplier_prices",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("supplier_id", sa.Integer, sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("preco", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("supplier_id", "product_id"),
    )
    op.create_index("ix_supplier_prices_product", "supplier_prices", ["product_id"])

    # store_products
    op.create_table(
        "store_products",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("preco_compra", sa.Numeric(10, 2), nullable=False),
        sa.Column("preco_venda", sa.Numeric(10, 2), nullable=False),
        sa.Column("unidade", sa.String(50), nullable=False, server_default="un"),
        sa.Column("ativo", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("user_id", "nome"),
    )
    op.create_index("ix_store_products_user", "store_products", ["user_id"])

    # purchases
    op.create_table(
        "purchases",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("supplier_id", sa.Integer, sa.ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nome_produto", sa.String(255), nullable=True),
        sa.Column("quantidade", sa.Numeric(10, 3), nullable=False),
        sa.Column("preco_unitario", sa.Numeric(10, 2), nullable=False),
        sa.Column("data", sa.Date, nullable=False, server_default=sa.text("CURRENT_DATE")),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_purchases_user_data", "purchases", ["user_id", "data"])

    # sales
    op.create_table(
        "sales",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("store_product_id", sa.Integer, sa.ForeignKey("store_products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nome_produto", sa.String(255), nullable=True),
        sa.Column("quantidade", sa.Numeric(10, 3), nullable=False),
        sa.Column("preco_unitario", sa.Numeric(10, 2), nullable=False),
        sa.Column("data", sa.Date, nullable=False, server_default=sa.text("CURRENT_DATE")),
        sa.Column("periodo", sa.String(7), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_sales_user_data", "sales", ["user_id", "data"])
    op.create_index("ix_sales_periodo", "sales", ["user_id", "periodo"])

    # monthly_balance
    op.create_table(
        "monthly_balance",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mes", sa.SmallInteger, nullable=False),
        sa.Column("ano", sa.SmallInteger, nullable=False),
        sa.Column("total_compras", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_vendas", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("produto_mais_lucrativo", sa.String(255), nullable=True),
        sa.Column(
            "calculado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("user_id", "mes", "ano"),
        sa.CheckConstraint("mes BETWEEN 1 AND 12", name="ck_monthly_balance_mes"),
    )
    op.create_index("ix_monthly_balance_user", "monthly_balance", ["user_id", "ano", "mes"])


def downgrade() -> None:
    op.drop_table("monthly_balance")
    op.drop_table("sales")
    op.drop_table("purchases")
    op.drop_table("store_products")
    op.drop_table("supplier_prices")
    op.drop_table("products")
    op.drop_table("suppliers")
    op.drop_table("users")
