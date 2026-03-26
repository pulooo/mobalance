from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nome: str
    ativo: bool
    is_admin: bool
    data_expiracao: date | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    ativo: bool | None = None
    data_expiracao: date | None = None
