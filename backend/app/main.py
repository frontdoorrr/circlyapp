"""FastAPI application factory and configuration."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request as StarletteRequest

from app.config import get_settings
from app.core.exceptions import CirclyError
from app.core.rate_limit import limiter


def _custom_rate_limit_handler(request: StarletteRequest, exc: Exception) -> Response:
    """Custom rate limit handler that matches Starlette's expected signature."""
    return _rate_limit_exceeded_handler(request, cast(RateLimitExceeded, exc))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
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

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _custom_rate_limit_handler)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    @app.exception_handler(CirclyError)
    async def circly_error_handler(request: Request, exc: CirclyError) -> JSONResponse:
        """Handle CirclyError exceptions and return JSON response."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    **exc.details,
                },
            },
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

    # Register routers
    from app.modules.auth.router import router as auth_router
    from app.modules.circles.router import router as circles_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.polls.router import router as polls_router
    from app.modules.reports.router import router as reports_router

    app.include_router(auth_router)
    app.include_router(circles_router)
    app.include_router(notifications_router)
    app.include_router(polls_router)
    app.include_router(reports_router)

    return app


# Create application instance
app = create_app()
