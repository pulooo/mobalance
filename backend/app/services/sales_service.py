from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.store_product import StoreProduct
from app.schemas.sale import SaleAnaliseItem, SaleLoteRequest, SaleResponse


def register_lote(user_id: int, data: SaleLoteRequest, db: Session) -> list[SaleResponse]:
    periodo = data.data.strftime("%Y-%m")
    criadas: list[Sale] = []

    for item in data.items:
        product = db.get(StoreProduct, item.store_product_id)
        if not product or product.user_id != user_id or not product.ativo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto #{item.store_product_id} não encontrado.",
            )
        sale = Sale(
            user_id=user_id,
            store_product_id=product.id,
            nome_produto=product.nome,
            quantidade=item.quantidade,
            preco_unitario=product.preco_venda,
            data=data.data,
            periodo=periodo,
        )
        db.add(sale)
        criadas.append(sale)

    db.commit()
    for s in criadas:
        db.refresh(s)

    return [
        SaleResponse(
            **{k: getattr(s, k) for k in [
                "id", "store_product_id", "nome_produto",
                "quantidade", "preco_unitario", "data", "periodo", "criado_em",
            ]},
            total=s.quantidade * s.preco_unitario,
        )
        for s in criadas
    ]


def get_analise(user_id: int, db: Session) -> list[SaleAnaliseItem]:
    rows = (
        db.query(
            Sale.nome_produto,
            func.sum(Sale.quantidade).label("total_quantidade"),
            func.sum(Sale.quantidade * Sale.preco_unitario).label("total_receita"),
        )
        .filter(Sale.user_id == user_id, Sale.nome_produto.isnot(None))
        .group_by(Sale.nome_produto)
        .order_by(func.sum(Sale.quantidade).desc())
        .all()
    )
    return [
        SaleAnaliseItem(
            nome_produto=r[0],
            total_quantidade=Decimal(str(r[1])),
            total_receita=Decimal(str(r[2])),
        )
        for r in rows
    ]


def list_sales(user_id: int, mes: int, ano: int, db: Session) -> list[SaleResponse]:
    periodo = f"{ano:04d}-{mes:02d}"
    sales = (
        db.query(Sale)
        .filter(Sale.user_id == user_id, Sale.periodo == periodo)
        .order_by(Sale.data.desc(), Sale.criado_em.desc())
        .all()
    )
    return [
        SaleResponse(
            **{k: getattr(s, k) for k in [
                "id", "store_product_id", "nome_produto",
                "quantidade", "preco_unitario", "data", "periodo", "criado_em",
            ]},
            total=s.quantidade * s.preco_unitario,
        )
        for s in sales
    ]
