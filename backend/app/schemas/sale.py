from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class SaleItem(BaseModel):
    store_product_id: int
    quantidade: Decimal

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("A quantidade deve ser maior que zero.")
        return v


class SaleLoteRequest(BaseModel):
    """Regista um lote de vendas de uma vez (ex: vendas da semana)."""
    data: date
    items: list[SaleItem]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("É preciso ter pelo menos um produto.")
        return v


class SaleResponse(BaseModel):
    id: int
    store_product_id: int | None
    nome_produto: str | None
    quantidade: Decimal
    preco_unitario: Decimal
    total: Decimal
    data: date
    periodo: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class SaleAnaliseItem(BaseModel):
    nome_produto: str
    total_quantidade: Decimal
    total_receita: Decimal
