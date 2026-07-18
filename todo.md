# Circly Development Todo

> TDD 기반 백엔드 개발 진행 순서
> 각 작업 완료 후 테스트 실행 및 `/commit` 커맨드로 커밋
> 각 작업 완료 후, 작업에 완료 표시 [x]

---

## 현재 남은 작업 요약

- [x] **로컬 로그인 네트워크 장애 재점검**: 변경된 LAN IP 반영 및 mock `dev-login` 재검증
- [x] **로컬 로그인 네트워크 장애 복구**: Compose API 상태, LAN API 접근, mock `dev-login` 검증
- [x] **iOS Liquid Glass 1차 적용**: 공용 material, Home 헤더/컨트롤, 하단 탭바, 플랫폼 fallback
- [x] **플로팅 글라스 탭바**: 캡슐형 4탭 내비게이션과 투표 세션 퀵 액션
- [x] **Home 배경 단순화**: 원형 오브 제거 및 저채도 그라데이션 적용
- [x] **메인 탭 배경 통일**: 하트/Circle/프로필에 동일한 저채도 그라데이션 적용
- [ ] **실기기 QA**: Liquid Glass/Home/받은하트/Orb 힌트/초대 CTA QA
- [ ] **외부 결제 설정**: RevenueCat, App Store Connect, Google Play Console 상품/entitlement 설정
- [ ] **결제 E2E 검증**: Development Build + Sandbox 구매 + Webhook 반영 확인
- [ ] **선택 작업**: Storybook, 가로 모드, 추가 반응형 QA

---

## ✅ Phase 1-10: Backend MVP (완료)

<details>
<summary>클릭하여 펼치기</summary>

### Phase 1: 개발 환경 설정 ✅
> `trd/07-development-deployment-setup.md`
- [x] 프로젝트 초기화 (uv, pyproject.toml, .env.example)
- [x] FastAPI 기본 구조 (main.py, config.py, deps.py)
- [x] Core 모듈 (database.py, security.py, exceptions.py, responses.py)
- [x] Docker 환경 (Dockerfile, docker-compose.yml)

### Phase 2: 테스트 환경 셋업 ✅
> `trd/07-development-deployment-setup.md`, `docs/DSL.md#8`
- [x] pytest 설정 및 fixtures
- [x] 테스트용 DB, FastAPI client, async session

### Phase 3: Database 모델링 ✅
> `docs/DSL.md#2`
- [x] Alembic 설정 및 마이그레이션
- [x] Enum 정의 (UserRole, MemberRole, PollStatus, TemplateCategory, NotificationType, ReportStatus)
- [x] 모델: User, Circle, CircleMember, Poll, PollTemplate, Vote, PollResult, Notification, Report

### Phase 4: Auth 모듈 (TDD) ✅
> `trd/06-authentication-architecture.md`, `docs/DSL.md#3.1`
- [x] Schemas (UserCreate, UserResponse, UserUpdate, TokenResponse, LoginRequest)
- [x] Repository (create, find_by_email, find_by_id, update)
- [x] Service (register, login, get_current_user, update_profile)
- [x] Router (POST /register, POST /login, GET /me, PUT /me)

### Phase 5: Circle 모듈 (TDD) ✅
> `docs/DSL.md#3.2`
- [x] Schemas (CircleCreate, CircleResponse, CircleUpdate, CircleDetail, MemberInfo, JoinByCodeRequest)
- [x] Repository (create, find_by_invite_code, find_by_user_id)
- [x] Membership Repository (create, find_by_circle_id, exists)
- [x] Service (create_circle, join_by_code, get_user_circles, get_circle_detail, leave_circle, regenerate_invite_code)
- [x] Router (POST /circles, GET /circles, GET /circles/{id}, POST /circles/join/code, POST /circles/{id}/leave, GET /circles/{id}/members)

### Phase 6: Poll 모듈 (TDD) ✅
> `docs/DSL.md#3.3`, `docs/DSL.md#10`
- [x] Schemas (PollTemplateResponse, PollCreate, PollResponse, PollDetail, VoteRequest, VoteResponse, PollResultItem)
- [x] Template Repository (find_all, find_by_category)
- [x] Poll Repository (create, find_by_circle_id, update_status)
- [x] Vote Repository (create, exists_by_voter_hash, get_results)
- [x] Service (get_templates, create_poll, vote, get_results, close_poll)
- [x] Router (GET /polls/templates, POST /circles/{id}/polls, GET /circles/{id}/polls, GET /polls/{id}, POST /polls/{id}/vote, GET /polls/{id}/results)

### Phase 7: Notification 모듈 (TDD) ✅
> `docs/DSL.md#3.4`
- [x] Schemas (NotificationResponse, NotificationSettingsResponse, NotificationSettingsUpdate)
- [x] Repository (create, find_by_user_id, mark_as_read)
- [x] Service (send_poll_started, send_vote_received, get_notifications)
- [x] Router (GET /notifications, PUT /notifications/{id}/read, GET /notifications/unread-count)

### Phase 8: Report 모듈 (TDD) ✅
> `docs/DSL.md#3.5`
- [x] Schemas (ReportCreate, ReportResponse)
- [x] Repository (create, find_by_status)
- [x] Service (create_report)
- [x] Router (POST /reports)

### Phase 9: 통합 테스트 및 마무리 ✅
> `docs/DSL.md#5`, `docs/DSL.md#8`
- [x] 통합 테스트 (Circle 플로우, Poll 플로우)
- [x] API 문서화 (OpenAPI)
- [x] Rate limiting, CORS 설정
- [x] 초기 데이터 시딩 (poll_templates)

### Phase 10: 코드 품질 개선 ✅
- [x] 보안 강화 (Notification 권한 체크)
- [x] 아키텍처 개선 (트랜잭션 관리, DI 개선, N+1 해결)
- [x] 에러 핸들링 개선
- [x] 로깅 시스템 도입
- [x] CORS 설정 개선
- [x] 상수 추출

### 최종 점검 ✅
- [x] 전체 테스트 통과 (140 passed, 87% coverage)
- [x] 린트 통과: `uv run ruff check app/`
- [x] 타입 체크 통과: `uv run mypy app/`

</details>

---

## Phase 11: Frontend Development

> **참고 문서**: `prd/design/02-ui-design-system.md`, `prd/design/03-animations.md`, `prd/design/05-complete-ui-specification.md`

### iOS Liquid Glass 디자인 개선
> **참고 문서**: `prd/design/02-ui-design-system.md`, `prd/design/03-animations.md`, Apple Human Interface Guidelines - Materials, Expo SDK 54 GlassEffect/BlurView
- [x] iOS 26 네이티브 Liquid Glass와 구형 iOS/Android fallback을 제공하는 공용 surface 구현
- [x] Home 배경, 헤더, Circle 선택, 투표 세션 카드, 탭 선택 UI 개선
- [x] 하단 탭바에 system material blur 적용
- [x] 투명도 감소 접근성 설정과 라이트/다크 모드 대응
- [x] TypeScript, 테스트, lint 검증

### 플로팅 글라스 탭바
> **참고 문서**: `prd/design/02-ui-design-system.md`, 사용자 제공 Liquid Glass 플로팅 메뉴 레퍼런스 이미지
- [x] 4개 메인 탭을 플로팅 캡슐형 글라스 내비게이션으로 교체
- [x] 선택 탭 원형 강조, 짧은 한글 라벨, 받은하트 배지 적용
- [x] 별도 원형 투표 세션 퀵 액션과 쿨다운 상태 적용
- [x] 각 탭 콘텐츠/FAB의 하단 안전 여백 조정
- [x] TypeScript, 테스트, lint, iOS bundle 검증

### Gas 레퍼런스 화면/플로우 분석
> **참고 문서**: YouTube `How to use Gas App | Gas School App`, `prd/research/gas-app-analysis.md`, `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md`
- [x] Gas 앱 온보딩/투표/인박스/수익화 화면 단위 분석
- [x] 각 화면별 와이어프레임 작성
- [x] Circly 재구현을 위한 터치 단위 사용자 플로우 정리

### Supabase Paused 대응: 로컬 개발 Auth (임시)
> **참고 문서**: `trd/06-authentication-architecture.md`, `trd/08-frontend-implementation-spec.md`
- [x] 백엔드 development 전용 dev-login 엔드포인트 추가
- [x] 백엔드 development 전용 dev token 인증 처리 추가
- [x] 프론트 mock auth 모드에서 Supabase 대신 백엔드 dev-login 사용
- [x] Docker Compose API 포트를 Expo 개발 기본값과 맞춤
- [x] `AGENTS.md`에 로컬 mock user 테스트 계정 기록
- [x] 타입 체크/테스트로 검증

### 11.1 Design Tokens Setup (P0)
- [x] `frontend/src/theme/` 디렉토리 생성
- [x] `frontend/src/theme/tokens.ts` - 디자인 토큰 정의 → `prd/design/02-ui-design-system.md`
  - [x] Colors (Primary, Secondary, Semantic, Neutral, Gradients)
  - [x] Typography (Font families, sizes, weights, line heights)
  - [x] Spacing (8pt grid)
  - [x] Border Radius
  - [x] Shadows (Elevation)
  - [x] Z-Index Scale
  - [x] Icon Sizes
  - [x] Touch Targets
  - [x] Dark Theme Support
- [x] `frontend/src/theme/animations.ts` - 애니메이션 토큰 → `prd/design/03-animations.md`
  - [x] Duration Tokens
  - [x] Easing Curves (React Native Reanimated)
  - [x] Spring Configurations
  - [x] Animation Helpers (animateValue, animateSpring)
  - [x] Animation Patterns (fade, slide, scale, modal, toast)
  - [x] Haptic Feedback Patterns
- [x] `frontend/src/theme/index.ts` - 통합 export
- [x] **커밋**: `feat(frontend): add design tokens and animation system`

### 11.2 Basic Primitives Components (P0)
- [x] `frontend/src/components/primitives/` 디렉토리 생성
- [x] `Button.tsx` - 기본 버튼 컴포넌트
  - [x] Primary, Secondary, Ghost variants
  - [x] Size variants (sm, md, lg)
  - [x] Loading state
  - [x] Disabled state
  - [x] Press animation (React Native Reanimated)
  - [x] Haptic feedback
  - [ ] **테스트**: Storybook 또는 수동 테스트
- [x] `Card.tsx` - 카드 컴포넌트
  - [x] 기본 카드 레이아웃
  - [x] Shadow elevation variants
  - [x] Border radius variants
  - [x] Press animation (선택적)
- [x] `Input.tsx` - 입력 필드 컴포넌트
  - [x] Text input
  - [x] Focus/Error states
  - [x] Label, placeholder, helper text
  - [x] Validation feedback
- [x] `Text.tsx` - 타이포그래피 컴포넌트
  - [x] Typography variants (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
  - [x] Weight variants (normal, medium, semibold, bold)
  - [x] Color variants
- [x] **커밋**: `feat(frontend): add primitive components`

### 11.3 Expo Router Setup (P0)
- [x] Expo 프로젝트 초기화
  - [x] `npx create-expo-app frontend --template blank-typescript`
  - [x] `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`
  - [x] `npx expo install react-native-reanimated react-native-gesture-handler`
- [x] `frontend/app/` 디렉토리 구조 생성 → `CLAUDE.md#Architecture`
  - [x] `app/(auth)/` - 비인증 화면 (로그인, 가입)
  - [x] `app/(main)/(home)/` - Home 탭 (진행 중 투표)
  - [x] `app/(main)/(create)/` - 투표 생성 탭
  - [x] `app/(main)/(profile)/` - Profile 탭
- [x] `app/_layout.tsx` - Root layout with theme provider
- [x] `app/(auth)/_layout.tsx` - Auth layout
- [x] `app/(main)/_layout.tsx` - Main layout with tabs
- [x] `app/(main)/(home)/_layout.tsx` - Home tab layout
- [x] `app/(main)/(create)/_layout.tsx` - Create poll tab layout
- [x] `app/(main)/(profile)/_layout.tsx` - Profile tab layout
- [x] **검증**: Node 22.23.1로 `npx expo start --lan --port 8081 --clear` 실행 확인
  - Metro 응답 확인: `http://localhost:8081` 200 OK
  - 전역 Node 23.9.0은 유지, Circly 실행 시 `/opt/homebrew/opt/node@22/bin`만 사용
- [x] **커밋**: `feat(frontend): setup Expo Router file structure and layouts`

### 11.4 Animation Hooks (P1)
- [x] `frontend/src/hooks/` 디렉토리 생성
- [x] `useAnimation.ts` - 공통 애니메이션 훅
- [x] `useHaptics.ts` - Haptic feedback 훅
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add animation hooks`

### 11.5 Pattern Components (P1)
- [x] `frontend/src/components/patterns/` 디렉토리 생성
- [x] `VoteCard.tsx` - 투표 카드 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.3`
- [x] `ResultBar.tsx` - 결과 바 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.4`
- [x] `ProgressBar.tsx` - 질문 진행 표시 → `prd/design/02-ui-design-system.md#Progress Indicator`
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add pattern components`

### 11.6 Empty/Loading States (P1)
- [x] `frontend/src/components/states/` 디렉토리 생성
- [x] `EmptyState.tsx` - 빈 상태 컴포넌트
- [x] `LoadingSpinner.tsx` - 로딩 스피너
- [x] `Skeleton.tsx` - Skeleton 로딩
- [x] `index.ts` - Barrel export
- [x] **커밋**: `feat(frontend): add empty and loading states`

### 11.7 UI Documentation (P2)
- [ ] Storybook 설정 (선택적, 현재 MVP 범위 밖)
- [x] 컴포넌트 사용 가이드 작성 (`frontend/src/components/README.md`)
- [x] **커밋**: 기존 UI 작업 커밋에 포함

### 11.8 Responsive Testing (P2)
- [ ] 다양한 화면 크기 테스트 (실기기 QA 시 확인)
- [ ] Safe Area 처리 확인 (실기기 QA 시 확인)
- [ ] 가로 모드 지원 (선택적, 현재 MVP 범위 밖)
- [ ] **외부 검증 대기**: 실기기/시뮬레이터 QA 결과 기준으로 업데이트

### 11.9 Dark Mode Implementation (P2) ✅
- [x] Dark theme tokens 적용
- [x] Theme provider 구현
- [x] Theme toggle 컴포넌트
- [x] **커밋**: `feat(frontend): implement dark mode support`

### 11.10 Create Tab - 투표 생성 (P0)

> **참고 문서**: `prd/design/05-complete-ui-specification.md#2.6`, `prd/design/04-user-flow.md`

#### 11.10.1 메인 화면 - 카테고리 탐색 (P0)
- [x] `app/(main)/(create)/index.tsx` - Create Tab 메인 화면
- [x] **개선 완료**: 백엔드 API에서 동적으로 가져오도록 수정
- [x] **테스트**: 카테고리 선택 동작 확인
- [x] **커밋**: 기존 Create 플로우 작업 커밋에 포함

#### 11.10.2 질문 선택 화면 - 스와이프 카드 (P0)
- [x] `app/(main)/(create)/select-template.tsx` - 질문 카드 스택 화면
- [x] **스와이프 제스처** (React Native Gesture Handler + Reanimated)
- [x] **5개 액션 버튼**
- [x] **테스트**: 스와이프 제스처 및 버튼 동작 확인
- [x] **커밋**: `feat(frontend): implement swipe card question selection`

#### 11.10.3 투표 설정 화면 (P0)
- [x] `app/(main)/(create)/configure.tsx` - 투표 설정 화면
- [x] **테스트**: 설정 선택 및 유효성 검사 확인
- [x] **커밋**: `feat(frontend): implement poll settings screen`

#### 11.10.4 미리보기 화면 (P0)
- [x] `app/(main)/(create)/preview.tsx` - 미리보기 화면
- [x] **테스트**: 미리보기 표시 및 버튼 동작 확인
- [x] **커밋**: `feat(frontend): implement poll preview screen`

#### 11.10.5 발행 완료 화면 (P0)
- [x] `app/(main)/(create)/success.tsx` - 발행 완료 화면
- [x] **테스트**: 애니메이션 및 자동 전환 확인
- [x] **커밋**: `feat(frontend): implement poll creation success screen`

#### 11.10.6 통합 및 상태 관리 (P1)
- [x] `frontend/src/stores/pollCreate.ts` - 투표 생성 상태 관리 (Zustand)
- [x] `frontend/src/hooks/useCreatePoll.ts` - 투표 생성 React Query hook
- [x] Configure, Preview, Success 화면에 state management 통합
- [x] **테스트**: 타입체크 및 Create 직접 접근 제한 플로우 정적 검증
- [x] **커밋**: 기존 Create/API 연동 작업 커밋에 포함

#### 11.10.7 최적화 및 UX 개선 (P2)
- [x] 카드 프리로딩 (다음 2장 미리 렌더링)
- [x] 스와이프 제스처 피드백 강화
- [x] 애니메이션 성능 최적화
- [x] 접근성 개선
- [x] **커밋**: `perf(frontend): optimize Create Tab animations and UX`

### 11.11 Home Tab - 투표 피드 (P0)

> **참고 문서**: `prd/design/05-complete-ui-specification.md`, `prd/design/04-user-flow.md`, `docs/DSL.md#3.3 (Poll 모듈)`

#### 11.11.1 화면 레이아웃 및 탭 구조 (P0)
- [x] `app/(main)/(home)/index.tsx` - Home Tab 메인 화면 → `prd/design/05-complete-ui-specification.md#2.2`
- [x] **테스트**: Mock 데이터로 레이아웃 확인 완료
- [x] **커밋**: `feat(frontend): implement Home Tab layout with poll cards`

#### 11.11.2 투표 카드 컴포넌트 (P0)
- [x] `src/components/patterns/PollCard.tsx` - 투표 카드 컴포넌트 → `prd/design/05-complete-ui-specification.md#2.1.2`
- [x] **테스트**: 카드 variants 렌더링 확인
- [x] **커밋**: 기존 Home/Poll UI 작업 커밋에 포함

#### 11.11.3 Empty State 컴포넌트 (P1)
- [x] Empty State variants 구현
- [x] **커밋**: 기존 Home/Poll UI 작업 커밋에 포함

#### 11.11.4 남은 시간 계산 유틸리티 (P0)
- [x] `src/utils/timeUtils.ts` - 시간 계산 함수
- [x] **테스트**: 다양한 시간 케이스 단위 테스트 (`frontend/src/utils/__tests__/timeUtils.test.ts`, 13 tests passed)
- [x] **커밋**: 기존 Home/Poll UI 작업 커밋에 포함

#### 11.11.5 투표 목록 API 연동 (P0)
- [x] `src/hooks/usePolls.ts` 확장
- [x] **테스트**: 로컬 mock auth 핵심 API smoke 확인
- [x] **커밋**: 기존 Home/Poll API 연동 작업 커밋에 포함

#### 11.11.6-10 기타 구현
- [x] 리스트 렌더링 및 최적화 (P1)
- [x] 투표 상세 화면 네비게이션 (P0)
- [x] 실시간 카운트다운 (P1)
- [x] 접근성 개선 (P2)
- [x] 애니메이션 및 피드백 (P2)

### 11.12 Circle 참여 플로우 (P0)

> **참고 문서**: `prd/features/02-circle-invite.md`, `prd/design/04-user-flow.md`

- [x] Home 탭 진입점 추가 (P0)
- [x] 초대 코드 입력 API 연동 (P0)
- [x] 닉네임 설정 및 Circle 가입 API 연동 (P0)
- [x] 딥링크 처리 (P1)
- [x] 가입 성공 화면 (P2)

---

## 참고 문서 목록

> **Single Source of Truth**: `docs/DSL.md`가 스키마, 타입, API 정의의 기준 문서입니다.

| 문서 | 경로 | 주요 내용 |
|------|------|----------|
| **DSL 정의 (기준)** | `docs/DSL.md` | 전체 도메인 모델, 스키마, 워크플로우 |
| 시스템 아키텍처 | `trd/00-system-architecture-v2.md` | 전체 시스템 구조, 모듈 통신 |
| 인터페이스 명세 | `trd/00-interface-specifications.md` | TypeScript/Python 타입 정의 (DSL.md 기반) |
| API 명세 | `trd/05-api-specification.md` | REST API 엔드포인트 정의 (DSL.md 기반) |
| 인증 아키텍처 | `trd/06-authentication-architecture.md` | JWT, 세션 관리 |
| 개발환경 셋업 | `trd/07-development-deployment-setup.md` | uv, Docker, CI/CD |

---

## Phase 12: Unmatched Route 수정 (P0 - 긴급)

> **문제**: _layout.tsx에 정의된 라우트와 실제 파일이 불일치하여 "Unmatched Route" 에러 발생

### 12.1 중복 라우트 정의 제거 (Root에 이미 존재)
- [x] `(main)/(home)/_layout.tsx` 수정
- [x] `(main)/(profile)/_layout.tsx` 수정

### 12.2 누락된 라우트 파일 생성
- [x] `app/(main)/(profile)/circles.tsx` - 내 Circle 목록/관리 화면
- [x] `app/(main)/(profile)/settings.tsx` - 설정 화면
- [x] `app/(main)/(profile)/notifications.tsx` - 알림 설정 화면
- [x] `app/(dev)/_layout.tsx` - 개발 도구 레이아웃 추가

### 12.3 라우트 구조 검증
- [x] 모든 _layout.tsx 파일과 실제 파일 매칭 확인
- [x] `(create)/_layout.tsx`에 누락된 `preview` 라우트 추가
- [x] **검증**: Node 22.23.1로 `npx expo start --lan --port 8081 --clear` 실행하여 Metro 시작 확인
- [x] **커밋**: `fix(frontend): resolve unmatched route errors and add profile sub-screens`

---

## 고도화 작업 (TODO)

- [x] **Supabase Auth**: anon key → Publishable key로 변경 (보안 강화)

---

## Phase 13: Orb Mode 수익화 구현

> **핵심 기능**: 유료 구독자(Orb Mode)가 받은 하트 맥락에서 단계형 안전 힌트를 볼 수 있는 기능
> **참고 문서**: `docs/DSL.md` (votes 테이블, 보안 정책), `prd/business/01-business-model.md`

### 13.1 Backend: Vote 모델 수정 (P0)
- [x] `app/modules/polls/models.py` - Vote 모델에 `voter_id` 컬럼 추가
- [x] `app/modules/auth/models.py` - User 모델에 `votes_cast` relationship 추가
- [x] 마이그레이션 생성 및 적용
- [x] `app/modules/polls/service.py` - `vote()` 함수에서 `voter_id` 저장하도록 수정
- [x] **커밋**: 기존 Orb Mode 안전 힌트/후속 정리 커밋에 포함

### 13.2 Backend: Orb Mode API 추가 (P1)
- [x] `app/modules/polls/schemas.py` - 안전 힌트 응답 스키마 추가
- [x] `app/modules/polls/router.py` - Orb Mode 전용 힌트 엔드포인트 추가 (GET /{poll_id}/hints)
- [x] `app/modules/polls/service.py` - 받은 하트 기반 힌트 조회 함수 구현
- [x] `app/modules/polls/repository.py` - 받은 하트 힌트 생성용 쿼리 추가
- [x] `app/modules/auth/models.py` - `is_orb_mode` 필드 추가
- [x] **커밋**: `feat: add Orb Mode safe hints`

### 13.3 RevenueCat 연동 (P2)
- [x] RevenueCat SDK 설치 및 설정
- [x] Orb Mode 구독 상태 확인 미들웨어/의존성 추가
- [x] 구독 상태에 따른 API 접근 제어
- [x] **커밋**: 17.3-17.5 RevenueCat/Subscription 작업에 포함

### 13.4 Frontend: Orb Mode UI (P2)
- [x] `frontend/src/types/poll.ts` - 안전 힌트 타입 추가
- [x] `frontend/src/types/auth.ts` - `is_orb_mode` 필드 추가
- [x] `frontend/src/api/poll.ts` - `getMyVoteHints()` API 함수 추가
- [x] `frontend/src/hooks/usePolls.ts` - `useMyVoteHints()` 훅 추가
- [x] `frontend/app/results/[id].tsx` - `받은 하트 힌트 보기` 버튼 추가
- [x] `frontend/app/poll/[id].tsx` - Orb Mode 안전 힌트 진입점 정리
- [x] `frontend/app/results/[id]/hints.tsx` - 안전 힌트 화면 구현
- [x] `useCurrentUser` 훅으로 `is_orb_mode` 조회 방식 개선
- [x] Orb Mode 페이월/구독 화면 구현
- [x] RevenueCat SDK 연동 (Expo, Development Build 필요)

### 13.5 Frontend: UX / UI 개선점

#### 13.5.1 🔙 뒤로 가기 네비게이션 구현 ✅
- [x] Expo Router의 `Stack.Screen` 옵션으로 헤더 표시

#### 13.5.2 📱 Safe Area 적용 ✅
- [x] `useSafeAreaInsets` 훅 활용한 동적 패딩 적용

#### 13.5.3 😊 이모지 이미지 상단 잘림 ✅
- [x] 이모지 컨테이너에 적절한 `lineHeight` 설정

#### 13.5.4 🏠 앱 시작 시 초기 탭 ✅
- [x] `initialRouteName="(home)"` 설정

#### 13.5.5 👆 Home 탭 스와이프 ✅
- [x] `react-native-pager-view` 사용으로 구현

#### 13.5.6 👻 투표 카드 클릭 시 Box 사라짐 ✅
- [x] `removeClippedSubviews={false}`로 변경
- [x] `useFocusEffect` + `focusKey` 상태로 화면 복귀 시 FlatList 강제 리렌더링

#### 13.5.7 📝 한글 텍스트 단어 분리 ✅
- [x] Android: `textBreakStrategy="highQuality"` 추가

#### 13.5.8 🔐 로그인 세션 유지 ✅
- [x] Supabase Auth 직접 연동 완료

---

### 📚 참고 문서 링크

| 문서 | 수정 내용 |
|------|----------|
| `docs/DSL.md` | votes 테이블에 `voter_id` 추가, 보안 정책 Orb Mode 반영 |
| `prd/00-prd.md` | "기본 익명성 + Orb Mode" 차별화 포인트 |
| `prd/business/01-business-model.md` | Orb Mode 수익화 상세 (단계별 힌트, 가격 등) |

---

## 🐛 Bug Fixes

### B1. Poll 생성 API 라우트 경로 오류 ✅
> **상태**: 해결됨 (2025-01-04)
- [x] 백엔드/프론트엔드 API 경로 수정

---

## Phase 14: Frontend Code TODO 정리

> **점검일**: 2025-01-07

### 🔴 심각 (핵심 기능 미완성)
- [x] **14.1** `pushNotification.ts:51` - `'your-project-id'` 하드코딩 → Constants에서 가져오기 ✅
- [x] **14.2** `results/[id].tsx:20` - 실제 투표 결과 API 연동 ✅
- [x] **14.3** `results/[id].tsx:35` - 결과 공유 기능 구현 ✅
- [x] **14.4** `circle/create.tsx:48,61` - Circle 생성 API 연동 ✅

### 🟡 중간 (부가 기능 미완성)
- [x] **14.5** `useAuth.ts:168,177` - 회원탈퇴 API 구현 ✅ (Profile→설정 경로 추가)
- [x] **14.6** `_layout.tsx:74` - 딥링크 unique_id → invite_code 변환 API
- [x] **14.7** `notifications.tsx:26` - 알림 설정 API 연동 ✅

### 🟢 낮음 (UI/UX 개선)
- [x] **14.8** `_layout.tsx:46,53,60` - 탭바 아이콘 추가 (Ionicons) ✅
- [x] **14.9** `(home)/index.tsx:107` - 활성 Circle 이름 useCircle 훅에서 가져오기 ✅
- [x] **14.10** `useCreatePoll.ts:72` - 에러 토스트/알림 표시 ✅
- [x] **14.11** `CircleCard.tsx:64` - active_polls_count 백엔드 추가 후 활성화 ✅
- [x] **14.12** `results/[id].tsx:48` - Orb Mode 구독 유도 모달 ✅

### ⚠️ 기타 (정리 필요)
- [x] **14.13** `theme/index.ts:117-137` - 임시 더미 애니메이션 exports 정리 완료 ✅

---

## Phase 15: 푸시 알림 시스템 완성


> **참고 문서**: `prd/features/03-push-notification.md`
> **기술 문서**: `trd/03-push-notification-implementation.md`
> **현황**: 인프라 구축됨 (DB 모델, Repository, API), 실제 발송 미구현

### 15.1 메시지 템플릿 한글화 ✅

> **참고**: `prd/features/03-push-notification.md#1. 푸시 알림 유형별 설계`

- [x] `backend/app/modules/notifications/service.py` - 메시지 템플릿 한글화:

| 유형 | Title | Body |
|------|-------|------|
| `poll_start` | 🗳️ 새로운 투표가 시작됐어요! | "{질문 30자}" 지금 바로 참여해보세요! 👆 |
| `poll_deadline_1h` | ⏰ 투표 마감 1시간 전! | "{질문}" 친구들이 기다리고 있어요 🔥 |
| `poll_deadline_10m` | 🚨 마지막 기회! | "{질문}" 투표 마감 10분 전 놓치면 후회할걸요? 😱 |
| `poll_result` | 🎉 투표 결과가 나왔어요! | "{질문}" 궁금하지 않아? 결과 확인하러 가기 ✨ |

### 15.2 Backend - Expo Push API 연동 ✅

> **참고**: `prd/features/03-push-notification.md#10.5 Backend 구현 명세`

- [x] `backend/app/services/expo_push.py` - Expo Push API 클라이언트 구현
  - [x] `send_push_notification()` - 단일 푸시 발송
  - [x] `send_push_notifications_batch()` - 배치 푸시 발송
  - [x] 에러 핸들링 (토큰 무효화, 재시도 로직)
- [x] `backend/app/modules/notifications/service.py` - 실제 푸시 발송 연동
  - [x] `send_poll_started()` - Expo Push 호출 추가
  - [x] `send_poll_ended()` - Expo Push 호출 추가
  - [x] `send_poll_reminder()` - Expo Push 호출 추가
- [x] 테스트 코드 작성 (`backend/tests/modules/notifications/test_service.py` 서비스 생성자 최신화 + Expo Push mock 검증)

### 15.3 Backend - Celery 스케줄링 설정

> **참고**: `prd/features/03-push-notification.md#10.5.2 Background Tasks`

- [x] `backend/app/core/celery.py` - Celery 설정
- [x] `backend/app/tasks/__init__.py` - Task 모듈 생성
- [x] `backend/app/tasks/notification_tasks.py` - 알림 스케줄 태스크
  - [x] `schedule_poll_deadline_notifications()` - 마감 알림 스케줄링
  - [x] `send_poll_deadline_notification_1h()` - 1시간 전 알림
  - [x] `send_poll_deadline_notification_10m()` - 10분 전 알림
  - [x] `send_poll_result_notification()` - 결과 발표 알림
- [x] `docker-compose.yml` - Celery worker, beat 추가

### 15.4 Backend - 이벤트 연동 (즉시 발송 ✅)

> **참고**: `prd/features/03-push-notification.md#10.3 알림 유형별 구현 명세`

- [x] `backend/app/modules/polls/service.py` - 투표 생성 시 알림 트리거
  - [x] `create_poll()` → `notification_service.send_poll_started()` 호출
  - [x] `create_poll()` → 마감 알림 스케줄링 호출 (Celery 필요)
- [x] `backend/app/modules/polls/service.py` - 투표 마감 처리 시 결과 알림
  - [x] `close_poll()` → `send_poll_ended()` 호출
- [x] `backend/app/modules/polls/service.py` - 투표 참여 시 알림
  - [x] `vote()` → `send_vote_received()` 호출 (누군가 나를 선택)

### 15.5 Frontend - 푸시 토큰 자동 등록 ✅

> **참고**: `prd/features/03-push-notification.md#10.4 Frontend 구현 명세`

- [x] `frontend/src/services/notification/pushNotification.ts:51` - projectId 수정 (Constants에서 가져오기)
- [x] `frontend/src/providers/AppInitializer.tsx` - 앱 시작 시 푸시 토큰 등록 로직 추가
  - [x] 로그인 상태일 때 `registerForPushNotificationsAsync()` 호출
  - [x] 토큰 획득 후 `registerPushToken()` API 호출
- [x] `frontend/src/hooks/useAuth.ts` - 로그아웃 시 `unregisterPushToken()` 호출

### 15.6 Frontend - 딥링크 처리 ✅

> **참고**: `prd/features/03-push-notification.md#5. 딥링크 및 인앱 라우팅`

- [x] `frontend/src/services/notification/pushNotification.ts` - 알림 응답 핸들러 구현
  - [x] `poll_start` → `/poll-participation/{poll_id}` 이동
  - [x] `poll_result` → `/results/{poll_id}` 이동
  - [x] `poll_deadline` → `/poll-participation/{poll_id}` 이동
  - [x] `vote_received` → `/results/{poll_id}` 이동
  - [x] `circle_invite` → `/circle/{circle_id}` 이동
- [x] `frontend/src/providers/AppInitializer.tsx` - 딥링크 리스너 등록

### 15.7 Frontend - 알림 설정 API 연동 ✅

> **참고**: `prd/features/03-push-notification.md#3. 알림 설정 및 개인화`

- [x] `backend/app/modules/auth/models.py` - User 모델에 알림 설정 필드 추가
- [x] `backend/app/modules/notifications/router.py` - 설정 조회/업데이트 API 추가
  - [x] `GET /notifications/settings`
  - [x] `PUT /notifications/settings`
- [x] `frontend/src/api/notification.ts` - 설정 API 함수 추가
- [x] `frontend/src/hooks/useNotificationSettings.ts` - React Query 훅 추가
- [x] `frontend/app/(main)/(2-profile)/notifications.tsx` - API 연동
  - [x] 설정 조회 후 상태 초기화
  - [x] 토글 변경 시 API 호출 (낙관적 업데이트)

---

## Phase 16: Profile 및 설정 기능 완성

> **점검일**: 2025-01-11

### 16.1 Profile 편집 기능 (P0) ✅

> **참고**: `prd/design/04-user-flow.md`

- [x] `frontend/src/components/profile/ProfileEditModal.tsx` - Profile 편집 모달 검증
  - [x] 닉네임(display_name) 수정 기능
  - [x] Profile 이모지 선택 기능 (32개 옵션)
  - [x] username 수정 기능 (선택적)
  - [x] 검증 규칙 통일 (username min 2자, display_name max 100자)
  - [x] 필드별 인라인 에러 메시지
- [x] `frontend/app/(main)/(2-profile)/index.tsx` - 편집 모달 연동 확인
- [x] 백엔드 `PUT /auth/me` API 연동 확인
- [x] Toast 알림 시스템 추가 (Alert → Toast)
- [x] **커밋**: `feat(profile): Profile 편집 UX 전면 개선`

### 16.2 다크모드 구현 (P1) ✅

> **참고**: `prd/design/02-ui-design-system.md#Dark Theme`

- [x] `frontend/src/theme/ThemeContext.tsx` - 다크모드 Context 검증
  - [x] 시스템 설정 따르기 기능
  - [x] 수동 토글 기능
  - [x] AsyncStorage 저장/복원
- [x] `frontend/src/theme/tokens.ts` - 다크모드 토큰 검증
  - [x] 다크모드 색상 팔레트 완성
  - [x] 컴포넌트별 다크모드 스타일
- [x] 주요 화면 다크모드 적용 확인
  - [x] Home 탭
  - [x] Circle 탭
  - [x] Profile 탭
  - [x] 설정 화면
- [ ] **실기기 QA 대기**: 라이트/다크 전환 시 모든 UI 정상 표시 확인

### 16.3 설정 - 정보 섹션 구현 (P1) ✅

> **파일**: `frontend/app/(main)/(2-profile)/settings.tsx`

- [x] 개인정보처리방침 페이지
  - [x] 인앱 웹뷰 연결 (expo-web-browser)
  - [x] URL: `https://circly.app/privacy`
- [x] 서비스 이용약관 페이지
  - [x] 인앱 웹뷰 연결 (expo-web-browser)
  - [x] URL: `https://circly.app/terms`
- [x] 오픈소스 라이선스 페이지
  - [x] 인앱 웹뷰 연결 (expo-web-browser)
  - [x] URL: `https://circly.app/licenses`
- [x] 앱 버전 표시
  - [x] `expo-constants`에서 동적 버전 조회
- [x] **커밋**: `feat(settings): 정보 섹션 인앱 웹뷰 전환 및 버전 동적화`
  - [ ] 빌드 번호 표시 (선택적)
- [ ] **실기기 QA 대기**: 각 링크 정상 동작 확인

---

## Phase 17: Orb Mode 결제 시스템 완성

> **목표**: RevenueCat 연동으로 Orb Mode 유료화 MVP 완성
> **참고 문서**: `prd/features/05-orb-mode-implementation.md`, `prd/business/01-business-model.md`
> **예상 기간**: 5-7일

### 17.1 Backend: Orb Mode 테스트 (P0) ✅

- [x] `backend/tests/modules/polls/test_orb_mode.py` - 테스트 파일 생성
  - [x] Orb Mode 구독자 안전 힌트 접근 허용
  - [x] 비구독자 고급 힌트 제한/잠금 응답
  - [x] 존재하지 않는 Poll 접근 거부
  - [x] 비멤버 접근 거부
- [x] `backend/tests/conftest.py` - `enable_orb_mode_for_user` fixture 추가
- [x] **검증**: `uv run pytest tests/modules/polls/test_orb_mode.py -v` (3 tests passed, legacy `/voters` 제거 기준)
- [x] **커밋**: `test(polls): add Orb Mode authorization tests`

### 17.2 RevenueCat 설정 (P1) - 외부 작업

- [ ] RevenueCat 계정 생성 (https://app.revenuecat.com)
- [ ] App Store Connect - In-App Purchase 상품 생성
  - [ ] `orb_mode_monthly`: $4.99/월
  - [ ] `orb_mode_annual`: $49.99/년
- [ ] Google Play Console - 구독 상품 생성
- [ ] RevenueCat 대시보드 설정
  - [ ] iOS/Android 앱 연결
  - [ ] Products 등록
  - [ ] Entitlement 생성: `orb_mode`
  - [ ] Webhook URL 설정 (17.4 완료 후)

### 17.3 Frontend: RevenueCat SDK 연동 (P1) ✅

> **중요**: Expo Go 미지원 - Development Build 필수!

- [x] 패키지 설치: `npx expo install react-native-purchases expo-dev-client`
- [x] EAS Build 설정: `eas build:configure`
- [x] `frontend/eas.json` 생성
- [x] `frontend/app.json` - RevenueCat 플러그인 추가
- [x] `frontend/src/services/subscription/revenuecat.ts` - SDK 래퍼 생성
  - [x] `initializePurchases(userId)`
  - [x] `getSubscriptionStatus(): boolean`
  - [x] `getOfferings(): Package[]`
  - [x] `purchasePackage(pkg): CustomerInfo`
  - [x] `restorePurchases(): CustomerInfo`
- [ ] Development Build 생성: `eas build --profile development --platform ios` (외부 작업)
- [ ] **검증**: SDK 초기화 및 상품 목록 조회 확인 (17.2 완료 후)
- [x] **커밋**: `feat(frontend): add RevenueCat SDK integration`

### 17.4 Backend: Webhook 연동 (P1) ✅

- [x] `backend/app/modules/subscription/` 모듈 생성
  - [x] `__init__.py`
  - [x] `models.py` - WebhookEvent 모델 (idempotency)
  - [x] `schemas.py` - RevenueCatWebhookPayload
  - [x] `service.py` - process_webhook()
  - [x] `router.py` - POST /webhooks/revenuecat
- [x] `backend/app/main.py` - subscription 라우터 등록
- [x] 마이그레이션: `uv run alembic revision --autogenerate -m "add webhook_events table"`
- [x] `.env` - `REVENUECAT_WEBHOOK_SECRET` 추가
- [x] **테스트**: 11개 테스트 통과 (`tests/modules/subscription/test_webhook.py`)
- [ ] **검증**: ngrok으로 로컬 Webhook 테스트 (외부 작업)
- [x] **커밋**: `feat(subscription): add RevenueCat webhook handler`

### 17.5 Frontend: Subscription 화면 (P1) ✅

- [x] `frontend/app/subscription/index.tsx` - Paywall UI
  - [x] 헤더 (이모지 + 타이틀 + 설명)
  - [x] 기능 목록 (안전 힌트, 프리미엄 배지)
  - [x] 가격 카드 (월간/연간)
  - [x] CTA 버튼 ("구독하기")
  - [x] 복원 링크 ("구매 내역 복원")
  - [x] 법적 안내 (가격, 취소 정책)
- [x] `frontend/app/results/[id].tsx` - Alert → Subscription 화면 이동
- [x] `frontend/app/poll/[id].tsx` - Alert → Subscription 화면 이동
- [x] `frontend/src/providers/AppInitializer.tsx` - RevenueCat 초기화 추가
- [ ] **검증**: Sandbox 구매 테스트 (외부 작업 - Development Build 필요)
- [x] **커밋**: `feat(frontend): add Subscription paywall screen`

### 17.6 E2E 검증 (P1)

- [ ] Sandbox 테스터로 전체 플로우 테스트
  - [ ] 로그인 → 투표 참여 → 결과 화면
  - [ ] "받은 하트 힌트 보기" → Subscription 화면
  - [ ] 구독 구매 → Webhook → is_orb_mode=True
  - [ ] 안전 힌트 화면 접근 성공
- [x] **문서 상태 업데이트**: 18.23 legacy 문서/todo 정리에 포함

---

## Phase 18: UX 개선 로드맵 (Gas/Skrr 벤치마킹)

> **참고 문서**: `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md`, 계획: `~/.claude/plans/ux-reflective-yao.md`
> **벤치마킹**: Gas(4지선다 투표 세션·쿨다운·Flame 인박스·Orb Mode 대응 유료 힌트), Skrr(칭찬 질문 필터·후보 공정성·구독 힌트)
> **원칙**: 학교/연락처 온보딩 미도입(Circle 기반 유지), Stage 1은 프론트 전용(백엔드 무변경)

### Stage 1 — 폴리싱 (프론트 전용)

#### 18.1 알림 인박스 + 라이브 배지 (P0)
- [x] `src/api/notification.ts` — getNotifications/getUnreadCount/markAsRead/markAllAsRead 추가
- [x] `src/hooks/useNotifications.ts` — 목록/unread-count query + read mutation(낙관적 업데이트)
- [x] `app/notifications/index.tsx` — 인박스 화면 (타입별 아이콘, 읽음 구분, 딥링크, EmptyState)
- [x] `app/(main)/(0-home)/index.tsx` — notificationCount={0} 하드코딩 3곳 → unread-count 훅
- [x] 백엔드 `/notifications/read-all` 정적 경로 우선순위 수정

#### 18.2 투표 화면 4지선다 업그레이드 (P0)
- [x] `src/components/patterns/VoteCard.tsx` — emoji 지원 + useThemedStyles 다크모드 전환
- [x] `app/poll/[id].tsx` — 투표 분기 재작성: 무작위 4명 + [섞기] + [건너뛰기] (멤버 <5명이면 전원)
- [x] `src/components/patterns/VoteCelebration.tsx` — 투표 완료 하트 버스트 (Alert 제거)
- [x] handleVote console.log/callCountRef 제거

#### 18.3 투표 생성 플로우 연결 (P0)
- [x] `app/create/` 모달 스택 — index(서클/카테고리) → question(질문 선택) → settings(마감시간) → preview(발행)
- [x] 기존 `src/stores/pollCreate.ts` + `src/hooks/useCreatePoll.ts` 재사용
- [x] 진입점: 홈 FAB "+ 새 투표", `app/circle/[id].tsx` "투표 만들기" 버튼

#### 18.4 Alert → Toast 마이그레이션 (P1)
- [x] `src/providers/ToastProvider.tsx` + useToast 훅, 단순 피드백만 교체 (파괴적 확인은 Alert 유지)
  - [x] 전역 ToastProvider/useToast 기반 추가
  - [x] 투표 생성 성공/실패 피드백 전환
  - [x] 나머지 단순 Alert 피드백 전환

#### 18.5 결과 화면 단일화 (P1)
- [x] `src/components/results/ResultsView.tsx` 공용 추출, `results/[id]` 정본화, poll/[id]는 결과 시 redirect

#### 18.6 다크모드/버그 수정 (P1)
- [x] EmptyState/PollEmptyState/HomeEmptyState/CircleCard/VoteCard — 테마 전환
  - [x] EmptyState/PollEmptyState/CircleCard/VoteCard 테마 전환
  - [x] HomeEmptyState 줄바꿈 문자열 수정
- [x] `(1-circle)/index.tsx` 리터럴 `\n` 버그, `src/utils/logger.ts` + console.* 치환

#### 18.7 홈 서클 스위처 + 고아 컴포넌트 정리 (P2)
- [x] 서클 선택 바텀시트, 고아 컴포넌트 채택/삭제

#### 18.7A 통합 투표 세션 UX 1차 (P0)
> 참고 문서: `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md`, `trd/08-frontend-implementation-spec.md`
> 범위: Stage 1 프론트 전용. 서버 세션/쿨다운/후보 역가중은 18.9에서 처리.
- [x] `src/utils/voteSession.ts` — active poll 기반 세션 큐(최대 12, Circle 라운드로빈, optional circleId)
- [x] `app/vote-session/index.tsx` — 통합 투표 세션 화면(진행률, Circle명, 자동 제출, 스킵/섞기, 완료 화면)
- [x] `app/(main)/(0-home)/index.tsx` — 홈 상단 primary CTA를 통합 세션 시작/이어하기로 변경
- [x] `app/circle/[id].tsx` — 해당 Circle만 도는 투표 세션 CTA 추가
- [x] 각 투표 세션 상단에 Circle명을 명확히 표시하고 후보는 해당 Circle 멤버로 제한
- [x] 세션 큐 유틸 단위 테스트 추가

#### 18.7B 로컬 UX 테스트 더미 데이터 (P0)
> 참고 문서: `trd/07-development-deployment-setup.md`, `trd/08-frontend-implementation-spec.md`, `prd/design/04-user-flow.md`
- [x] `backend/scripts/seed_data.py` — mock user 포함 Circle 5개 생성
- [x] 각 Circle별 mock user + 더미 멤버 10명 구성
- [x] 각 Circle별 active 질문 5개 생성
- [x] 시드 스크립트 멱등성 유지

#### 18.7C 투표 세션 전환 애니메이션 (P1)
> 참고 문서: `prd/design/03-animations.md`, `prd/design/04-user-flow.md`
- [x] 투표 완료 후 다음 질문 카드로 넘어갈 때 slide/fade 전환 추가
- [x] 스킵으로 다음 질문 이동 시에도 같은 전환 적용

#### 18.7D 투표 세션 완료 오버레이 제거 (P1)
> 참고 문서: `prd/design/04-user-flow.md`, Gas 투표 세션 레퍼런스
- [x] `app/vote-session/index.tsx` — 투표 성공 후 완료 멘트 없이 즉시 다음 질문으로 전환

### Stage 2 — Gas/Skrr 핵심 메커니즘 (프론트+백엔드)

> 상세 설계는 계획 파일 참조. DSL.md 갱신 필수, 모듈 간 호출은 service 인터페이스 경유.

- [x] **18.8 칭찬 인박스/받은 하트 1급 화면화** (P0) — `GET /polls/me/received` + 무료 힌트(서클명/시간), 인박스 탭 신설(4탭 재편)
  - [x] `prd/design/04-user-flow.md` — 받은 하트/칭찬함을 Profile 하위가 아닌 핵심 진입점으로 명시
  - [x] `prd/design/05-complete-ui-specification.md` — unread badge, 받은 하트 리스트, 상세 화면 UI 추가
  - [x] `docs/DSL.md` — 받은 선택/칭찬 조회 API와 읽음 상태 계약 추가
  - [x] `backend/app/modules/polls/` — `GET /api/v1/polls/me/received` 집계 API 추가
  - [x] `frontend/app/(main)/(1-inbox)/` — 받은하트 탭 화면 추가 및 결과 상세 연결
  - [x] 받은 하트 읽음 상태 저장/mark-as-read 계약 구현
- [x] **18.9 연속 투표 세션 + 후보 공정성** (P0) — vote_sessions 테이블, 세션 큐(최대 12), 득표 역가중 후보 샘플링, 서버 섞기/스킵
  - [x] `prd/design/04-user-flow.md` — 후보 부족 시 투표 UI 대신 초대 우선 화면을 핵심 플로우에 명시
  - [x] `prd/design/05-complete-ui-specification.md` — 멤버 부족/후보 부족 Empty State와 초대 CTA UI 추가
  - [x] `docs/DSL.md` — 후보 생성 불가 상태, shuffle 서버 계약, 후보 공정성 기준 추가
  - [x] `backend/app/modules/polls/` — `GET /api/v1/polls/{id}/candidates?shuffle` 후보 API 추가
  - [x] 후보 API에서 같은 Circle, 투표자/생성자 제외, 받은 득표 수 적은 순 정렬 적용
  - [x] `frontend/app/vote-session/index.tsx` — 클라이언트 멤버 샘플링 제거, 서버 후보 API와 후보 부족 초대 CTA 연결
  - [x] `vote_sessions` 테이블/서버 세션 큐(최대 12) 계약 구현
  - [x] 서버 스킵 이벤트/세션 진행 상태 저장 구현
  - [x] `frontend/app/vote-session/index.tsx` — 서버 세션 시작/스킵/투표 완료 advance API를 실제 화면 진행 상태에 연결
- [x] **18.10 쿨다운 + 초대 스킵 바이럴 루프** (P1) — users.next_session_at, 신규 가입 서버 검증 후 쿨다운 해제
  - [x] `prd/design/04-user-flow.md` — 라운드 완료 후 cooldown, 초대 CTA, 알림 권한 CTA 흐름 추가
  - [x] `prd/design/05-complete-ui-specification.md` — 세션 완료/cooldown 화면과 초대/알림 버튼 상태 추가
  - [x] `docs/DSL.md` — next_session_at, cooldown 해제 조건, 초대 성공 검증 이벤트 추가
- [x] **18.11 Orb Mode 안전 힌트 티어 시스템** (P1) — vote_hints 테이블, 무료(CIRCLE/TIME)→INITIAL→FULL(Orb Mode)
  - [x] `docs/DSL.md` — 레거시 모드 표기를 Circly 공식 용어 `Orb Mode`로 정리
  - [x] `prd/features/05-orb-mode-implementation.md` — “실명 공개” 대신 안전한 힌트/단계적 공개 정책으로 재정의
  - [x] `prd/business/01-business-model.md` — 레거시 변수명/문구를 Orb Mode 기준으로 정리하고 미성년자 안전 문구 추가
- [x] **18.12 질문 카테고리 안전 필터** (P0) — 외모/호감/크러시 질문은 핵심 카테고리로 유지하되, 비하/상처/부정 비교형 질문 금지
  - [x] `prd/design/04-user-flow.md` — Create 카테고리에 긍정형 외모/호감/크러시 질문 노출 정책 명시
  - [x] `prd/features/01-voting-spec.md` — 허용 예시(`잘생긴 사람은?`, `우리 Circle 대표 고양이상은?`)와 금지 예시(`못생긴 사람은?`) 기준 추가
  - [x] `prd/features/01-voting-spec.md` — 투표 생성 시 후보 제한 필터(성별 등 선택 입력한 프로필 속성 기반) 정책 추가
  - [x] `docs/DSL.md` — User/Profile에 선택형 개인정보 필드, 공개 범위, 후보 필터 사용 가능 여부 메타데이터 검토
  - [x] `prd/design/04-user-flow.md` — 온보딩/프로필 편집에서 성별 등 민감할 수 있는 정보는 선택 입력, 비공개, 나중에 변경 가능하도록 명시
  - [x] `docs/DSL.md` — PollTemplate safety_category/review_status 등 템플릿 안전 메타데이터 검토
- [x] **18.13 코인/스트릭** (P2, 선택) — 투표 1회당 코인 적립, 일간 연속 참여 streak, 프로필 보상 표시
  - [x] `docs/DSL.md` — User 응답에 `coin_balance`, `streak_days` 추가
  - [x] `backend/app/modules/auth/repository.py` — `apply_vote_reward()`로 코인/스트릭 갱신
  - [x] `backend/app/modules/polls/service.py` — vote 성공 시 보상 적용
  - [x] `backend/migrations/versions/c0d1e2f3a4b5_add_coin_balance_and_streak_to_users.py` — users 보상 컬럼 추가
  - [x] `frontend/src/components/profile/ProfileInfo.tsx` — 프로필 보상 카드 노출
  - [x] `frontend/src/hooks/usePolls.ts` — vote 성공 후 auth me 캐시 갱신
  - [x] `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md` — 보상 UI/흐름 반영
- [x] **18.14 성별/나이 선택 프로필** (P2 — 선택값 비공개, 후보 필터 전용, 생성자/친구에게 미공개)
- [x] **18.15 Gas식 화면 구성 PRD 정렬** (P0)
  - [x] `prd/00-prd.md` — 4탭 구조(Home Play Lobby/받은하트/Circle/Profile), 받은하트 1급 화면, 후보 부족 초대 우선, Orb 안전 힌트 반영
  - [x] `prd/design/01-ux-guide.md` — Flame/성별 힌트/생성 탭 중심 표현 제거, Home Play Lobby와 받은하트 보상 루프 추가
  - [x] `prd/business/03-safety-moderation.md` — 외모/호감/크러시 질문을 긍정형 핵심 카테고리로 정리
- [x] **18.16 Home Play Lobby 정리** (P0)
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 답할 투표가 없을 때 Create 대신 받은하트/초대 CTA로 전환
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 일반 사용자용 플로팅 `+ 새 투표` CTA 제거
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 진행 중 Empty State를 투표 생성이 아닌 친구 초대 중심으로 변경
- [x] **18.17 일반 사용자 Create 진입점 제거/축소** (P0)
  - [x] `frontend/app/circle/[id].tsx` — Circle 상세의 일반 사용자 투표 생성 CTA 제거
  - [x] `frontend/app/create/index.tsx` — 직접 접근 시 관리자/운영 템플릿 전용 안내 화면으로 제한
- [x] **18.18 Home 상태별 CTA 정리** (P0)
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 세션 가능 상태는 `투표 시작` CTA 유지
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 쿨다운 상태는 알림 켜기/친구 초대 CTA 우선 노출
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 답할 질문 없음 상태는 받은하트/친구 초대 CTA로 정리
- [x] **18.19 받은하트 탭 보상감 강화** (P0)
  - [x] `frontend/app/(main)/_layout.tsx` — 받은하트 탭 unread badge 연결
  - [x] `frontend/app/(main)/(1-inbox)/index.tsx` — 새 하트/오늘/전체 요약 카드 강화
  - [x] `frontend/app/(main)/(1-inbox)/index.tsx` — Orb 안전 힌트 CTA를 받은하트 맥락에 배치
- [x] **18.20 Orb Mode 문구/화면 안전 힌트 기준 정리** (P0)
  - [x] `frontend/src/components/results/ResultsView.tsx` — 결과 화면 Orb CTA를 공개형 문구에서 안전 힌트 문구로 변경
  - [x] `frontend/app/results/[id]/hints.tsx` — 힌트 화면 헤더/티어 라벨을 안전 힌트 기준으로 변경
  - [x] `frontend/app/subscription/index.tsx` — 구독 혜택 문구를 실명/투표자 공개가 아닌 단계형 힌트로 변경
- [x] **18.21 Orb Mode 내부 reveal/voters 명명 정리** (P1)
  - [x] `frontend/app/results/[id]/voters.tsx` → `hints.tsx` 라우트명 변경
  - [x] `frontend/src/api/poll.ts`, `frontend/src/hooks/usePolls.ts`, `frontend/src/types/poll.ts` — 미사용 투표자 공개 API 래퍼/타입 제거
  - [x] `frontend/app/results/[id].tsx` — Orb 진입 라우트를 힌트 화면으로 변경
- [x] **18.23 legacy 문서/todo 정리** (P1)
  - [x] `todo.md` — Orb Mode 작업/E2E 문구를 투표자 공개에서 안전 힌트 기준으로 정리
  - [x] `prd/features/05-orb-mode-implementation.md` — 현재 구현 상태와 검증 시나리오를 hints 라우트 기준으로 정리
  - [x] `prd/business/01-business-model.md`, `docs/DSL.md` — 수익화/보안 문구를 받은 하트 안전 힌트 기준으로 정리
  - [x] 후속: 백엔드 실제 `/voters` endpoint/service/test 명명은 API 호환성 검토 후 안전 힌트 기준으로 정리
- [x] **18.24 홈 CTA 다이어트 — Gas식 단일 CTA 홈** (P0)
  > 참고 문서: `prd/research/gas-app-analysis.md` (S09 홈 상태 머신, S13 쿨다운, "각 화면이 하나의 행동만 요구한다"), `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md`
  > 배경: 기존 홈은 탭 가능 영역 8종+(벨/프로필/스코프/세션 카드/탭 2개/참여/카드 피드). 상태별 단일 CTA 화면으로 재구성.
  - [x] `app/(main)/(0-home)/index.tsx` — 홈을 상태 머신으로 재구성 (no-circle/ready/cooldown/empty, 상태별 주 CTA 1개 + 보조 1개)
  - [x] 홈에서 PollCard 피드/진행 중·완료됨 탭/PagerView 제거, 대기 질문은 미리보기 한 줄로 대체
  - [x] 홈에서 CircleScopeSelector/CircleSwitcherSheet 제거 (Circle별 세션은 Circle 탭 → `circle/[id]` CTA가 담당)
  - [x] 홈 헤더 단순화: 알림 벨/프로필 아이콘 제거, 워드마크만 표시 (`HomeHeader`/`HomeEmptyState` 삭제)
  - [x] `app/(main)/(1-inbox)/index.tsx` — 알림 진입점 통합(벨+배지) 및 지난 투표 결과 섹션 추가 (완료됨 탭 대체)
  - [x] TypeScript/lint/jest 검증 (0 errors, 16 tests passed)
  - [ ] 실기기/시뮬레이터 QA: 4개 홈 상태 전환, 받은하트 알림 벨/지난 결과 동작 확인
  - [ ] 후속 검토: 미사용 `PollCard` 패턴 컴포넌트 정리 여부 결정
- [x] **18.25 서브 탭 다이어트 — 받은하트/Circle/Profile** (P0~P2)
  > 참고 문서: `prd/research/gas-app-analysis.md` (S15 Inbox 미니멀 원칙, S18 맥락 기반 페이월, S20 Profile 허브), `prd/design/05-complete-ui-specification.md`
  - [x] (P0) `app/(main)/(1-inbox)/index.tsx` — 요약 카드+메트릭 그리드를 요약 1줄로 축소, Orb 힌트 배너 제거 (페이월 진입은 결과 상세 유지)
  - [x] (P2) `app/(main)/(1-circle)/index.tsx` — Circle 카드의 초대 코드 상시 노출 제거 (공유는 상세 화면 담당)
  - [x] (P2) `app/(main)/(2-profile)/index.tsx` — Orb Mode 상태/진입 row 추가, 로컬 Toast를 전역 ToastProvider로 통일
  - [x] TypeScript/lint/jest 검증 (0 errors, 16 tests passed)
  - [ ] 실기기/시뮬레이터 QA: 받은하트 요약 1줄, Circle 카드, Profile Orb row/Toast 확인 (18.24 QA와 함께)
- [x] **18.26 받은하트 기획 의도 복원 — 순수 보상 인박스** (P0)
  > 참고 문서: `prd/design/04-user-flow.md` (받은 하트 플로우: 요약 + 하트 리스트만), `prd/research/gas-app-analysis.md` (F03: 결과 아카이브 없음, Inbox는 수신 보상 전용)
  > 배경: 18.24에서 홈의 완료됨 탭을 받은하트로 옮겼으나, "지난 투표 결과"는 보상이 아닌 Circle 관리 정보라 탭 의도를 흐림.
  - [x] `app/(main)/(1-inbox)/index.tsx` — "지난 투표 결과" 섹션 제거 (기획서 화면 구성과 일치: 요약 1줄 + 하트 리스트)
  - [x] `app/circle/[id].tsx` — "지난 투표" 섹션 추가 (`useMyCompletedPolls`를 circle_id로 필터, `/results/[id]` 연결)
  - [x] TypeScript/lint/jest 검증 (0 errors, 16 tests passed)
- [x] **18.27 탭바 슬라이딩 인디케이터** (P1)
  > 참고 문서: `prd/design/03-animations.md` (spring 프리셋), `src/theme/animations.ts` (`springConfigs`)
  - [x] `src/components/navigation/FloatingTabBar.tsx` — 탭별 정적 원형 강조를 단일 인디케이터로 교체, 탭 전환 시 spring 슬라이드 (`springConfigs.stiff`)
  - [x] TypeScript/lint/jest 검증 (0 errors, 16 tests passed)
  - [ ] 실기기 QA: 탭 전환 슬라이드 확인 (18.24 QA와 함께)
- [x] **18.22 실제 기기/Expo UX 검증** (P0)
  - [x] `frontend` 타입체크로 라우트/타입 안전성 확인
  - [x] Home 상태별 CTA 정적 검증: 투표 시작/쿨다운/받은하트/초대
  - [x] `frontend/app/(main)/(0-home)/index.tsx` — 서버 session availability 기준으로 투표 시작 CTA 우선 판단하도록 보정
  - [x] 받은하트 탭 badge 및 `/results/[id]/hints` 라우트 정적 검증
  - [x] `/create` 직접 접근 제한 화면 정적 검증
  - [x] 로컬 mock auth 및 핵심 API smoke 확인: dev-login, 받은하트, 세션 availability, 알림 unread count
  - [x] Expo 개발 서버 실행 준비 확인: LAN API URL 갱신 및 Metro 8081 응답 확인
- [x] **18.28 설정 허브 UX 및 저장 안정성 정리** (P1)
  > 참고 문서: `prd/design/04-user-flow.md` (Profile 설정/알림 플로우), `prd/features/03-push-notification.md` (알림 설정 및 개인화), `prd/design/02-ui-design-system.md` (다크 모드/접근성)
  - [x] `app/(main)/(2-profile)/settings.tsx` — Profile 편집 직접 진입, 알림 설정 진입, 오류 피드백 및 접근성 보완
  - [x] `app/(main)/(2-profile)/index.tsx` — 중복 다크 모드/로그아웃 제거 후 설정 허브 진입점 통합
  - [x] `app/(main)/(2-profile)/notifications.tsx` — 저장 중 중복 변경 방지, 전체 토글 실패 원복/오류 처리
  - [x] 존재하지 않는 Circle별 알림 설정 안내 제거
  - [x] TypeScript/lint/jest/iOS export 검증
- [x] **18.29 Profile 선택 보상 UI 제외** (P2)
  > 참고 문서: `prd/design/04-user-flow.md`, `prd/design/05-complete-ui-specification.md`, `todo.md#1813-코인스트릭`
  - [x] `src/components/profile/ProfileInfo.tsx` — 사용처가 없는 코인/스트릭 타일 제거
  - [x] 사용자 플로우/UI 명세에서 활동 보상 영역 제거 (백엔드 적립 데이터는 유지)
  - [x] TypeScript/lint/jest 검증
- [x] **18.30 Profile 정보 카드 다크 모드 보정** (P1)
  > 참고 문서: `prd/design/02-ui-design-system.md#Dark-Theme`, `frontend/src/theme/tokens.ts`
  - [x] `src/components/profile/ProfileInfo.tsx` — 카드/텍스트/이모지/편집 버튼을 테마 토큰으로 전환
  - [x] TypeScript/lint/jest 검증
