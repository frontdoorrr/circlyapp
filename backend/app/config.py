"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

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

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    # CORS
    cors_origins: list[str] = ["http://localhost:19006", "exp://localhost:19000"]

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


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
