# Circly 개발 Todo List

## 프로젝트 개요

이 Todo List는 Circly 앱의 완전한 개발 로드맵을 제공합니다. 에러가 나지 않도록 최대한 상세하고 순서대로 작성되었습니다.

---

## Phase 1: 프로젝트 초기 셋업 (Week 1)

### 1.1 환경 설정
- [ ] **Node.js 설치** (v18.17.0 이상)
  ```bash
  # nvm 사용 권장
  nvm install 18.17.0
  nvm use 18.17.0
  ```

- [ ] **Python 환경 설치** (v3.11 이상)
  ```bash
  # pyenv 사용 권장
  pyenv install 3.11.6
  pyenv global 3.11.6
  ```

- [ ] **Git 저장소 초기화**
  ```bash
  git init
  git add .
  git commit -m "Initial commit with documentation"
  git branch -M main
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

### 1.2 백엔드 프로젝트 셋업
- [ ] **백엔드 디렉터리 생성**
  ```bash
  mkdir backend
  cd backend
  ```

- [ ] **Python 가상환경 설치**
  ```bash
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```

- [ ] **requirements.txt 생성**
  ```bash
  # backend/requirements.txt 파일 생성
  cat > requirements.txt << EOF
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  pydantic==2.5.0
  pydantic-settings==2.1.0
  sqlalchemy==2.0.23
  alembic==1.12.1
  asyncpg==0.29.0
  python-jose[cryptography]==3.3.0
  passlib[bcrypt]==1.7.4
  python-multipart==0.0.6
  httpx==0.25.2
  supabase==2.0.2
  pytest==7.4.3
  pytest-asyncio==0.21.1
  python-dotenv==1.0.0
  EOF
  ```

- [ ] **패키지 설치**
  ```bash
  pip install -r requirements.txt
  ```

- [ ] **백엔드 폴더 구조 생성**
  ```bash
  mkdir -p app/{api/v1,models,schemas,services,utils,tasks}
  touch app/__init__.py
  touch app/main.py
  touch app/config.py
  touch app/database.py
  touch app/dependencies.py
  touch app/api/__init__.py
  touch app/api/v1/__init__.py
  touch app/models/__init__.py
  touch app/schemas/__init__.py
  touch app/services/__init__.py
  touch app/utils/__init__.py
  touch app/tasks/__init__.py
  ```

### 1.3 프론트엔드 프로젝트 셋업
- [ ] **Expo CLI 설치**
  ```bash
  npm install -g @expo/cli
  ```

- [ ] **React Native 프로젝트 생성**
  ```bash
  cd ..  # 프로젝트 루트로 이동
  npx create-expo-app circly-app --template blank-typescript
  cd circly-app
  ```

- [ ] **필요 패키지 설치**
  ```bash
  npm install @expo/vector-icons @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack expo-linear-gradient expo-notifications expo-linking expo-clipboard expo-sharing expo-image-picker expo-font
  npx expo install react-native-screens react-native-safe-area-context react-native-paper zustand @tanstack/react-query axios react-native-svg
  ```

- [ ] **개발 도구 설치**
  ```bash
  npm install -D @types/react @types/react-native typescript eslint prettier
  ```

### 1.4 환경 변수 설정
- [ ] **백엔드 .env 파일 생성**
  ```bash
  # backend/.env 파일 생성
  cat > backend/.env << EOF
  # Database
  DATABASE_URL=postgresql://username:password@localhost:5432/circly_dev
  
  # JWT
  SECRET_KEY=your-super-secret-jwt-key-here-change-in-production
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=10080
  
  # Supabase (추후 설정)
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_KEY=
  
  # Redis
  REDIS_URL=redis://localhost:6379/0
  
  # Expo Push
  EXPO_ACCESS_TOKEN=
  
  # App Settings
  DEBUG=True
  ENVIRONMENT=development
  EOF
  ```

- [ ] **프론트엔드 .env 파일 생성**
  ```bash
  # circly-app/.env 파일 생성
  cat > circly-app/.env << EOF
  EXPO_PUBLIC_API_URL=http://localhost:8000/v1
  EXPO_PUBLIC_APP_NAME=Circly
  EXPO_PUBLIC_APP_VERSION=1.0.0
  EOF
  ```

---

## Phase 2: 데이터베이스 설정 (Week 1-2)

### 2.1 Supabase 프로젝트 설정
- [ ] **Supabase 계정 생성** (https://supabase.com)
- [ ] **새 프로젝트 생성** ("circly-dev")
- [ ] **데이터베이스 접속정보 설정**
- [ ] **API Keys 복사** (anon key, service key)
- [ ] **Database URL 복사**

### 2.2 데이터베이스 연결 설정
- [ ] **백엔드 database.py 생성**
  ```python
  # backend/app/database.py
  from sqlalchemy import create_engine
  from sqlalchemy.ext.declarative import declarative_base
  from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
  from sqlalchemy.orm import sessionmaker
  import os
  from dotenv import load_dotenv
  
  load_dotenv()
  
  DATABASE_URL = os.getenv("DATABASE_URL")
  
  engine = create_async_engine(DATABASE_URL)
  AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
  
  Base = declarative_base()
  
  async def get_db():
      async with AsyncSessionLocal() as session:
          yield session
  ```

- [ ] **config.py 생성**
  ```python
  # backend/app/config.py
  from pydantic_settings import BaseSettings
  from typing import Optional
  
  class Settings(BaseSettings):
      app_name: str = "Circly API"
      debug: bool = True
      version: str = "1.0.0"
      
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
  ```

### 2.3 데이터베이스 모델 생성
- [ ] **Base 모델들 생성** (user.py, circle.py, poll.py 등)
  - 참고: `trd/03-database-design.md` 문서 참조

- [ ] **Alembic 초기화**
  ```bash
  cd backend
  alembic init migrations
  ```

- [ ] **alembic.ini 설정 편집**
  ```ini
  # migrations/alembic.ini에서 sqlalchemy.url 주석 해제
  # sqlalchemy.url = driver://user:pass@localhost/dbname
  ```

- [ ] **env.py 설정**
  ```python
  # migrations/env.py 편집
  from app.database import Base
  from app.models import *  # 모든 모델 import
  target_metadata = Base.metadata
  ```

- [ ] **첫 마이그레이션 파일 생성**
  ```bash
  alembic revision --autogenerate -m "Initial migration"
  alembic upgrade head
  ```

---

## Phase 3: 백엔드 기본 구조 구현 (Week 2)

### 3.1 FastAPI 앱 설정
- [ ] **main.py 기본 구조 생성**
  ```python
  # backend/app/main.py
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from app.config import settings
  from app.api.v1 import auth, circles, polls, users
  
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
  app.include_router(auth.router, prefix="/v1")
  app.include_router(users.router, prefix="/v1")
  app.include_router(circles.router, prefix="/v1")
  app.include_router(polls.router, prefix="/v1")
  
  @app.get("/")
  async def root():
      return {"message": "Circly API", "version": settings.version}
  
  @app.get("/health")
  async def health_check():
      return {"status": "ok"}
  ```

### 3.2 인증 시스템 구현
- [ ] **JWT 토큰 유틸리티 생성** (`app/utils/security.py`)
- [ ] **인증 종속성 생성** (`app/dependencies.py`)
- [ ] **사용자 스키마 생성** (`app/schemas/user.py`)
- [ ] **인증 API 생성** (`app/api/v1/auth.py`)

### 3.3 기본 CRUD 서비스 구현
- [ ] **사용자 서비스** (`app/services/user_service.py`)
- [ ] **Circle 서비스** (`app/services/circle_service.py`)
- [ ] **투표 서비스** (`app/services/poll_service.py`)

### 3.4 서버 실행 테스트
- [ ] **로컬 서버 실행**
  ```bash
  cd backend
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```

- [ ] **API 문서 확인** (http://localhost:8000/docs)
- [ ] **헬스체크 테스트** (http://localhost:8000/health)

---

## Phase 4: 프론트엔드 기본 구조 구현 (Week 2-3)

### 4.1 프로젝트 구조 설정
- [ ] **src 폴더 구조 생성**
  ```bash
  cd circly-app
  mkdir -p src/{components,screens,services,utils,types,hooks,navigation,store}
  mkdir -p src/components/{common,poll,circle}
  mkdir -p src/screens/{auth,home,create,profile}
  ```

- [ ] **타입 정의 생성** (`src/types/`)
  - api.ts, user.ts, circle.ts, poll.ts

### 4.2 네비게이션 설정
- [ ] **Tab Navigator 구현** (`src/navigation/TabNavigator.tsx`)
- [ ] **App Navigator 구현** (`src/navigation/AppNavigator.tsx`)
- [ ] **Auth Navigator 구현** (`src/navigation/AuthNavigator.tsx`)

### 4.3 상태 관리 설정
- [ ] **Zustand 스토어 구현**
  - `src/store/authStore.ts`
  - `src/store/pollStore.ts`
  - `src/store/circleStore.ts`

### 4.4 API 클라이언트 구현
- [ ] **Axios 클라이언트 설정** (`src/services/api/client.ts`)
- [ ] **API 서비스 구현**
  - `src/services/api/auth.ts`
  - `src/services/api/circle.ts`
  - `src/services/api/poll.ts`

### 4.5 기본 컴포넌트 구현
- [ ] **공통 컴포넌트**
  - Button, Input, LoadingSpinner
- [ ] **기본 화면 구현**
  - HomeScreen, CreateScreen, ProfileScreen

---

## Phase 5: 핵심 기능 구현 (Week 3-4)

### 5.1 인증 시스템
- [ ] **디바이스 기반 로그인 구현**
- [ ] **토큰 관리 시스템**
- [ ] **사용자 로그인 기능**

### 5.2 Circle 관리 기능
- [ ] **Circle 생성 API 및 UI**
- [ ] **초대 코드/링크 생성**
- [ ] **Circle 참여 기능**
- [ ] **멤버 관리 기능**

### 5.3 질문 템플릿 시스템
- [ ] **템플릿 데이터베이스 구축**
- [ ] **템플릿 조회 API**
- [ ] **카테고리별 템플릿 UI**

### 5.4 투표 시스템
- [ ] **투표 생성 기능**
  - 템플릿 선택
  - Circle 멤버 선택지 자동 생성
  - 마감 시간 설정

- [ ] **투표 참여 기능**
  - 투표 목록 표시
  - 익명 투표 참여
  - 결과 실시간 업데이트

### 5.5 실시간 결과 시스템
- [ ] **투표 결과 집계 구현**
- [ ] **실시간 업데이트 (WebSocket/SSE)**
- [ ] **결과 카드 생성 기능**

---

## Phase 6: 고급 기능 구현 (Week 4-5)

### 6.1 푸시 알림 시스템
- [ ] **Expo Push Notification 설정**
- [ ] **백엔드 알림 서비스 구현**
- [ ] **알림 스케줄러 (Celery/Background Tasks)**
- [ ] **사용자별 알림 설정**

### 6.2 결과 카드 & 공유 기능
- [ ] **카드 생성 라이브러리 설정**
- [ ] **결과 카드 템플릿 구현**
- [ ] **SNS 공유 기능**
- [ ] **저장 관리 기능**

### 6.3 통계 시스템
- [ ] **개인 통계 구현**
- [ ] **Circle 분석정보**
- [ ] **사용 패턴 분석**

---

## Phase 7: UI/UX 완성 (Week 5-6)

### 7.1 디자인 시스템 적용
- [ ] **컬러 시스템 적용**
- [ ] **타이포그래피 적용**
- [ ] **컴포넌트 표준화**

### 7.2 애니메이션 구현
- [ ] **페이지 전환 애니메이션**
- [ ] **투표 인터랙션**
- [ ] **로딩 애니메이션**
- [ ] **투표 결과 애니메이션**

### 7.3 접근성 구현
- [ ] **스크린 리더 대응**
- [ ] **키보드 조작 지원**
- [ ] **색상 대비도**

---

## Phase 8: 테스트 및 품질 보증 (Week 6-7)

### 8.1 백엔드 테스트
- [ ] **단위 테스트 작성** (pytest)
- [ ] **API 통합 테스트**
- [ ] **데이터베이스 테스트**

### 8.2 프론트엔드 테스트
- [ ] **컴포넌트 테스트** (Jest)
- [ ] **E2E 테스트** (Detox)
- [ ] **성능 테스트**

### 8.3 보안 검증
- [ ] **API 보안 취약점 검증**
- [ ] **앱 보안 로직 검증**
- [ ] **개인정보 처리 검증**

---

## Phase 9: 배포 준비 (Week 7-8)

### 9.1 백엔드 배포 설정
- [ ] **Railway 계정 설정**
- [ ] **프로덕션 환경 변수 설정**
- [ ] **Docker 설정** (선택사항)
- [ ] **CI/CD 파이프라인 구성**

### 9.2 모바일 앱 빌드
- [ ] **EAS Build 설정**
- [ ] **앱 아이콘 및 스플래시 스크린**
- [ ] **앱 버전 설정**
- [ ] **프로덕션 빌드 테스트**

### 9.3 스토어 등록 준비
- [ ] **Apple Developer 계정**
- [ ] **Google Play Console 계정**
- [ ] **앱 메타데이터 준비**
- [ ] **스크린샷 및 설명 작성**

---

## Phase 10: 출시 및 모니터링 (Week 8)

### 10.1 베타 출시
- [ ] **TestFlight 배포** (iOS)
- [ ] **Internal Testing** (Android)
- [ ] **베타 테스터들과 피드백 수집**

### 10.2 모니터링 시스템
- [ ] **에러 모니터링** (Sentry)
- [ ] **성능 모니터링**
- [ ] **사용자 분석 연동**

### 10.3 정식 출시
- [ ] **App Store 심사 제출**
- [ ] **Google Play Store 등록**
- [ ] **마케팅 준비**

---

## 추가 체크리스트 및 주의사항

### 보안
- [ ] Git 커밋 및 인증
- [ ] 개인 키
- [ ] 테스트 커버리지

### 성능
- [ ] 응답 시간 최적화
- [ ] 메모리 누수 방지
- [ ] 성능 프로파일링

### 운영
- [ ] 성능 최적화
- [ ] 문서 업데이트
- [ ] 사용자 피드백 수집

---

## 중요 주의사항

1. **환경 변수 관리**: `.env` 파일을 Git에 커밋하지 않도록 주의
2. **API Keys 보안**: 프로덕션 환경과 개발 환경 분리 필수
3. **데이터베이스 백업**: 정기적 백업 시스템 구축 필요
4. **버전 관리**: 각 단계별 Git 태그 생성 권장
5. **문서 업데이트**: 개발 중 발생한 문제와 해결 방법 기록

---

## 참고 문서 및 레퍼런스

- **기획 문서**: `prd/` 폴더의 모든 문서들
- **기술 구현**: `trd/` 폴더의 모든 문서들  
- **디자인**: `design-guide/` 폴더의 모든 문서들
- **API 명세**: `trd/05-api-specification.md`

이 Todo List를 순서대로 진행하면 Circly 앱을 성공적으로 완성할 수 있습니다! 🚀