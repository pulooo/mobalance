from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class PeriodBalance(BaseModel):
    ano: int
    mes: int | None = None
    semana: int | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    total_vendas: Decimal
    total_compras: Decimal
    lucro: Decimal
    margem: Decimal
    produto_mais_lucrativo: str | None


# Alias para compatibilidade
MonthBalance = PeriodBalance


class HistoricoResponse(BaseModel):
    periodos: list[PeriodBalance]
