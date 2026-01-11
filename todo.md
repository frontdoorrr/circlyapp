# Circly Development Todo

> TDD 기반 백엔드 개발 진행 순서
> 각 작업 완료 후 테스트 실행 및 `/commit` 커맨드로 커밋
> 각 작업 완료 후, 작업에 완료 표시 [x]

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
  - [x] `app/(main)/(profile)/` - 프로필 탭
- [x] `app/_layout.tsx` - Root layout with theme provider
- [x] `app/(auth)/_layout.tsx` - Auth layout
- [x] `app/(main)/_layout.tsx` - Main layout with tabs
- [x] `app/(main)/(home)/_layout.tsx` - Home tab layout
- [x] `app/(main)/(create)/_layout.tsx` - Create poll tab layout
- [x] `app/(main)/(profile)/_layout.tsx` - Profile tab layout
- [ ] **테스트**: `npx expo start` 실행 확인
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
- [ ] Storybook 설정 (선택적)
- [ ] 컴포넌트 사용 가이드 작성
- [ ] **커밋**: `docs(frontend): add component documentation`

### 11.8 Responsive Testing (P2)
- [ ] 다양한 화면 크기 테스트
- [ ] Safe Area 처리 확인
- [ ] 가로 모드 지원 (선택적)
- [ ] **커밋**: `test(frontend): verify responsive design`

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
- [ ] **커밋**: `feat(frontend): implement Create Tab main screen`

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
- [ ] **테스트**: 전체 투표 생성 플로우 테스트
- [ ] **커밋**: `feat(frontend): add Create Tab state management and API integration`

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
- [ ] **커밋**: `feat(frontend): add PollCard component with active/completed variants`

#### 11.11.3 Empty State 컴포넌트 (P1)
- [x] Empty State variants 구현
- [ ] **커밋**: `feat(frontend): add Home Tab empty states`

#### 11.11.4 남은 시간 계산 유틸리티 (P0)
- [x] `src/utils/timeUtils.ts` - 시간 계산 함수
- [ ] **테스트**: 다양한 시간 케이스 단위 테스트
- [ ] **커밋**: `feat(frontend): add time formatting utilities`

#### 11.11.5 투표 목록 API 연동 (P0)
- [x] `src/hooks/usePolls.ts` 확장
- [ ] **테스트**: API 응답 확인 및 React Query 캐싱 동작 테스트
- [ ] **커밋**: `feat(frontend): add poll list API integration`

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
- [ ] `npx expo start` 실행하여 Unmatched Route 에러 해결 확인
- [x] **커밋**: `fix(frontend): resolve unmatched route errors and add profile sub-screens`

---

## 고도화 작업 (TODO)

- [ ] **Supabase Auth**: anon key → Publishable key로 변경 (보안 강화)

---

## Phase 13: Orb Mode 수익화 구현

> **핵심 기능**: 유료 구독자(Orb Mode)가 "누가 나를 선택했는지" 볼 수 있는 기능
> **참고 문서**: `docs/DSL.md` (votes 테이블, 보안 정책), `prd/business/01-business-model.md`

### 13.1 Backend: Vote 모델 수정 (P0)
- [x] `app/modules/polls/models.py` - Vote 모델에 `voter_id` 컬럼 추가
- [x] `app/modules/auth/models.py` - User 모델에 `votes_cast` relationship 추가
- [x] 마이그레이션 생성 및 적용
- [x] `app/modules/polls/service.py` - `vote()` 함수에서 `voter_id` 저장하도록 수정
- [ ] **커밋**: `feat(polls): add voter_id column for Orb Mode feature`

### 13.2 Backend: Orb Mode API 추가 (P1)
- [x] `app/modules/polls/schemas.py` - `VoterInfo`, `VoterRevealResponse` 스키마 추가
- [x] `app/modules/polls/router.py` - Orb Mode 전용 엔드포인트 추가 (GET /{poll_id}/voters)
- [x] `app/modules/polls/service.py` - `get_voters_for_user()` 함수 구현
- [x] `app/modules/polls/repository.py` - `find_voters_for_user()` 쿼리 추가
- [x] `app/modules/auth/models.py` - `is_orb_mode` 필드 추가
- [x] **커밋**: `feat: add Orb Mode feature for voter reveal`

### 13.3 RevenueCat 연동 (P2)
- [ ] RevenueCat SDK 설치 및 설정
- [ ] Orb Mode 구독 상태 확인 미들웨어/의존성 추가
- [ ] 구독 상태에 따른 API 접근 제어
- [ ] **커밋**: `feat(subscription): integrate RevenueCat for Orb Mode`

### 13.4 Frontend: Orb Mode UI (P2)
- [x] `frontend/src/types/poll.ts` - `VoterInfo`, `VoterRevealResponse` 타입 추가
- [x] `frontend/src/types/auth.ts` - `is_orb_mode` 필드 추가
- [x] `frontend/src/api/poll.ts` - `getMyVoters()` API 함수 추가
- [x] `frontend/src/hooks/usePolls.ts` - `useMyVoters()` 훅 추가
- [x] `frontend/app/results/[id].tsx` - "누가 선택했는지 보기" 버튼 추가
- [x] `frontend/app/poll/[id].tsx` - "누가 선택했는지 보기" 버튼 추가
- [x] `frontend/app/results/[id]/voters.tsx` - 투표자 공개 화면 구현
- [x] `useCurrentUser` 훅으로 `is_orb_mode` 조회 방식 개선
- [ ] Orb Mode 페이월/구독 화면 구현 (RevenueCat 연동 시)
- [ ] RevenueCat SDK 연동 (Expo)

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
- [x] **14.5** `useAuth.ts:168,177` - 회원탈퇴 API 구현 ✅ (프로필→설정 경로 추가)
- [ ] **14.6** `_layout.tsx:74` - 딥링크 unique_id → invite_code 변환 API
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
- [ ] 테스트 코드 작성

### 15.3 Backend - Celery 스케줄링 설정

> **참고**: `prd/features/03-push-notification.md#10.5.2 Background Tasks`

- [ ] `backend/app/core/celery.py` - Celery 설정
- [ ] `backend/app/tasks/__init__.py` - Task 모듈 생성
- [ ] `backend/app/tasks/notification_tasks.py` - 알림 스케줄 태스크
  - [ ] `schedule_poll_deadline_notifications()` - 마감 알림 스케줄링
  - [ ] `send_poll_deadline_notification_1h()` - 1시간 전 알림
  - [ ] `send_poll_deadline_notification_10m()` - 10분 전 알림
  - [ ] `send_poll_result_notification()` - 결과 발표 알림
- [ ] `docker-compose.yml` - Celery worker, beat 추가

### 15.4 Backend - 이벤트 연동

> **참고**: `prd/features/03-push-notification.md#10.3 알림 유형별 구현 명세`

- [ ] `backend/app/modules/polls/service.py` - 투표 생성 시 알림 트리거
  - [ ] `create_poll()` → `notification_service.send_poll_started()` 호출
  - [ ] `create_poll()` → 마감 알림 스케줄링 호출
- [ ] `backend/app/modules/polls/service.py` - 투표 마감 처리 시 결과 알림
  - [ ] 투표 마감 로직에서 `send_poll_ended()` 호출

### 15.5 Frontend - 푸시 토큰 자동 등록 ✅

> **참고**: `prd/features/03-push-notification.md#10.4 Frontend 구현 명세`

- [x] `frontend/src/services/notification/pushNotification.ts:51` - projectId 수정 (Constants에서 가져오기)
- [x] `frontend/src/providers/AppInitializer.tsx` - 앱 시작 시 푸시 토큰 등록 로직 추가
  - [x] 로그인 상태일 때 `registerForPushNotificationsAsync()` 호출
  - [x] 토큰 획득 후 `registerPushToken()` API 호출
- [ ] `frontend/src/stores/auth.ts` - 로그아웃 시 `unregisterPushToken()` 호출

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

## Phase 16: 프로필 및 설정 기능 완성

> **점검일**: 2025-01-11

### 16.1 프로필 편집 기능 (P0) ✅

> **참고**: `prd/design/04-user-flow.md`

- [x] `frontend/src/components/profile/ProfileEditModal.tsx` - 프로필 편집 모달 검증
  - [x] 닉네임(display_name) 수정 기능
  - [x] 프로필 이모지 선택 기능 (32개 옵션)
  - [x] username 수정 기능 (선택적)
  - [x] 검증 규칙 통일 (username min 2자, display_name max 100자)
  - [x] 필드별 인라인 에러 메시지
- [x] `frontend/app/(main)/(2-profile)/index.tsx` - 편집 모달 연동 확인
- [x] 백엔드 `PUT /auth/me` API 연동 확인
- [x] Toast 알림 시스템 추가 (Alert → Toast)
- [x] **커밋**: `feat(profile): 프로필 편집 UX 전면 개선`

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
  - [x] 프로필 탭
  - [x] 설정 화면
- [ ] **테스트**: 라이트/다크 전환 시 모든 UI 정상 표시 확인

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
- [ ] **테스트**: 각 링크 정상 동작 확인
