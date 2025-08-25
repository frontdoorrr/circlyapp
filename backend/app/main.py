from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app.config import settings
from app.api.v1 import auth, users, circles, polls, templates, notifications, test_utils

# Bearer 토큰 스키마 정의
bearer_scheme = HTTPBearer()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
    redirect_slashes=False  # 307 redirect 방지
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(auth.router, prefix="/v1", tags=["auth"])
app.include_router(users.router, prefix="/v1", tags=["users"])
app.include_router(circles.router, prefix="/v1", tags=["circles"])
app.include_router(polls.router, prefix="/v1/polls", tags=["polls"])
app.include_router(templates.router, prefix="/v1", tags=["templates"])
app.include_router(notifications.router, prefix="/v1", tags=["notifications"])
app.include_router(test_utils.router, prefix="/v1", tags=["test-utils"])

@app.get("/")
async def root():
    return {"message": settings.app_name, "version": settings.version}

@app.get("/health")
async def health_check():
    return {"status": "ok"}