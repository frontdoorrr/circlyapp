# Circly 개발 및 배포 환경 셋업 가이드

> Development & Deployment Environment Setup Guide v1.0

## Executive Summary

이 문서는 Circly 프로젝트의 **백엔드(FastAPI + uv)**, **프론트엔드(React Native + Expo)**, **배포 환경(Railway + Supabase + Cloudflare)** 셋업을 위한 종합 가이드입니다.

---

## 목차

1. [백엔드 개발 환경](#1-백엔드-개발-환경)
2. [프론트엔드 개발 환경](#2-프론트엔드-개발-환경)
3. [배포 환경 및 CI/CD](#3-배포-환경-및-cicd)
4. [환경 변수 관리](#4-환경-변수-관리)
5. [초기 셋업 체크리스트](#5-초기-셋업-체크리스트)
6. [명령어 요약](#6-명령어-요약-quick-reference)

---

## 1. 백엔드 개발 환경

### 1.1 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션
│   ├── config.py               # 설정 관리 (Pydantic Settings)
│   ├── dependencies.py         # 의존성 주입
│   │
│   ├── core/                   # 공통 모듈
│   │   ├── database.py         # SQLAlchemy async 설정
│   │   ├── security.py         # JWT, 해싱
│   │   ├── events.py           # 내부 이벤트 버스
│   │   ├── exceptions.py       # 커스텀 예외
│   │   └── middleware.py       # 미들웨어
│   │
│   ├── modules/                # 도메인 모듈
│   │   ├── auth/
│   │   ├── circles/
│   │   ├── polls/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── analytics/
│   │   └── sharing/
│   │
│   ├── tasks/                  # Celery 백그라운드 작업
│   │   ├── celery_app.py
│   │   ├── notifications.py
│   │   └── cleanup.py
│   │
│   └── api/
│       └── v1/
│           └── router.py
│
├── migrations/                 # Alembic 마이그레이션
├── tests/
│   ├── conftest.py
│   ├── unit/
│   └── integration/
│
├── scripts/                    # 유틸리티 스크립트
│   ├── seed_data.py
│   └── create_templates.py
│
├── pyproject.toml              # uv 프로젝트 설정
├── uv.lock                     # 의존성 잠금 파일
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── alembic.ini
```

### 1.2 pyproject.toml (uv 설정)

```toml
[project]
name = "circly-backend"
version = "0.1.0"
description = "Circly - Anonymous Compliment Voting Platform API"
readme = "README.md"
requires-python = ">=3.13"
license = { text = "MIT" }

dependencies = [
    # Web Framework
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.6.0",

    # Database
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "greenlet>=3.1.0",

    # Cache & Queue
    "redis>=5.2.0",
    "celery[redis]>=5.4.0",

    # Authentication
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",

    # HTTP Client
    "httpx>=0.28.0",

    # Utilities
    "python-multipart>=0.0.12",
    "python-dotenv>=1.0.1",
    "orjson>=3.10.0",
]

[project.optional-dependencies]
dev = [
    # Testing
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.28.0",
    "factory-boy>=3.3.0",

    # Linting & Formatting
    "ruff>=0.8.0",
    "mypy>=1.13.0",

    # Type Stubs
    "types-redis>=4.6.0",
    "types-passlib>=1.7.7",
    "types-python-jose>=3.3.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "ruff>=0.8.0",
    "mypy>=1.13.0",
]

[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM", "ASYNC"]
ignore = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["app"]

[tool.mypy]
python_version = "3.13"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
testpaths = ["tests"]
addopts = "-v --cov=app --cov-report=term-missing"
```

### 1.3 로컬 개발 환경 설정

```bash
# 1. uv 설치 (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 프로젝트 디렉토리 생성
mkdir -p backend && cd backend

# 3. uv 프로젝트 초기화
uv init

# 4. 의존성 설치
uv sync

# 5. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 6. 데이터베이스 마이그레이션
uv run alembic upgrade head

# 7. 개발 서버 실행
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 1.4 Docker 개발 환경

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/circly
      - REDIS_URL=redis://redis:6379/0
      - DEBUG=true
    volumes:
      - ./app:/app/app
    depends_on:
      - db
      - redis
    command: uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/circly
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    command: uv run celery -A app.tasks.celery_app worker --loglevel=info

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: circly
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 1.5 Dockerfile (Backend)

```dockerfile
# Dockerfile
FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set work directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.6 주요 백엔드 명령어

| 명령어 | 설명 |
|--------|------|
| `uv sync` | 의존성 설치 |
| `uv add <package>` | 패키지 추가 |
| `uv run uvicorn app.main:app --reload` | 개발 서버 실행 |
| `uv run pytest` | 테스트 실행 |
| `uv run pytest --cov=app` | 커버리지 포함 테스트 |
| `uv run ruff check app/` | 린트 검사 |
| `uv run ruff format app/` | 코드 포맷팅 |
| `uv run mypy app/` | 타입 체크 |
| `uv run alembic revision --autogenerate -m "message"` | 마이그레이션 생성 |
| `uv run alembic upgrade head` | 마이그레이션 적용 |
| `uv run celery -A app.tasks.celery_app worker --loglevel=info` | Celery 워커 실행 |

---

## 2. 프론트엔드 개발 환경

### 2.1 프로젝트 구조

```
frontend/
├── app/                          # Expo Router (파일 기반 라우팅)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── join/[code].tsx
│   ├── (main)/
│   │   ├── _layout.tsx           # 탭 네비게이터
│   │   ├── (home)/
│   │   │   ├── index.tsx
│   │   │   └── poll/[id].tsx
│   │   ├── (create)/
│   │   │   ├── index.tsx
│   │   │   └── templates.tsx
│   │   └── (profile)/
│   │       ├── index.tsx
│   │       ├── settings.tsx
│   │       └── circles.tsx
│   ├── _layout.tsx               # 루트 레이아웃
│   └── +not-found.tsx
│
├── src/
│   ├── components/
│   │   ├── ui/                   # 기본 UI 컴포넌트
│   │   ├── poll/                 # 투표 관련 컴포넌트
│   │   ├── circle/               # 서클 관련 컴포넌트
│   │   └── shared/               # 공통 컴포넌트
│   │
│   ├── features/                 # 기능 모듈
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── polls/
│   │   ├── circles/
│   │   └── notifications/
│   │
│   ├── lib/                      # 유틸리티
│   │   ├── api/
│   │   │   ├── client.ts         # Axios 인스턴스
│   │   │   └── types.ts
│   │   ├── storage/
│   │   │   └── secureStorage.ts
│   │   └── constants/
│   │       └── config.ts
│   │
│   ├── types/                    # TypeScript 타입
│   └── theme/                    # 디자인 시스템
│
├── assets/
├── app.json                      # Expo 설정
├── eas.json                      # EAS Build 설정
├── package.json
├── tsconfig.json
└── .env.example
```

### 2.2 package.json

```json
{
  "name": "circly-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "prebuild": "expo prebuild",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-device": "~7.0.0",
    "expo-constants": "~17.0.0",
    "expo-linking": "~7.0.0",
    "expo-splash-screen": "~0.29.0",

    "react": "18.3.1",
    "react-native": "0.76.2",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.1.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",

    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",

    "@supabase/supabase-js": "^2.45.0",

    "react-native-svg": "^15.8.0",
    "lottie-react-native": "^7.1.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.0",
    "typescript": "~5.6.0",
    "eslint": "^9.12.0",
    "eslint-config-expo": "~8.0.0",
    "@typescript-eslint/parser": "^8.10.0",
    "@typescript-eslint/eslint-plugin": "^8.10.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.7.0"
  },
  "private": true
}
```

### 2.3 app.json (Expo 설정)

```json
{
  "expo": {
    "name": "Circly",
    "slug": "circly",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "circly",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "app.circly.mobile",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "프로필 사진을 업로드하기 위해 카메라 접근이 필요합니다.",
        "NSPhotoLibraryUsageDescription": "프로필 사진을 선택하기 위해 사진 라이브러리 접근이 필요합니다."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "app.circly.mobile",
      "versionCode": 1,
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "VIBRATE", "RECEIVE_BOOT_COMPLETED"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

### 2.4 eas.json (EAS Build 설정)

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "http://localhost:8000",
        "SUPABASE_URL": "YOUR_SUPABASE_URL",
        "SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": {
        "API_URL": "https://staging-api.circly.app",
        "SUPABASE_URL": "YOUR_STAGING_SUPABASE_URL",
        "SUPABASE_ANON_KEY": "YOUR_STAGING_SUPABASE_ANON_KEY"
      }
    },
    "production": {
      "channel": "production",
      "env": {
        "API_URL": "https://api.circly.app",
        "SUPABASE_URL": "YOUR_PROD_SUPABASE_URL",
        "SUPABASE_ANON_KEY": "YOUR_PROD_SUPABASE_ANON_KEY"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 2.5 로컬 개발 환경 설정

```bash
# 1. Node.js 설치 (v20 LTS 권장)
# fnm 또는 nvm 사용 권장

# 2. 프로젝트 생성
npx create-expo-app@latest frontend --template expo-template-blank-typescript
cd frontend

# 3. Expo Router 설치
npx expo install expo-router expo-linking expo-constants expo-status-bar

# 4. 추가 의존성 설치
npm install @tanstack/react-query zustand axios @supabase/supabase-js
npm install expo-secure-store expo-notifications expo-device

# 5. 환경 변수 설정
cp .env.example .env.local

# 6. 개발 서버 실행
npm start

# iOS 시뮬레이터 실행 (macOS)
npm run ios

# Android 에뮬레이터 실행
npm run android
```

### 2.6 주요 프론트엔드 명령어

| 명령어 | 설명 |
|--------|------|
| `npm start` | Expo 개발 서버 실행 |
| `npm run ios` | iOS 시뮬레이터 실행 |
| `npm run android` | Android 에뮬레이터 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 체크 |
| `npm test` | Jest 테스트 실행 |
| `eas build --profile development` | 개발 빌드 |
| `eas build --profile preview` | 프리뷰 빌드 |
| `eas build --profile production` | 프로덕션 빌드 |
| `eas submit --platform ios` | App Store 제출 |
| `eas submit --platform android` | Play Store 제출 |
| `eas update --channel preview` | OTA 업데이트 |

---

## 3. 배포 환경 및 CI/CD

### 3.1 인프라 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        CLOUDFLARE                                     │   │
│  │   • CDN (정적 자산 캐싱)                                              │   │
│  │   • WAF (DDoS, SQL Injection, XSS 방어)                              │   │
│  │   • SSL/TLS 종료 (TLS 1.3)                                           │   │
│  │   • 도메인: api.circly.app, circly.app                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         RAILWAY                                       │   │
│  │                                                                       │   │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │   │  API Service    │  │  Worker Service │  │     Redis       │     │   │
│  │   │  (FastAPI)      │  │  (Celery)       │  │                 │     │   │
│  │   │  min: 2, max: 10│  │  min: 1, max: 5 │  │  256MB - 1GB    │     │   │
│  │   │  Auto-scale     │  │  Auto-scale     │  │                 │     │   │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │                                                                       │   │
│  │   환경:                                                               │   │
│  │   • Production: api.circly.app                                       │   │
│  │   • Staging: staging-api.circly.app                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         SUPABASE                                      │   │
│  │                                                                       │   │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │   │   PostgreSQL    │  │    Realtime     │  │     Storage     │     │   │
│  │   │   (Primary DB)  │  │   (WebSocket)   │  │ (Files/Images)  │     │   │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │                                                                       │   │
│  │   환경:                                                               │   │
│  │   • Production: db.supabase.co/circly-prod                           │   │
│  │   • Staging: db.supabase.co/circly-staging                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      EXTERNAL SERVICES                                │   │
│  │                                                                       │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │   │Expo Push │  │ Sentry   │  │ Firebase │  │RevenueCat│            │   │
│  │   │ Service  │  │Monitoring│  │Analytics │  │ Payments │            │   │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 환경별 구성

| 환경 | API URL | DB | Redis | 용도 |
|------|---------|-----|-------|------|
| **Local** | `localhost:8000` | Docker Postgres | Docker Redis | 개발 |
| **Staging** | `staging-api.circly.app` | Supabase Staging | Railway Redis | 테스트 |
| **Production** | `api.circly.app` | Supabase Prod | Railway Redis | 운영 |

### 3.3 CI/CD 파이프라인 (Backend)

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/circly-api

jobs:
  # ============================================
  # Step 1: 코드 품질 검사
  # ============================================
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Set up Python
        run: uv python install 3.13

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Run Ruff (Lint)
        run: uv run ruff check app/

      - name: Run Ruff (Format Check)
        run: uv run ruff format --check app/

      - name: Run MyPy (Type Check)
        run: uv run mypy app/

  # ============================================
  # Step 2: 테스트
  # ============================================
  test:
    name: Tests
    needs: quality
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: circly_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Set up Python
        run: uv python install 3.13

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/circly_test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key
        run: uv run pytest --cov=app --cov-report=xml --cov-report=term-missing

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml
          fail_ci_if_error: true

  # ============================================
  # Step 3: Docker 이미지 빌드 & 푸시
  # ============================================
  build:
    name: Build & Push
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # Step 4: Railway 배포
  # ============================================
  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway (Staging)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_STAGING }}
        run: railway up --service circly-api-staging

  deploy-production:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway (Production)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_PRODUCTION }}
        run: railway up --service circly-api

  # ============================================
  # Step 5: 마이그레이션 실행
  # ============================================
  migrate:
    name: Run Migrations
    needs: [deploy-staging, deploy-production]
    runs-on: ubuntu-latest
    if: always() && (needs.deploy-staging.result == 'success' || needs.deploy-production.result == 'success')

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Run migrations
        env:
          DATABASE_URL: ${{ github.ref == 'refs/heads/main' && secrets.DATABASE_URL_PROD || secrets.DATABASE_URL_STAGING }}
        run: |
          cd backend
          uv sync
          uv run alembic upgrade head

  # ============================================
  # Step 6: 헬스 체크
  # ============================================
  health-check:
    name: Health Check
    needs: migrate
    runs-on: ubuntu-latest

    steps:
      - name: Check API Health
        run: |
          URL="${{ github.ref == 'refs/heads/main' && 'https://api.circly.app' || 'https://staging-api.circly.app' }}"
          for i in {1..10}; do
            if curl -sf "${URL}/health" > /dev/null; then
              echo "Health check passed!"
              exit 0
            fi
            echo "Attempt $i failed, waiting..."
            sleep 10
          done
          echo "Health check failed after 10 attempts"
          exit 1
```

### 3.4 CI/CD 파이프라인 (Frontend)

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  # ============================================
  # Step 1: 코드 품질 검사
  # ============================================
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript Check
        run: npm run typecheck

  # ============================================
  # Step 2: 테스트
  # ============================================
  test:
    name: Tests
    needs: quality
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  # ============================================
  # Step 3: EAS Build (Preview)
  # ============================================
  build-preview:
    name: Build Preview
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build for Preview
        run: eas build --profile preview --platform all --non-interactive

  # ============================================
  # Step 4: EAS Build (Production)
  # ============================================
  build-production:
    name: Build Production
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build for Production
        run: eas build --profile production --platform all --non-interactive

  # ============================================
  # Step 5: 스토어 제출 (수동 승인 필요)
  # ============================================
  submit:
    name: Submit to Stores
    needs: build-production
    runs-on: ubuntu-latest
    environment: production-submit
    if: github.ref == 'refs/heads/main'
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to App Store
        run: eas submit --platform ios --latest --non-interactive

      - name: Submit to Play Store
        run: eas submit --platform android --latest --non-interactive
```

### 3.5 브랜치 전략

```
┌─────────────────────────────────────────────────────────────────┐
│                      BRANCH STRATEGY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  main ─────────────────────────────────────────────────────────  │
│    │                                Production 배포              │
│    │                                                             │
│    │     develop ──────────────────────────────────────────────  │
│    │       │                       Staging 배포                  │
│    │       │                                                     │
│    │       │     feature/auth ─────────────────                  │
│    │       │         │                                           │
│    │       │◄────────┘  PR & Review                             │
│    │       │                                                     │
│    │       │     feature/polls ────────────────                  │
│    │       │         │                                           │
│    │       │◄────────┘  PR & Review                             │
│    │       │                                                     │
│    │◄──────┘  Release PR (develop → main)                       │
│    │                                                             │
│                                                                  │
│  Workflow:                                                       │
│  1. feature/* → develop (PR + Review)                           │
│  2. develop → main (Release PR)                                 │
│  3. Hotfix: hotfix/* → main (Emergency)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 환경 변수 관리

### 4.1 Backend .env.example

```bash
# ===========================================
# Backend Environment Variables
# ===========================================

# Application
APP_NAME=circly
APP_ENV=development  # development | staging | production
DEBUG=true
SECRET_KEY=your-super-secret-key-change-in-production

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/circly

# Redis
REDIS_URL=redis://localhost:6379/0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# JWT Settings
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token

# Sentry (Error Monitoring)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# CORS
CORS_ORIGINS=["http://localhost:19006", "exp://localhost:19000"]
```

### 4.2 Frontend .env.example

```bash
# ===========================================
# Frontend Environment Variables
# ===========================================

# API
EXPO_PUBLIC_API_URL=http://localhost:8000

# Supabase (Realtime)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Firebase Analytics (Optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

### 4.3 환경별 환경 변수 관리

| 서비스 | Local | Staging | Production |
|--------|-------|---------|------------|
| **GitHub Secrets** | - | `RAILWAY_TOKEN_STAGING`, `DATABASE_URL_STAGING` | `RAILWAY_TOKEN_PRODUCTION`, `DATABASE_URL_PROD` |
| **Railway** | - | Railway Dashboard → Variables | Railway Dashboard → Variables |
| **EAS** | `.env.local` | `eas.json` preview profile | `eas.json` production profile |

---

## 5. 초기 셋업 체크리스트

### 5.1 백엔드 셋업 체크리스트

```markdown
## Backend Setup Checklist

### 1. 로컬 환경 준비
- [ ] uv 설치: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- [ ] Python 3.13 설치: `uv python install 3.13`
- [ ] Docker Desktop 설치

### 2. 프로젝트 초기화
- [ ] 디렉토리 생성: `mkdir -p backend && cd backend`
- [ ] uv 초기화: `uv init`
- [ ] pyproject.toml 작성
- [ ] 의존성 설치: `uv sync`

### 3. 로컬 개발 환경
- [ ] .env 파일 생성
- [ ] Docker Compose 실행: `docker-compose up -d db redis`
- [ ] DB 마이그레이션: `uv run alembic upgrade head`
- [ ] 개발 서버 실행: `uv run uvicorn app.main:app --reload`

### 4. 외부 서비스 설정
- [ ] Supabase 프로젝트 생성 (Staging, Production)
- [ ] Railway 프로젝트 생성
- [ ] Cloudflare 도메인 설정
- [ ] Sentry 프로젝트 생성
- [ ] Expo 계정 설정 (Push Token)

### 5. CI/CD 설정
- [ ] GitHub Secrets 설정
- [ ] GitHub Actions 워크플로우 작성
- [ ] Railway 환경 변수 설정
```

### 5.2 프론트엔드 셋업 체크리스트

```markdown
## Frontend Setup Checklist

### 1. 로컬 환경 준비
- [ ] Node.js 20 LTS 설치 (fnm/nvm 권장)
- [ ] Expo CLI 설치: `npm install -g expo-cli`
- [ ] EAS CLI 설치: `npm install -g eas-cli`
- [ ] Xcode 설치 (iOS 개발, macOS)
- [ ] Android Studio 설치 (Android 개발)

### 2. 프로젝트 초기화
- [ ] Expo 프로젝트 생성
- [ ] Expo Router 설정
- [ ] 의존성 설치

### 3. 외부 서비스 설정
- [ ] Expo 계정 로그인: `eas login`
- [ ] EAS 프로젝트 설정: `eas build:configure`
- [ ] Apple Developer 계정 설정
- [ ] Google Play Console 설정

### 4. 개발 환경
- [ ] .env.local 파일 생성
- [ ] iOS 시뮬레이터 테스트
- [ ] Android 에뮬레이터 테스트

### 5. CI/CD 설정
- [ ] GitHub Secrets 설정 (EXPO_TOKEN)
- [ ] GitHub Actions 워크플로우 작성
- [ ] EAS Build 프로파일 설정
```

### 5.3 외부 서비스 설정 체크리스트

```markdown
## External Services Setup

### Supabase
- [ ] 프로젝트 생성 (Staging)
- [ ] 프로젝트 생성 (Production)
- [ ] RLS 정책 설정
- [ ] Storage 버킷 생성

### Railway
- [ ] 프로젝트 생성
- [ ] API Service 설정
- [ ] Worker Service 설정
- [ ] Redis 추가
- [ ] 환경 변수 설정
- [ ] 커스텀 도메인 연결

### Cloudflare
- [ ] 도메인 등록/이전
- [ ] DNS 설정
- [ ] SSL/TLS 설정
- [ ] WAF 규칙 설정
- [ ] Page Rules 설정

### Sentry
- [ ] 프로젝트 생성 (Backend)
- [ ] 프로젝트 생성 (Frontend)
- [ ] Alert 규칙 설정

### Expo
- [ ] 계정 생성
- [ ] 프로젝트 등록
- [ ] Push Token 발급

### App Stores
- [ ] Apple Developer 등록
- [ ] App Store Connect 앱 생성
- [ ] Google Play Console 등록
- [ ] Google Play 앱 생성
```

---

## 6. 명령어 요약 (Quick Reference)

### 6.1 백엔드 명령어 (uv)

```bash
# 의존성 관리
uv sync                          # 의존성 설치
uv add <package>                 # 패키지 추가
uv remove <package>              # 패키지 제거
uv lock                          # 잠금 파일 업데이트

# 개발 서버
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 테스트
uv run pytest                    # 테스트 실행
uv run pytest --cov=app          # 커버리지 포함
uv run pytest -x                 # 첫 실패시 중단
uv run pytest -k "test_auth"     # 특정 테스트만

# 린트/포맷
uv run ruff check app/           # 린트 검사
uv run ruff check app/ --fix     # 자동 수정
uv run ruff format app/          # 코드 포맷팅
uv run mypy app/                 # 타입 체크

# 마이그레이션
uv run alembic revision --autogenerate -m "message"  # 마이그레이션 생성
uv run alembic upgrade head                          # 최신으로 업그레이드
uv run alembic downgrade -1                          # 한 단계 롤백
uv run alembic history                               # 히스토리 확인

# Celery
uv run celery -A app.tasks.celery_app worker --loglevel=info
uv run celery -A app.tasks.celery_app beat --loglevel=info  # 스케줄러

# Docker
docker-compose up -d             # 백그라운드 실행
docker-compose down              # 종료
docker-compose logs -f api       # 로그 확인
```

### 6.2 프론트엔드 명령어 (npm/expo)

```bash
# 개발 서버
npm start                        # Expo 개발 서버
npm run ios                      # iOS 시뮬레이터
npm run android                  # Android 에뮬레이터
npm run web                      # 웹 브라우저

# 품질 검사
npm run lint                     # ESLint
npm run lint -- --fix            # 자동 수정
npm run typecheck                # TypeScript
npm test                         # Jest
npm test -- --coverage           # 커버리지

# EAS Build
eas build --profile development  # 개발 빌드
eas build --profile preview      # 프리뷰 빌드
eas build --profile production   # 프로덕션 빌드
eas build --platform ios         # iOS만
eas build --platform android     # Android만

# EAS Submit
eas submit --platform ios        # App Store 제출
eas submit --platform android    # Play Store 제출

# EAS Update (OTA)
eas update --channel preview     # 프리뷰 채널 업데이트
eas update --channel production  # 프로덕션 채널 업데이트

# Expo 기타
npx expo prebuild                # 네이티브 프로젝트 생성
npx expo doctor                  # 환경 진단
npx expo install <package>       # Expo 호환 버전 설치
```

### 6.3 Git 명령어

```bash
# 브랜치
git checkout -b feature/auth     # 기능 브랜치 생성
git checkout develop             # develop 이동
git merge --no-ff feature/auth   # 머지

# 커밋
git add .
git commit -m "feat(auth): implement device login"

# 리베이스
git rebase develop               # develop 기준 리베이스
git rebase -i HEAD~3             # 인터랙티브 리베이스

# 태그 (릴리즈)
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

---

## 7. 트러블슈팅 가이드

### 7.1 백엔드 이슈

| 이슈 | 원인 | 해결 방법 |
|------|------|----------|
| `uv sync` 실패 | Python 버전 불일치 | `uv python install 3.13` 실행 |
| DB 연결 실패 | Docker 미실행 | `docker-compose up -d db` |
| 마이그레이션 오류 | 스키마 충돌 | `alembic downgrade base` 후 재시도 |
| Import 에러 | 의존성 누락 | `uv sync` 재실행 |

### 7.2 프론트엔드 이슈

| 이슈 | 원인 | 해결 방법 |
|------|------|----------|
| Metro 번들러 오류 | 캐시 문제 | `npx expo start --clear` |
| iOS 빌드 실패 | CocoaPods 이슈 | `cd ios && pod install --repo-update` |
| Android 빌드 실패 | Gradle 이슈 | `cd android && ./gradlew clean` |
| EAS 빌드 실패 | 설정 오류 | `eas build:configure` 재실행 |

### 7.3 배포 이슈

| 이슈 | 원인 | 해결 방법 |
|------|------|----------|
| Railway 배포 실패 | 환경 변수 누락 | Dashboard에서 변수 확인 |
| Health check 실패 | 앱 시작 지연 | 타임아웃 증가 또는 로그 확인 |
| Cloudflare 502 | Origin 서버 다운 | Railway 서비스 상태 확인 |
| 앱 스토어 거절 | 정책 위반 | 거절 사유 확인 후 수정 |

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 1.0.0 |
| Created | 2024-12-02 |
| Author | Architecture Team |
| Status | Draft |
| Related Docs | `00-system-architecture-v2.md`, `03-database-design.md` |

---

*이 문서는 Circly 프로젝트의 개발 및 배포 환경 설정을 위한 공식 가이드입니다. 모든 개발자는 이 가이드를 따라 환경을 설정해야 합니다.*
