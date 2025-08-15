from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, users, circles, polls

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug
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
app.include_router(polls.router, prefix="/v1", tags=["polls"])

@app.get("/")
async def root():
    return {"message": settings.app_name, "version": settings.version}

@app.get("/health")
async def health_check():
    return {"status": "ok"}