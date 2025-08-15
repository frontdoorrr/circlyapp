# Circly - Anonymous Polling App 🗳️

**Circly**는 친구들과 익명으로 투표를 할 수 있는 React Native + FastAPI 기반의 모바일 애플리케이션입니다.

## 📱 주요 기능

- 🔐 **디바이스 기반 인증** - 패스워드 없이 안전한 로그인
- 👥 **Circle 관리** - 친구들과 그룹 생성 및 관리
- 🗳️ **익명 투표** - 질문 템플릿을 활용한 재미있는 투표
- 📊 **실시간 결과** - 투표 결과 실시간 업데이트
- 🎨 **결과 카드** - 예쁜 이미지로 결과 공유

## 🏗️ 기술 스택

### Frontend
- **React Native** with Expo SDK
- **TypeScript** - 타입 안정성
- **Zustand** - 상태 관리 (with AsyncStorage 영속화)
- **React Navigation** - 네비게이션
- **Axios** - HTTP 클라이언트
- **React Native Testing Library** - 테스트

### Backend
- **FastAPI** - 비동기 Python 웹 프레임워크
- **SQLAlchemy 2.0+** - ORM (비동기)
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증 토큰
- **Alembic** - 데이터베이스 마이그레이션
- **pytest** - 테스트

### Infrastructure
- **Docker & Docker Compose** - 컨테이너화
- **Redis** - 캐싱 및 백그라운드 작업
- **Celery** - 백그라운드 태스크

## 🚀 빠른 시작

### 백엔드 실행 (Docker 권장)

```bash
# 저장소 클론
git clone https://github.com/your-username/circlyapp.git
cd circlyapp

# 백엔드 + 데이터베이스 실행
docker-compose up backend db redis worker --build

# 백그라운드 실행
docker-compose up backend db redis worker -d --build
```

### 프론트엔드 실행 (로컬 권장)

```bash
cd circly-app

# 의존성 설치
npm install --legacy-peer-deps

# 개발 서버 실행
npx expo start

# 웹 브라우저에서 확인
npx expo start --web
```

### 로컬 개발 환경

#### 백엔드 로컬 실행
```bash
cd backend

# uv를 사용한 의존성 설치 및 실행
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 프론트엔드 로컬 실행
```bash
cd circly-app

# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# 특정 플랫폼으로 실행
npx expo start --ios     # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
npx expo start --web     # 웹 브라우저
```

## 🧪 테스트 실행

### 백엔드 테스트
```bash
# Docker 환경에서
docker-compose exec backend pytest

# 로컬 환경에서
cd backend
pytest

# 커버리지와 함께
pytest --cov=app --cov-report=html
```

### 프론트엔드 테스트
```bash
# 일반 테스트
cd circly-app
npm test

# 워치 모드
npm test -- --watch

# 커버리지와 함께
npm test -- --coverage
```

**현재 테스트 현황:**

#### 프론트엔드 테스트
- ✅ **30개 테스트 모두 통과** 
- ✅ Button, Input 컴포넌트 테스트
- ✅ LoginScreen 사용자 인터랙션 테스트
- ✅ AuthAPI 서비스 로직 테스트
- ✅ AuthStore 상태 관리 테스트

#### 백엔드 테스트
- ⚠️ **테스트 환경 설정 중** (SQLAlchemy 비동기/동기 설정 조정 필요)
- ✅ **API 엔드포인트 정상 작동** (수동 테스트 완료)
- ✅ 헬스체크: `curl http://localhost:8000/health` → `{"status":"ok"}`
- ✅ API 문서: http://localhost:8000/docs

## 🌐 서비스 접속 정보

### 개발 환경 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| **프론트엔드** | http://localhost:19006 | React Native 웹 버전 |
| **백엔드 API** | http://localhost:8000 | FastAPI 서버 |
| **API 문서** | http://localhost:8000/docs | Swagger UI |
| **데이터베이스** | localhost:5432 | PostgreSQL |
| **Redis** | localhost:6379 | Redis 캐시 |

### 헬스체크
```bash
# API 서버 상태 확인
curl http://localhost:8000/health

# 예상 응답: {"status": "ok"}
```

## 📂 프로젝트 구조

```
circlyapp/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/         # API 라우터
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티
│   ├── tests/              # 백엔드 테스트
│   └── migrations/         # 데이터베이스 마이그레이션
├── circly-app/             # React Native 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── screens/        # 화면 컴포넌트
│   │   ├── services/       # API 서비스
│   │   ├── store/          # Zustand 스토어
│   │   ├── navigation/     # React Navigation
│   │   └── types/          # TypeScript 타입
│   └── __tests__/          # 프론트엔드 테스트
├── docker-compose.yml      # Docker 서비스 정의
└── todo.md                # 개발 로드맵
```

## 🔧 개발 환경 설정

### 환경 변수 설정

#### 백엔드 (.env)
```bash
# 데이터베이스
DATABASE_URL=postgresql://circly_user:circly_password@localhost:5432/circly_db

# JWT 설정
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Redis
REDIS_URL=redis://localhost:6379/0

# 앱 설정
DEBUG=True
ENVIRONMENT=development
```

#### 프론트엔드 (.env)
```bash
# API URL
EXPO_PUBLIC_API_URL=http://localhost:8000

# 앱 설정
EXPO_PUBLIC_APP_NAME=Circly
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 필수 도구 설치

#### Docker 환경 (권장)
- **Docker Desktop** >= 4.0
- **Docker Compose** >= 2.0

#### 로컬 개발 환경
- **Node.js** >= 18.17.0
- **Python** >= 3.13
- **uv** (Python 패키지 매니저)
- **PostgreSQL** >= 15 (로컬 DB 사용 시)

## 🎮 사용 방법

### 1. 앱 실행
```bash
# 전체 서비스 시작
docker-compose up --build
```

### 2. 첫 로그인
1. 브라우저에서 http://localhost:19006 접속
2. **"Quick Login"** 클릭하여 빠른 로그인
3. 또는 커스텀 Device ID 입력 후 **"Login with Device ID"**

### 3. 주요 기능 테스트
- ✅ **자동 로그인**: 앱 재시작 시 자동으로 로그인 상태 복원
- ✅ **디바이스 정보**: "Show Device Info" 버튼으로 현재 디바이스 확인
- ✅ **에러 처리**: 로그인 실패 시 친화적인 에러 메시지
- ✅ **애니메이션**: 부드러운 화면 전환 효과

## 🧪 현재 구현 상태

### ✅ 완료된 기능

#### Phase 2: 데이터베이스 설정
- ✅ PostgreSQL + Redis 컨테이너 설정
- ✅ SQLAlchemy 비동기 엔진 구성
- ✅ 데이터베이스 모델 정의 (User, Circle, Poll 등)
- ✅ Alembic 마이그레이션 설정

#### Phase 3: 백엔드 기본 구조
- ✅ FastAPI 앱 구성 및 CORS 설정
- ✅ JWT 기반 인증 시스템
- ✅ RESTful API 엔드포인트 (인증, 사용자, Circle, Poll)
- ✅ 종속성 주입 및 보안 미들웨어
- ✅ 백엔드 테스트 코드

#### Phase 4: 프론트엔드 기본 구조
- ✅ React Native + Expo 프로젝트 설정
- ✅ 네비게이션 시스템 (Auth/App/Tab)
- ✅ Zustand 상태 관리 + AsyncStorage 영속화
- ✅ Axios API 클라이언트 + 인터셉터
- ✅ 재사용 컴포넌트 (Button, Input)
- ✅ 프론트엔드 테스트 코드

#### Phase 5.1: 인증 시스템 강화
- ✅ **디바이스 기반 로그인 시스템**
  - 향상된 디바이스 ID 생성 로직
  - 사용자 경험 개선 (애니메이션, 디바이스 정보 표시)
  - 자동 인증 복원 및 토큰 관리
  - 접근성 향상 및 에러 처리

### 🚧 진행 중인 기능
- **토큰 관리 시스템** (자동 갱신, 만료 처리)

### 📋 다음 계획
- Circle 생성 및 관리 기능
- 질문 템플릿 시스템
- 투표 기능 구현
- 실시간 결과 업데이트

## 🔍 디버깅 가이드

### 로그 확인
```bash
# 전체 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 데이터베이스 접속
```bash
# PostgreSQL 접속
docker-compose exec db psql -U circly_user -d circly_db

# 테이블 확인
\dt

# 사용자 데이터 확인
SELECT * FROM users;
```

### 문제 해결

#### "포트가 이미 사용 중" 에러
```bash
# 실행 중인 컨테이너 중지
docker-compose down

# 포트 사용 프로세스 확인
lsof -i :8000  # 백엔드
lsof -i :19006 # 프론트엔드
```

#### 데이터베이스 연결 에러
```bash
# 데이터베이스 컨테이너 상태 확인
docker-compose ps

# 데이터베이스 컨테이너 재시작
docker-compose restart db
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 언제든 연락해 주세요!

---

**🎯 현재 진행률: Phase 5.1 완료 (약 40% 완성)**
