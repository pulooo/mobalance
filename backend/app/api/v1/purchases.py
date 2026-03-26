from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.services import purchases_service

router = APIRouter(prefix="/purchases", tags=["compras"])


@router.get("", response_model=list[PurchaseResponse])
def list_purchases(
    mes: int | None = None,
    ano: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    return purchases_service.list_purchases(
        user.id,
        mes or today.month,
        ano or today.year,
        db,
    )


@router.post("", response_model=PurchaseResponse, status_code=201)
def create_purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return purchases_service.create_purchase(user.id, data, db)


@router.delete("/{purchase_id}", status_code=204)
def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    purchases_service.delete_purchase(user.id, purchase_id, db)
