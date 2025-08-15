from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "Circly API"
    debug: bool = True
    version: str = "1.0.0"
    environment: str = "development"
    
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None
    
    redis_url: str = "redis://localhost:6379/0"
    expo_access_token: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()