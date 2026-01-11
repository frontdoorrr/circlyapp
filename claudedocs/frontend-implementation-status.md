# Circly 프론트엔드 구현 현황

> **작성일**: 2024-12-28
> **구현 범위**: 핵심 인프라 및 인증 플로우

---

## ✅ 완료된 구현

### 1. 프로젝트 기반 설정

#### 의존성 설치
```bash
npm install axios @tanstack/react-query zustand
```

**설치된 패키지**:
- `axios`: HTTP 클라이언트
- `@tanstack/react-query`: 서버 상태 관리
- `zustand`: 클라이언트 상태 관리 (인증)

---

### 2. TypeScript 타입 정의

**참조 문서**: `docs/DSL.md`

#### 구현 파일:
- `src/types/auth.ts` - Auth 모듈 타입
- `src/types/circle.ts` - Circle 모듈 타입
- `src/types/poll.ts` - Poll 모듈 타입
- `src/types/api.ts` - 공통 API 응답 타입

**주요 타입**:
```typescript
// Auth
- UserResponse
- AuthResponse
- LoginRequest
- UserCreate
- UserUpdate

// Circle
- CircleResponse
- CircleDetail
- MemberInfo
- JoinByCodeRequest

// Poll
- PollResponse
- PollTemplateResponse
- PollCreate
- VoteRequest
- PollDetailResponse
```

---

### 3. API 클라이언트 구현

#### `src/api/client.ts`
- Axios 인스턴스 생성
- 환경 변수 기반 API URL 설정
- Request 인터셉터: 자동 토큰 추가
- Response 인터셉터: 에러 처리, 401 자동 로그아웃

#### API 모듈:
- `src/api/auth.ts` - 인증 API
- `src/api/circle.ts` - Circle API
- `src/api/poll.ts` - Poll API

**API 함수**:
```typescript
// Auth
- register(data: UserCreate)
- login(data: LoginRequest)
- getCurrentUser()
- updateProfile(data: UserUpdate)

// Circle
- createCircle(data: CircleCreate)
- getMyCircles()
- getCircleDetail(circleId)
- joinCircleByCode(data: JoinByCodeRequest)
- leaveCircle(circleId)
- getCircleMembers(circleId)
- regenerateInviteCode(circleId)

// Poll
- getPollTemplates(category?)
- createPoll(circleId, data)
- getActivePolls(circleId)
- getPollDetail(pollId)
- vote(pollId, data)
```

---

### 4. 상태 관리

#### Zustand Store: `src/stores/auth.ts`
- 인증 상태 전역 관리
- AsyncStorage 기반 영구 저장
- 토큰 및 사용자 정보 자동 로드

**주요 기능**:
```typescript
- setAuth(user, token)      // 로그인 성공 시
- logout()                   // 로그아웃
- loadAuthFromStorage()      // 앱 시작 시 로드
- updateUser(user)           // 프로필 업데이트
```

---

### 5. React Query Hooks

#### `src/hooks/useAuth.ts`
```typescript
- useRegister()      // 회원가입
- useLogin()         // 로그인
- useLogout()        // 로그아웃
- useCurrentUser()   // 현재 사용자 조회
- useUpdateProfile() // 프로필 수정
```

#### `src/hooks/useCircles.ts`
```typescript
- useMyCircles()              // 내 Circle 목록
- useCircleDetail(circleId)   // Circle 상세
- useCreateCircle()           // Circle 생성
- useJoinCircle()             // Circle 참여
- useLeaveCircle()            // Circle 나가기
- useCircleMembers(circleId)  // 멤버 목록
- useRegenerateInviteCode()   // 초대코드 재생성
```

#### `src/hooks/usePolls.ts`
```typescript
- usePollTemplates(category?)  // 템플릿 목록
- useActivePolls(circleId)     // 진행 중 투표
- usePollDetail(pollId)        // 투표 상세
- useCreatePoll()              // 투표 생성
- useVote()                    // 투표하기
```

---

### 6. Provider 설정

#### `src/providers/QueryProvider.tsx`
- React Query 전역 설정
- 자동 재시도, 캐싱 정책 구성

#### `src/providers/AppInitializer.tsx`
- 앱 시작 시 인증 정보 로드
- 로딩 화면 표시

#### Root Layout 업데이트: `app/_layout.tsx`
```tsx
<QueryProvider>
  <ThemeProvider>
    <AppInitializer>
      <ThemedApp />
    </AppInitializer>
  </ThemeProvider>
</QueryProvider>
```

---

### 7. 인증 화면 구현

#### `app/(auth)/login.tsx`
- 이메일/비밀번호 입력
- 로딩 상태 처리
- 에러 핸들링
- 회원가입 화면 이동

#### `app/(auth)/register.tsx`
- 회원가입 폼 (이메일, 비밀번호, 사용자명, 표시명)
- 비밀번호 확인 검증
- 회원가입 성공 시 자동 로그인
- 로그인 화면 이동

---

## 🔄 작동 흐름

### 1. 앱 시작
```
RootLayout
└─ QueryProvider
   └─ ThemeProvider
      └─ AppInitializer
         ├─ loadAuthFromStorage()  // 저장된 토큰 로드
         └─ ThemedApp (로그인 상태에 따라 화면 분기)
```

### 2. 로그인 플로우
```
LoginScreen
└─ useLogin() mutation
   ├─ POST /api/v1/auth/login
   ├─ Response: { user, access_token }
   ├─ setAuth(user, token)  // Zustand store 업데이트
   ├─ AsyncStorage.setItem()  // 영구 저장
   └─ router.replace('/(main)/(home)')
```

### 3. API 요청 플로우
```
Component
└─ useQuery / useMutation hook
   └─ API 함수 (auth.ts, circle.ts, poll.ts)
      └─ apiClient (axios)
         ├─ Request 인터셉터: 자동 토큰 추가
         ├─ API 호출
         └─ Response 인터셉터: 에러 처리
```

### 4. 인증 유지 플로우
```
App 재시작
└─ AppInitializer
   └─ loadAuthFromStorage()
      ├─ AsyncStorage.getItem(TOKEN_KEY)
      ├─ AsyncStorage.getItem(USER_KEY)
      └─ setAuth(user, token)
         └─ 로그인 상태 복원 완료
```

---

## 📋 다음 구현 단계

### 1. 메인 화면 구현 (우선순위: 높음)

#### `app/(main)/(home)/index.tsx`
- [ ] 내 Circle 목록 표시 (`useMyCircles`)
- [ ] Circle 카드 컴포넌트
- [ ] Circle 참여 버튼 (초대 코드 입력)
- [ ] Circle 생성 버튼
- [ ] 빈 상태 (Empty State)

#### `app/(main)/(create)/index.tsx`
- [ ] 투표 템플릿 선택 (`usePollTemplates`)
- [ ] 카테고리별 필터
- [ ] 투표 생성 폼
  - [ ] Circle 선택
  - [ ] 템플릿 선택
  - [ ] 마감 시간 선택 (1H/3H/6H/24H)
- [ ] 투표 생성 성공 시 Home으로 이동

#### `app/(main)/(profile)/index.tsx`
- [ ] 사용자 정보 표시 (`useCurrentUser`)
- [ ] 프로필 수정 (`useUpdateProfile`)
- [ ] 로그아웃 버튼 (`useLogout`)

### 2. Circle 상세 화면

#### `app/circle/[id].tsx`
- [ ] Circle 정보 표시 (`useCircleDetail`)
- [ ] 멤버 목록 (`useCircleMembers`)
- [ ] 초대 코드 표시/복사
- [ ] 초대 코드 재생성 버튼
- [ ] Circle 나가기 버튼

### 3. Poll 관련 화면

#### `app/poll/[id].tsx`
- [ ] 투표 상세 정보 (`usePollDetail`)
- [ ] 투표하기 화면
  - [ ] Circle 멤버 목록 표시
  - [ ] 멤버 선택 (한 명)
  - [ ] 투표 제출 (`useVote`)
- [ ] 투표 결과 화면
  - [ ] 순위 표시
  - [ ] 득표율 표시
  - [ ] 결과 카드 공유 버튼

### 4. 공유 기능

#### Result Card 생성 및 공유
- [ ] `src/components/ResultCard.tsx` 컴포넌트
- [ ] 1080x1920px 캔버스 생성
- [ ] 결과 데이터 시각화
- [ ] 이미지 저장 (Expo FileSystem)
- [ ] SNS 공유 (Expo Sharing)

### 5. 푸시 알림

#### Expo Push Notifications 설정
- [ ] 푸시 토큰 등록 (`expo-notifications`)
- [ ] 푸시 권한 요청
- [ ] 백엔드 토큰 전송
- [ ] 알림 수신 핸들러

---

## 🛠️ 개발 가이드

### 환경 변수 설정

`.env` 파일 생성:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 백엔드 서버 실행

```bash
cd backend
uv run uvicorn app.main:app --reload
```

API 문서: http://localhost:8000/docs

### 프론트엔드 실행

```bash
cd frontend
npx expo start
```

### 타입 체크

```bash
npm run typecheck
```

---

## 🎨 디자인 토큰 사용법

```typescript
import { tokens } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize['4xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
  },
  button: {
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.lg,
  },
});
```

---

## 🔍 테스트 방법

### 1. 회원가입 테스트
1. `/register` 화면에서 이메일/비밀번호 입력
2. 회원가입 버튼 클릭
3. 자동으로 Home 화면으로 이동 확인

### 2. 로그인 테스트
1. `/login` 화면에서 이메일/비밀번호 입력
2. 로그인 버튼 클릭
3. Home 화면으로 이동 확인

### 3. 인증 유지 테스트
1. 로그인 후 앱 종료
2. 앱 재시작
3. 로그인 상태 유지 확인

### 4. 로그아웃 테스트
1. 프로필 화면에서 로그아웃 버튼 클릭
2. 로그인 화면으로 이동 확인
3. 저장된 토큰 삭제 확인

---

## 📚 참고 문서

- **Single Source of Truth**: `docs/DSL.md`
- **프론트엔드 명세**: `trd/08-frontend-implementation-spec.md`
- **UI/UX 가이드**: `prd/design/02-ui-design-system.md`
- **API 명세**: `trd/05-api-specification.md`
- **인증 아키텍처**: `trd/06-authentication-architecture.md`

---

## 🚨 주의사항

1. **API URL 설정 필수**: `.env` 파일에 백엔드 API URL 설정 필요
2. **백엔드 서버 실행**: 프론트엔드 테스트 전 백엔드 서버 실행 필요
3. **타입 일치**: 모든 API 요청/응답은 `docs/DSL.md` 타입과 일치
4. **에러 처리**: API 에러는 `ApiError` 클래스로 통일
5. **토큰 관리**: 토큰은 자동으로 AsyncStorage에 저장되며, API 요청 시 자동 추가

---

## ✨ 구현 완료 항목 요약

- ✅ TypeScript 타입 정의 (auth, circle, poll, api)
- ✅ Axios API 클라이언트 (인터셉터 포함)
- ✅ API 모듈 (auth, circle, poll)
- ✅ Zustand 인증 스토어 (AsyncStorage 통합)
- ✅ React Query 훅 (auth, circles, polls)
- ✅ QueryProvider 설정
- ✅ AppInitializer (인증 정보 로드)
- ✅ 로그인 화면
- ✅ 회원가입 화면
- ✅ Root Layout 통합

**총 구현 파일 수**: 15개
**다음 단계**: 메인 화면 3개 (home, create, profile)
