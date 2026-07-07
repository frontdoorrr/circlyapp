# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Circly는 중·고등학생을 위한 익명 칭찬 투표 플랫폼입니다. 친구들끼리 Circle(그룹)을 만들어 익명으로 칭찬 투표를 하고, 결과를 SNS에 공유할 수 있습니다.

## Tech Stack

- **Frontend**: React Native (Expo SDK 54, React 19, RN 0.81, New Architecture) with Expo Router
- **Backend**: FastAPI (Python 3.13)
- **Payments**: RevenueCat (react-native-purchases)
- **Database**: PostgreSQL via Supabase
- **Cache**: Redis
- **Storage**: Supabase Storage
- **Push Notifications**: Expo Push Service
- **Background Jobs**: Celery

## Architecture

**Modular Monolith** 패턴을 따릅니다:

```
Backend Modules (backend/app/modules/):
├── auth          # JWT 인증, 세션 관리
├── circles       # 그룹 CRUD, 멤버십, 초대 코드/링크
├── polls         # 템플릿 기반 투표, 익명 투표, 결과 계산
├── notifications # 푸시 알림, 스케줄링
├── reports       # 신고/관리
├── stats         # 통계/이벤트 추적
└── subscription  # 구독, RevenueCat webhook 수신

Frontend Structure (Expo Router):
├── app/(auth)/             # 비인증 화면 (로그인, 가입)
├── app/(main)/(0-home)/    # Home 탭 (진행 중 투표)
├── app/(main)/(1-circle)/  # Circle 탭
├── app/(main)/(2-profile)/ # Profile 탭 (settings, notifications 포함)
├── app/poll/               # 투표 생성/상세
├── app/subscription/       # 구독 페이월
└── app/join/, app/results/[id], app/circle/, app/(dev)/
```

### Module Communication Rules

- Module → Module: Service Interface 통해서만 (직접 DB 접근 금지)
- Module → EventBus → Other Modules: 비동기 이벤트
- 순환 의존성 금지

## Key Domain Concepts

- **Circle**: 친구 그룹 (10-50명), 6자리 초대 코드로 가입
- **Poll**: 템플릿 기반 칭찬 질문 투표 (1H/3H/6H/24H 마감)
- **Vote Anonymity**: `voter_hash = SHA-256(voter_id + poll_id + salt)` - voter_id 직접 저장 금지
- **Result Card**: 1080x1920px 인스타그램 스토리 규격 결과 이미지
- **Subscription**: RevenueCat 기반 구독. backend `subscription` 모듈이 webhook 수신(secret 검증), 프론트 페이월은 `app/subscription/`, 훅은 `src/hooks/useSubscription.ts`

## Documentation Structure

> **Single Source of Truth**: `docs/DSL.md`가 스키마, 타입, API 정의의 기준 문서입니다.
> trd/ 문서들은 DSL.md를 참조하여 작성되었습니다.

```
docs/
└── DSL.md             # 전체 시스템 DSL 정의 (Single Source of Truth)

prd/                    # 기획 문서
├── 00-prd.md          # 메인 PRD
├── features/          # 기능 명세
├── design/            # UX/UI 가이드
├── business/          # 비즈니스 모델
└── onboarding/        # 온보딩 UX

trd/                    # 기술 문서 (DSL.md 기반)
├── 00-system-architecture-v2.md  # 시스템 아키텍처
├── 00-interface-specifications.md # TypeScript/Python 인터페이스
├── 05-api-specification.md        # API 명세
├── 06-authentication-architecture.md # 인증 아키텍처
└── 07-development-deployment-setup.md # 개발/배포 환경 셋업
```

## Implementation Guidelines

기능 구현 전 반드시 해당 문서를 참고하세요:

0. 모든 작업은 todo.md에 태스크를 정의한 후, 진행하세요.
  태스크 정의할 시에는 기획 문서가 작성되어 있어야 하며, 참고할 문서가 태스크에 함께 적혀있어야 합니다.

1. 백엔드는 TDD 기반 구성으로 테스트 코드 먼저 구성 후 진행

| 구현 대상 | 참고 문서 |
|----------|----------|
| **프론트엔드 구현** | `trd/08-frontend-implementation-spec.md` ⭐ |
| 투표 기능 | `docs/DSL.md` (Poll 모듈), `prd/features/01-voting-spec.md` |
| Circle 초대 | `docs/DSL.md` (Circle 모듈), `prd/features/02-circle-invite.md` |
| 푸시 알림 | `docs/DSL.md` (Notification 모듈), `prd/features/03-push-notification.md` |
| 결과 카드 | `docs/DSL.md` (Share 모듈), `prd/features/04-result-card.md` |
| 온보딩 UX | `prd/onboarding/01-onboarding-ux.md` |
| UI/디자인 | `prd/design/02-ui-design-system.md`, `prd/design/03-animations.md` |
| 사용자 플로우 | `prd/design/04-user-flow.md` |
| DB 스키마 | `docs/DSL.md` (섹션 2. 데이터베이스 스키마) |
| API 엔드포인트 | `docs/DSL.md` (각 모듈 router 정의), `trd/05-api-specification.md` |
| 타입/인터페이스 | `docs/DSL.md` (각 모듈 types), `trd/00-interface-specifications.md` |
| 인증 시스템 | `docs/DSL.md` (Auth 모듈), `trd/06-authentication-architecture.md` |
| 전체 아키텍처 | `trd/00-system-architecture-v2.md` |
| 개발/배포 환경 | `trd/07-development-deployment-setup.md` |

## Backend Development

백엔드는 **uv** 환경에서 구축되어 있습니다. 모든 백엔드 명령어 실행 시 `uv run`을 사용하세요.

`backend/Makefile`이 기본 커맨드입니다:

```bash
make dev        # 개발 서버 (0.0.0.0:8002, Expo Go 연동용) ← 기본
make dev-local  # 로컬 전용 서버 (127.0.0.1:8000)
make test       # pytest
make lint       # ruff check
make format     # ruff format
make typecheck  # mypy
make migrate    # alembic upgrade head
make migrate-new # 마이그레이션 생성 (메시지 입력 프롬프트)
make seed       # 시드 데이터 생성
```

직접 실행 시:

```bash
# 테스트 실행
uv run pytest
uv run pytest tests/modules/auth/ -v          # 모듈별 테스트
uv run pytest tests/test_file.py::test_name   # 단일 테스트

# 마이그레이션
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "description"

# 린트/포맷
uv run ruff check .
uv run ruff format .

# 타입 체크
uv run mypy .
```

**주의**: `python`, `pip` 대신 항상 `uv run` 접두어를 사용하세요.

## Frontend Development

프론트엔드는 Expo (React Native) 기반입니다:

### 기본 명령어

```bash
# 개발 서버 실행 (scripts/update-api-url.sh로 API URL 자동 갱신 후 expo start)
npm run dev

# expo 직접 실행
npx expo start
npx expo start --ios      # iOS 시뮬레이터
npx expo start --android  # Android 에뮬레이터

# 린트 / 타입 체크 / 테스트
npm run lint       # eslint (expo lint)
npm run typecheck  # tsc --noEmit
npm test           # jest (jest-expo preset)
```

### 환경 변수 설정

`.env` 파일에 백엔드 API URL 설정 필요:

```bash
# .env (로컬 개발)
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1

# .env.production (프로덕션)
EXPO_PUBLIC_API_URL=https://api.circly.app/api/v1
```

### 코드 구조

```
frontend/src/
├── api/           # API 클라이언트 (Axios 기반, client.ts에 인터셉터)
├── types/         # TypeScript 타입 정의 (docs/DSL.md 각 모듈 기반)
├── hooks/         # React Query 훅 (useAuth, useCircles, usePolls, useSubscription 등)
├── stores/        # Zustand 전역 상태 (인증 토큰, 사용자)
├── components/    # 공용 UI 컴포넌트
├── providers/     # AppInitializer 등 앱 프로바이더
├── services/      # subscription/ (RevenueCat), notification/ (푸시 알림)
├── lib/, utils/
├── theme/         # 디자인 시스템 (tokens.ts, animations.ts)
└── _archived/     # 사용하지 않는 코드 보관 (수정 금지)
```

### 상태 관리 전략

- **서버 상태**: React Query (`@tanstack/react-query`)
  - API 데이터 캐싱, 자동 재시도, 백그라운드 업데이트
- **클라이언트 상태**: Zustand (`zustand`)
  - 인증 토큰, 사용자 정보, UI 상태

### API 타입 정의 규칙

**중요**: 모든 타입은 `docs/DSL.md`의 각 모듈 정의를 기준으로 합니다.

```typescript
// src/types/auth.ts 예시
// ✅ docs/DSL.md → Auth 모듈 → type User 참조
export interface UserResponse {
  id: string;        // UUID
  email: string;
  username: string | null;
  // ... (DSL.md와 정확히 일치)
}
```

### 디자인 시스템 사용법

```typescript
import { tokens } from '../theme';

// ✅ 올바른 사용
const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[4],
  },
});

// ❌ 하드코딩 금지
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#667eea',  // ❌
    borderRadius: 16,            // ❌
  },
});
```

### 프론트엔드 구현 가이드

| 구현 대상 | 참고 문서 |
|----------|----------|
| **전체 구현 가이드** | `trd/08-frontend-implementation-spec.md` ⭐ |
| API 연동 | `trd/08-frontend-implementation-spec.md` (섹션: API 연동 가이드) |
| 타입 정의 | `docs/DSL.md` (각 모듈 types), `trd/08-frontend-implementation-spec.md` |
| 상태 관리 | `trd/08-frontend-implementation-spec.md` (섹션: 상태 관리) |
| 에러 처리 | `trd/08-frontend-implementation-spec.md` (섹션: 에러 처리 전략) |
| 디자인 토큰 | `frontend/src/theme/tokens.ts` (구현 완료) |
| 화면별 구현 | `prd/design/05-complete-ui-specification.md` |

### 개발 워크플로우

1. **기능 구현 전 체크리스트**:
   ```bash
   ✅ docs/DSL.md에서 해당 모듈 API 확인
   ✅ src/types/에 TypeScript 타입 정의
   ✅ src/api/에 API 함수 작성
   ✅ src/hooks/에 React Query 훅 작성
   ✅ 화면 컴포넌트 구현 (prd/design/ 참조)
   ```

2. **타입 안전성 검증**:
   ```bash
   npm run typecheck  # TypeScript 에러 확인
   ```

3. **API 응답 검증**:
   - Backend 서버 실행: `cd backend && make dev`
   - API 문서: http://localhost:8002/docs (make dev-local 사용 시 8000)

### 주요 라이브러리

expo-router (파일 기반 라우팅), react-native-reanimated, @tanstack/react-query, zustand, axios, expo-haptics, react-native-purchases(-ui) (RevenueCat). 정확한 버전은 `frontend/package.json` 참조.

## Custom Commands

- `/commit` - 변경사항 분석 후 Conventional Commits 형식으로 커밋 메시지 제안

## API Response Format

```json
// Success
{ "success": true, "data": {...}, "message": "..." }

// Error
{ "success": false, "error": { "code": "ALREADY_VOTED", "message": "이미 투표에 참여하셨습니다" } }
```

주요 에러 코드:
- **Auth**: `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`
- **Circle**: `CIRCLE_NOT_FOUND`, `INVALID_INVITE_CODE`, `CIRCLE_FULL`, `ALREADY_MEMBER`
- **Poll**: `POLL_NOT_FOUND`, `POLL_ENDED`, `ALREADY_VOTED`, `SELF_VOTE_NOT_ALLOWED`, `MAX_POLLS_EXCEEDED`
