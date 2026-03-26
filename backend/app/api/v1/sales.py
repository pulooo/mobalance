from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.sale import SaleAnaliseItem, SaleLoteRequest, SaleResponse
from app.services import sales_service

router = APIRouter(prefix="/sales", tags=["vendas"])


@router.post("/lote", response_model=list[SaleResponse], status_code=201)
def register_lote(
    data: SaleLoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Regista um lote de vendas de uma vez (ex: vendas da semana)."""
    return sales_service.register_lote(user.id, data, db)


@router.get("/analise", response_model=list[SaleAnaliseItem])
def get_analise(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Quantidade e receita total por produto (todos os tempos)."""
    return sales_service.get_analise(user.id, db)


@router.get("", response_model=list[SaleResponse])
def list_sales(
    mes: int,
    ano: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return sales_service.list_sales(user.id, mes, ano, db)
