import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router
from app.core.config import settings

app = FastAPI(
    title="mobalance API",
    description="SaaS de gestão de compras, vendas e balanço mensal para pequenas empresas",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=(
        ["*"] if settings.ENVIRONMENT == "development"
        else [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve uploaded images
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"message": "mobalance API v0.1.0 — online"}


@app.get("/health")
def health():
    return {"status": "ok"}
