from fastapi import APIRouter

from app.api.v1 import admin, auth, balance, prices, purchases, sales, store_products

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(admin.router)
router.include_router(store_products.router)
router.include_router(sales.router)
router.include_router(balance.router)
router.include_router(purchases.router)
router.include_router(prices.router)
