from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class PurchaseCreate(BaseModel):
    nome_produto: str
    quantidade: Decimal
    preco_unitario: Decimal
    data: date

    @field_validator("nome_produto")
    @classmethod
    def nome_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O nome do produto não pode estar vazio.")
        return v.strip()

    @field_validator("quantidade", "preco_unitario")
    @classmethod
    def positivo(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("O valor deve ser maior que zero.")
        return v


class PurchaseResponse(BaseModel):
    id: int
    nome_produto: str | None
    quantidade: Decimal
    preco_unitario: Decimal
    total: Decimal
    data: date
    criado_em: datetime

    model_config = {"from_attributes": True}


class PriceResult(BaseModel):
    supermercado: str
    nome: str
    preco: float
    unidade: str
    atualizado_em: str
