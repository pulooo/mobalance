from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.balance import HistoricoResponse, PeriodBalance
from app.services import balance_service

router = APIRouter(prefix="/balance", tags=["balanço"])


@router.get("", response_model=PeriodBalance)
def get_balance(
    periodo: str = Query(default="mensal"),
    mes: int | None = Query(default=None, ge=1, le=12),
    semana: int | None = Query(default=None, ge=1, le=53),
    ano: int | None = Query(default=None, ge=2000),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    return balance_service.get_balance(
        user.id,
        periodo=periodo,
        mes=mes,
        ano=ano or today.year,
        semana=semana,
        db=db,
    )


@router.get("/historico", response_model=HistoricoResponse)
def get_historico(
    periodo: str = Query(default="mensal"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return balance_service.get_historico(user.id, periodo=periodo, db=db)
