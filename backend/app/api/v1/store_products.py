import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.store_product import StoreProductCreate, StoreProductResponse, StoreProductUpdate
from app.services import store_products_service

router = APIRouter(prefix="/store-products", tags=["produtos da loja"])

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("", response_model=list[StoreProductResponse])
def list_products(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return store_products_service.list_products(user.id, db, include_inactive)


@router.post("", response_model=StoreProductResponse, status_code=201)
def create_product(
    data: StoreProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return store_products_service.create_product(user.id, data, db)


@router.patch("/{product_id}", response_model=StoreProductResponse)
def update_product(
    product_id: int,
    data: StoreProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return store_products_service.update_product(user.id, product_id, data, db)


@router.post("/{product_id}/foto", response_model=StoreProductResponse)
async def upload_foto(
    product_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Só são aceites imagens JPEG, PNG ou WebP.",
        )

    contents = await file.read()
    if len(contents) > _MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="A imagem não pode ter mais de 5 MB.",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest_dir = os.path.join(settings.UPLOAD_DIR, "store-products")
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, filename)

    with open(dest_path, "wb") as f:
        f.write(contents)

    foto_url = f"/uploads/store-products/{filename}"
    return store_products_service.set_foto(user.id, product_id, foto_url, db)


@router.delete("/{product_id}", status_code=204)
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    store_products_service.deactivate_product(user.id, product_id, db)
