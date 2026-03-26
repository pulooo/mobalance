from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.store_product import StoreProduct
from app.schemas.store_product import StoreProductCreate, StoreProductUpdate


def list_products(user_id: int, db: Session, include_inactive: bool = False) -> list[StoreProduct]:
    q = db.query(StoreProduct).filter(StoreProduct.user_id == user_id)
    if not include_inactive:
        q = q.filter(StoreProduct.ativo == True)  # noqa: E712
    return q.order_by(StoreProduct.nome).all()


def create_product(user_id: int, data: StoreProductCreate, db: Session) -> StoreProduct:
    existing = (
        db.query(StoreProduct)
        .filter(StoreProduct.user_id == user_id, StoreProduct.nome == data.nome)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já tens um produto com o nome '{data.nome}'.",
        )
    product = StoreProduct(
        user_id=user_id,
        nome=data.nome,
        preco_venda=data.preco_venda,
        unidade=data.unidade,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(user_id: int, product_id: int, data: StoreProductUpdate, db: Session) -> StoreProduct:
    product = _get_own_product(user_id, product_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def set_foto(user_id: int, product_id: int, foto_url: str, db: Session) -> StoreProduct:
    product = _get_own_product(user_id, product_id, db)
    product.foto_url = foto_url
    db.commit()
    db.refresh(product)
    return product


def deactivate_product(user_id: int, product_id: int, db: Session) -> None:
    product = _get_own_product(user_id, product_id, db)
    product.ativo = False
    db.commit()


def _get_own_product(user_id: int, product_id: int, db: Session) -> StoreProduct:
    product = db.get(StoreProduct, product_id)
    if not product or product.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
    return product
