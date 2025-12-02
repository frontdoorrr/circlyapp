"""FastAPI application factory and configuration."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    settings = get_settings()
    if settings.debug:
        print(f"Starting {settings.app_name} in {settings.app_env} mode...")

    yield

    # Shutdown
    if settings.debug:
        print("Shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Circly API",
        description="익명 칭찬 투표 플랫폼 API",
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        """Health check endpoint."""
        return {"status": "healthy"}

    # Root endpoint
    @app.get("/", tags=["Root"])
    async def root() -> dict[str, str]:
        """Root endpoint."""
        return {"message": "Welcome to Circly API", "docs": "/docs"}

    return app


# Create application instance
app = create_app()
