# Deployment & Infrastructure - 배포 및 인프라 구성

## 인프라 아키텍처 개요

### 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Client Apps"
        A[React Native iOS]
        B[React Native Android]
        C[Web Landing Page]
    end
    
    subgraph "CDN & Load Balancing"
        D[Cloudflare CDN]
        E[Load Balancer]
    end
    
    subgraph "Application Layer"
        F[FastAPI Backend]
        G[Background Workers]
        H[WebSocket Server]
    end
    
    subgraph "Data Layer"
        I[Supabase PostgreSQL]
        J[Redis Cache]
        K[File Storage]
    end
    
    subgraph "External Services"
        L[Expo Push Service]
        M[App Store Connect]
        N[Google Play Console]
        O[Analytics Service]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> H
    F --> I
    F --> J
    G --> I
    G --> J
    F --> L
    F --> K
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style F fill:#f3e5f5
    style I fill:#e8f5e8
```

### 2. 환경별 인프라 구성

#### 2.1 개발 환경 (Development)
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - ./backend/app:/app/app
    ports:
      - "8000:8000"
    environment:
      - ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_pass@postgres:5432/circly_dev
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: circly_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
  
  worker:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    environment:
      - ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_pass@postgres:5432/circly_dev
      - REDIS_URL=redis://redis:6379/0
    command: celery -A app.tasks worker --loglevel=info

volumes:
  postgres_data:
  redis_data:
```

#### 2.2 스테이징 환경 (Staging)
```bash
# Railway/Heroku 배포 설정
# Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: celery -A app.tasks worker --loglevel=info
beat: celery -A app.tasks beat --loglevel=info
```

#### 2.3 프로덕션 환경 (Production)

**클라우드 제공자**: Railway + Supabase + Cloudflare

```yaml
# railway.yml
version: 2

services:
  backend:
    builder: nixpacks
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
    variables:
      ENV: production
      DATABASE_URL: $DATABASE_URL
      REDIS_URL: $REDIS_URL
      SECRET_KEY: $SECRET_KEY
    scaling:
      minReplicas: 2
      maxReplicas: 10
  
  worker:
    builder: nixpacks
    startCommand: celery -A app.tasks worker --concurrency=4
    variables:
      ENV: production
      DATABASE_URL: $DATABASE_URL
      REDIS_URL: $REDIS_URL
    scaling:
      minReplicas: 1
      maxReplicas: 5
```

### 3. 컨테이너화 (Docker)

#### 3.1 Backend Dockerfile
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY ./app /app/app
COPY alembic.ini .
COPY ./migrations /app/migrations

# 비루트 유저 생성
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 3.2 개발용 Dockerfile
```dockerfile
# Dockerfile.dev
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# 개발 도구 설치
RUN pip install watchdog[watchmedo]

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 4. CI/CD 파이프라인

#### 4.1 GitHub Actions 워크플로우
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_circly
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python 3.11
      uses: actions/setup-python@v4
      with:
        python-version: 3.11
    
    - name: Cache pip dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run linting
      run: |
        cd backend
        flake8 app/
        black --check app/
        isort --check-only app/
    
    - name: Run type checking
      run: |
        cd backend
        mypy app/
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_circly
        REDIS_URL: redis://localhost:6379/0
        SECRET_KEY: test_secret_key_for_ci
      run: |
        cd backend
        pytest -v --cov=app --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Railway
      uses: railway-deploy-action@v1
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: backend
    
    - name: Run database migrations
      run: |
        # Railway에서 마이그레이션 실행
        railway run alembic upgrade head
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  mobile-build:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        cache: npm
    
    - name: Setup Expo CLI
      run: npm install -g @expo/cli
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build for preview
      run: |
        expo build:ios --type simulator
        expo build:android --type apk
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 5. 모니터링 및 로깅

#### 5.1 애플리케이션 모니터링 설정
```python
# app/monitoring.py
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

# Sentry 설정 (에러 모니터링)
sentry_sdk.init(
    dsn=settings.sentry_dsn,
    integrations=[
        FastApiIntegration(auto_enabling_integrations=False),
        SqlalchemyIntegration(),
        CeleryIntegration(monitor_beat_tasks=True),
    ],
    traces_sample_rate=0.1,
    environment=settings.environment
)

# Prometheus 메트릭 정의
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_POLLS = Gauge('active_polls_total', 'Total number of active polls')
ACTIVE_USERS = Gauge('active_users_24h', '24시간 내 활성 사용자 수')

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class MetricsMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()
            
            # 메트릭 수집
            REQUEST_COUNT.labels(
                method=scope["method"],
                endpoint=scope["path"]
            ).inc()
            
            response = await self.app(scope, receive, send)
            
            REQUEST_DURATION.observe(time.time() - start_time)
            
            return response
        
        return await self.app(scope, receive, send)
```

#### 5.2 헬스체크 엔드포인트
```python
# app/api/v1/health.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
import redis
import asyncpg

router = APIRouter()

@router.get("/health")
async def health_check():
    """기본 헬스체크"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """상세 헬스체크 (DB, Redis 연결 확인)"""
    health_status = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # 데이터베이스 연결 확인
    try:
        await db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {"status": "ok"}
    except Exception as e:
        health_status["services"]["database"] = {"status": "error", "error": str(e)}
        health_status["status"] = "error"
    
    # Redis 연결 확인
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        health_status["services"]["redis"] = {"status": "ok"}
    except Exception as e:
        health_status["services"]["redis"] = {"status": "error", "error": str(e)}
        health_status["status"] = "error"
    
    if health_status["status"] == "error":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status
```

### 6. 보안 및 인프라 보호

#### 6.1 환경변수 관리
```bash
# .env.example
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/circly
REDIS_URL=redis://localhost:6379/0

# JWT 시크릿
SECRET_KEY=your-super-secret-jwt-key-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 외부 서비스
EXPO_ACCESS_TOKEN=your-expo-token
SENTRY_DSN=your-sentry-dsn

# 파일 업로드
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

#### 6.2 보안 헤더 설정
```python
# app/middleware/security.py
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 보안 헤더 추가
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
```

### 7. 스케일링 전략

#### 7.1 수평적 확장
```yaml
# Railway 자동 스케일링 설정
services:
  backend:
    scaling:
      minReplicas: 2        # 최소 인스턴스
      maxReplicas: 10       # 최대 인스턴스
      cpuThreshold: 70      # CPU 70% 시 스케일 아웃
      memoryThreshold: 80   # 메모리 80% 시 스케일 아웃
  
  worker:
    scaling:
      minReplicas: 1
      maxReplicas: 5
      cpuThreshold: 80
```

#### 7.2 캐싱 전략
```python
# app/cache.py
import redis
from functools import wraps
import json
import hashlib

redis_client = redis.from_url(settings.redis_url)

def cache_result(expiration=300):  # 5분 기본 캐시
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{func.__name__}:{hashlib.md5(str(args + tuple(kwargs.items())).encode()).hexdigest()}"
            
            # 캐시에서 조회
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # 실제 함수 실행
            result = await func(*args, **kwargs)
            
            # 결과 캐싱
            redis_client.setex(
                cache_key, 
                expiration, 
                json.dumps(result, default=str)
            )
            
            return result
        return wrapper
    return decorator

# 사용 예시
@cache_result(expiration=60)  # 1분 캐시
async def get_poll_results(poll_id: str):
    # 투표 결과 조회 로직
    pass
```

### 8. 백업 및 재해복구

#### 8.1 데이터베이스 백업
```bash
# scripts/backup-db.sh
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="circly_backup_${DATE}.sql"

# PostgreSQL 덤프 생성
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# S3에 업로드 (옵션)
aws s3 cp /backups/$BACKUP_FILE s3://circly-backups/

# 7일 이상된 백업 파일 삭제
find /backups -name "circly_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

#### 8.2 애플리케이션 상태 모니터링
```python
# scripts/health-monitor.py
import requests
import time
import smtplib
from email.mime.text import MIMEText

def check_health():
    try:
        response = requests.get("https://api.circly.app/health/detailed", timeout=30)
        if response.status_code != 200:
            send_alert(f"Health check failed with status {response.status_code}")
        return True
    except Exception as e:
        send_alert(f"Health check failed: {str(e)}")
        return False

def send_alert(message):
    # 슬랙/이메일 알림 발송
    # 구현 필요
    pass

if __name__ == "__main__":
    while True:
        check_health()
        time.sleep(300)  # 5분마다 체크
```

## 개발 우선순위
1. **Phase 1**: Docker 개발 환경 및 기본 CI/CD 설정
2. **Phase 2**: Railway 프로덕션 배포 및 모니터링
3. **Phase 3**: 자동 스케일링 및 캐싱 시스템
4. **Phase 4**: 고가용성 및 재해복구 시스템