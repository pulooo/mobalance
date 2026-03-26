from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://mobalance:mobalance@localhost:5432/mobalance"
    SECRET_KEY: str = "muda-esta-chave"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ADMIN_EMAIL: str = "admin@mobalance.pt"
    ENVIRONMENT: str = "development"
    UPLOAD_DIR: str = "uploads"
    # Origens permitidas em produção (separadas por vírgula)
    ALLOWED_ORIGINS: str = "https://mobalance.vercel.app"


settings = Settings()
