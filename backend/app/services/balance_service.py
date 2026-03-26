from datetime import date
from decimal import Decimal

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.models.sale import Sale
from app.schemas.balance import HistoricoResponse, PeriodBalance


def _calc_month(user_id: int, mes: int, ano: int, db: Session) -> PeriodBalance:
    periodo = f"{ano:04d}-{mes:02d}"

    receita_row = (
        db.query(func.sum(Sale.quantidade * Sale.preco_unitario))
        .filter(Sale.user_id == user_id, Sale.periodo == periodo)
        .scalar()
    )
    total_vendas = Decimal(str(receita_row or 0))

    custo_row = (
        db.query(func.sum(Purchase.quantidade * Purchase.preco_unitario))
        .filter(
            Purchase.user_id == user_id,
            extract("month", Purchase.data) == mes,
            extract("year", Purchase.data) == ano,
        )
        .scalar()
    )
    total_compras = Decimal(str(custo_row or 0))

    lucro = total_vendas - total_compras
    margem = (lucro / total_vendas * 100).quantize(Decimal("0.01")) if total_vendas > 0 else Decimal("0")

    top = (
        db.query(Sale.nome_produto, func.sum(Sale.quantidade * Sale.preco_unitario).label("receita"))
        .filter(Sale.user_id == user_id, Sale.periodo == periodo)
        .group_by(Sale.nome_produto)
        .order_by(func.sum(Sale.quantidade * Sale.preco_unitario).desc())
        .first()
    )

    return PeriodBalance(
        mes=mes,
        ano=ano,
        total_vendas=total_vendas,
        total_compras=total_compras,
        lucro=lucro,
        margem=margem,
        produto_mais_lucrativo=top[0] if top else None,
    )


def _calc_week(user_id: int, semana: int, ano: int, db: Session) -> PeriodBalance:
    data_inicio = date.fromisocalendar(ano, semana, 1)  # Segunda
    data_fim = date.fromisocalendar(ano, semana, 7)     # Domingo

    receita_row = (
        db.query(func.sum(Sale.quantidade * Sale.preco_unitario))
        .filter(
            Sale.user_id == user_id,
            Sale.data >= data_inicio,
            Sale.data <= data_fim,
        )
        .scalar()
    )
    total_vendas = Decimal(str(receita_row or 0))

    custo_row = (
        db.query(func.sum(Purchase.quantidade * Purchase.preco_unitario))
        .filter(
            Purchase.user_id == user_id,
            Purchase.data >= data_inicio,
            Purchase.data <= data_fim,
        )
        .scalar()
    )
    total_compras = Decimal(str(custo_row or 0))

    lucro = total_vendas - total_compras
    margem = (lucro / total_vendas * 100).quantize(Decimal("0.01")) if total_vendas > 0 else Decimal("0")

    top = (
        db.query(Sale.nome_produto, func.sum(Sale.quantidade * Sale.preco_unitario).label("receita"))
        .filter(
            Sale.user_id == user_id,
            Sale.data >= data_inicio,
            Sale.data <= data_fim,
        )
        .group_by(Sale.nome_produto)
        .order_by(func.sum(Sale.quantidade * Sale.preco_unitario).desc())
        .first()
    )

    return PeriodBalance(
        semana=semana,
        ano=ano,
        data_inicio=data_inicio,
        data_fim=data_fim,
        total_vendas=total_vendas,
        total_compras=total_compras,
        lucro=lucro,
        margem=margem,
        produto_mais_lucrativo=top[0] if top else None,
    )


def get_balance(
    user_id: int,
    periodo: str,
    mes: int | None,
    ano: int,
    semana: int | None,
    db: Session,
) -> PeriodBalance:
    if periodo == "semanal":
        semana = semana or date.today().isocalendar()[1]
        return _calc_week(user_id, semana, ano, db)
    else:
        mes = mes or date.today().month
        return _calc_month(user_id, mes, ano, db)


def get_historico(user_id: int, periodo: str, db: Session) -> HistoricoResponse:
    today = date.today()
    periodos: list[PeriodBalance] = []

    if periodo == "semanal":
        iso = today.isocalendar()
        w, y = iso[1], iso[0]
        for _ in range(4):
            periodos.append(_calc_week(user_id, w, y, db))
            w -= 1
            if w == 0:
                y -= 1
                # Dec 28 é sempre na última semana do ano
                w = date(y, 12, 28).isocalendar()[1]
    else:
        m, y = today.month, today.year
        for _ in range(3):
            periodos.append(_calc_month(user_id, m, y, db))
            m -= 1
            if m == 0:
                m = 12
                y -= 1

    periodos.reverse()
    return HistoricoResponse(periodos=periodos)


# Mantém compatibilidade com chamadas antigas
def get_month_balance(user_id: int, mes: int, ano: int, db: Session) -> PeriodBalance:
    return _calc_month(user_id, mes, ano, db)
