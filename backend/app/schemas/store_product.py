from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class StoreProductCreate(BaseModel):
    nome: str
    preco_venda: Decimal
    unidade: str = "un"

    @field_validator("nome")
    @classmethod
    def nome_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O nome não pode estar vazio.")
        return v.strip()

    @field_validator("preco_venda")
    @classmethod
    def preco_positivo(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("O preço deve ser maior que zero.")
        return v


class StoreProductUpdate(BaseModel):
    nome: str | None = None
    preco_venda: Decimal | None = None
    unidade: str | None = None
    ativo: bool | None = None

    @field_validator("preco_venda")
    @classmethod
    def preco_positivo(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("O preço deve ser maior que zero.")
        return v


class StoreProductResponse(BaseModel):
    id: int
    user_id: int
    nome: str
    preco_venda: Decimal
    unidade: str
    foto_url: str | None
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
