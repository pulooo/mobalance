from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseResponse


def list_purchases(user_id: int, mes: int, ano: int, db: Session) -> list[PurchaseResponse]:
    from sqlalchemy import extract
    purchases = (
        db.query(Purchase)
        .filter(
            Purchase.user_id == user_id,
            extract("month", Purchase.data) == mes,
            extract("year", Purchase.data) == ano,
        )
        .order_by(Purchase.data.desc(), Purchase.criado_em.desc())
        .all()
    )
    return [
        PurchaseResponse(
            **{k: getattr(p, k) for k in [
                "id", "nome_produto", "quantidade", "preco_unitario", "data", "criado_em",
            ]},
            total=p.quantidade * p.preco_unitario,
        )
        for p in purchases
    ]


def create_purchase(user_id: int, data: PurchaseCreate, db: Session) -> PurchaseResponse:
    purchase = Purchase(
        user_id=user_id,
        nome_produto=data.nome_produto,
        quantidade=data.quantidade,
        preco_unitario=data.preco_unitario,
        data=data.data,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return PurchaseResponse(
        **{k: getattr(purchase, k) for k in [
            "id", "nome_produto", "quantidade", "preco_unitario", "data", "criado_em",
        ]},
        total=purchase.quantidade * purchase.preco_unitario,
    )


def delete_purchase(user_id: int, purchase_id: int, db: Session) -> None:
    from fastapi import HTTPException, status
    purchase = db.get(Purchase, purchase_id)
    if not purchase or purchase.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada.")
    db.delete(purchase)
    db.commit()
