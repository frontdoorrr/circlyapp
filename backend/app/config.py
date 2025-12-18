"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "circly"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = True
    secret_key: str = "your-super-secret-key-change-in-production"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/circly"
    db_pool_size: int = 20
    db_max_overflow: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    # CORS - empty list means it must be configured in production
    cors_origins: list[str] = []

    # Rate Limiting
    rate_limit_per_minute: int = 100

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def set_default_cors_origins(cls, v: list[str] | str | None) -> list[str]:
        """Set default CORS origins for development if not provided."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if not v:
            # Default origins for development only
            return ["http://localhost:19006", "exp://localhost:19000"]
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
