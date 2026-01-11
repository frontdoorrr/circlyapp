# Circly 프론트엔드 기능 구현 기획서

> **작성일**: 2024-12-28
> **버전**: 1.0.0
> **목적**: React Native (Expo) 기반 프론트엔드 기능 구현 완전 가이드

---

## 📌 Single Source of Truth 참조 체계

### 문서 계층 구조

```
docs/DSL.md (최상위 기준)
    ↓
trd/08-frontend-implementation-spec.md (이 문서)
    ↓
prd/design/* (UI/UX 상세 명세)
    ↓
frontend/src/theme/* (구현 코드)
```

### 참조 우선순위

| 순위 | 문서 | 범위 | 역할 |
|------|------|------|------|
| 1 | `docs/DSL.md` | 시스템 전체 | **데이터 스키마, API 인터페이스, 비즈니스 로직** |
| 2 | `trd/08-frontend-implementation-spec.md` | 프론트엔드 | **기능 구현 가이드, API 연동, 상태 관리** |
| 3 | `prd/design/*.md` | UI/UX | **화면 설계, 디자인 토큰, 애니메이션** |
| 4 | `frontend/src/theme/tokens.ts` | 디자인 시스템 | **실제 구현 코드 (Design Tokens)** |

### 충돌 해결 규칙

**데이터 구조/API** → `docs/DSL.md` 우선
**화면 레이아웃/UI** → `prd/design/*.md` 우선
**구현 상세/로직** → 이 문서 우선

---

## 🎯 구현 목표 및 원칙

### 핵심 원칙

1. **Single Source of Truth**: DSL.md의 스키마/API 정의를 절대 기준으로 삼음
2. **디자인 시스템 우선**: `frontend/src/theme/tokens.ts`를 통해 일관성 유지
3. **타입 안전성**: TypeScript로 모든 데이터 구조 타입 정의
4. **성능 최적화**: 메모이제이션, 가상화, 지연 로딩 적극 활용
5. **접근성 준수**: WCAG 2.1 AA 기준 충족

---

## 📡 백엔드 API 엔드포인트 목록

> **기준 문서**: `docs/DSL.md` → 각 모듈의 `router` 정의
> **백엔드 구현**: `backend/app/modules/*/router.py`

### 1. Auth API (`/api/v1/auth`)

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/register` | 회원가입 | `UserCreate` | `AuthResponse` |
| POST | `/login` | 로그인 | `LoginRequest` | `AuthResponse` |
| GET | `/me` | 현재 사용자 정보 | - | `UserResponse` |
| PUT | `/me` | 프로필 수정 | `UserUpdate` | `UserResponse` |

#### 타입 정의 (TypeScript)

```typescript
// src/types/auth.ts

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string; // UUID
  email: string;
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string; // ISO 8601
}

export interface AuthResponse {
  user: UserResponse;
  access_token: string;
  token_type: string; // "bearer"
}

export interface UserUpdate {
  username?: string;
  display_name?: string;
  profile_emoji?: string;
}
```

---

### 2. Circle API (`/api/v1/circles`)

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/circles` | Circle 생성 | `CircleCreate` | `CircleResponse` |
| GET | `/circles` | 내 Circle 목록 | - | `CircleResponse[]` |
| GET | `/circles/{circle_id}` | Circle 상세 | - | `CircleDetail` |
| POST | `/circles/join/code` | 코드로 참여 | `JoinByCodeRequest` | `CircleResponse` |
| POST | `/circles/{circle_id}/leave` | Circle 나가기 | - | `204 No Content` |
| GET | `/circles/{circle_id}/members` | 멤버 목록 | - | `MemberInfo[]` |
| POST | `/circles/{circle_id}/regenerate-code` | 초대코드 재생성 | - | `RegenerateInviteCodeResponse` |

#### 타입 정의 (TypeScript)

```typescript
// src/types/circle.ts

export interface CircleCreate {
  name: string;
  description?: string;
  max_members?: number; // default: 50
}

export interface CircleResponse {
  id: string; // UUID
  name: string;
  description: string | null;
  invite_code: string; // 6자리
  invite_code_expires_at: string; // ISO 8601
  owner_id: string; // UUID
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CircleDetail extends CircleResponse {
  members: MemberInfo[];
}

export interface MemberInfo {
  user_id: string; // UUID
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  nickname: string; // Circle 내 닉네임
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joined_at: string;
}

export interface JoinByCodeRequest {
  invite_code: string; // 6자리
  nickname: string; // Circle 내 사용할 닉네임
}

export interface RegenerateInviteCodeResponse {
  invite_code: string;
  invite_code_expires_at: string;
}
```

---

### 3. Poll API (`/api/v1/polls`)

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/polls/templates` | 투표 템플릿 목록 | `?category=...` | `PollTemplateResponse[]` |
| POST | `/polls/circles/{circle_id}/polls` | 투표 생성 | `PollCreate` | `PollResponse` |
| POST | `/polls/{poll_id}/vote` | 투표하기 | `VoteRequest` | `VoteResponse` |

#### 타입 정의 (TypeScript)

```typescript
// src/types/poll.ts

export type TemplateCategory = 'APPEARANCE' | 'PERSONALITY' | 'TALENT' | 'SPECIAL';
export type PollStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PollDuration = '1H' | '3H' | '6H' | '24H';

export interface PollTemplateResponse {
  id: string; // UUID
  category: TemplateCategory;
  question_text: string;
  emoji: string | null;
  usage_count: number;
}

export interface PollCreate {
  template_id: string; // UUID
  duration: PollDuration;
  question_text?: string; // 템플릿 텍스트 오버라이드 (선택)
}

export interface PollResponse {
  id: string; // UUID
  circle_id: string;
  template_id: string;
  creator_id: string;
  question_text: string;
  status: PollStatus;
  ends_at: string; // ISO 8601
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface VoteRequest {
  voted_for_id: string; // UUID (투표 대상 사용자)
}

export interface VoteResponse {
  success: boolean;
  poll_id: string;
  voted_at: string;
  message: string;
}
```

---

## 🏗️ 프론트엔드 아키텍처

### 디렉토리 구조

```
frontend/
├── app/                         # Expo Router (파일 기반 라우팅)
│   ├── (auth)/                  # 비인증 화면 그룹
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (main)/                  # 인증 필요 화면 그룹
│   │   ├── (home)/              # Home 탭
│   │   │   ├── index.tsx
│   │   │   └── _layout.tsx
│   │   ├── (create)/            # 투표 생성 탭
│   │   ├── (profile)/           # 프로필 탭
│   │   └── _layout.tsx          # 메인 탭바 레이아웃
│   ├── poll/                    # 투표 관련 화면
│   │   ├── [id].tsx             # 투표 상세 (동적 라우트)
│   │   └── result/[id].tsx      # 결과 화면
│   └── _layout.tsx              # 루트 레이아웃
├── src/
│   ├── api/                     # API 클라이언트
│   │   ├── client.ts            # Axios 인스턴스
│   │   ├── auth.ts              # Auth API 함수
│   │   ├── circle.ts            # Circle API 함수
│   │   ├── poll.ts              # Poll API 함수
│   │   └── interceptors.ts      # 인터셉터 (토큰, 에러)
│   ├── components/              # 컴포넌트
│   │   ├── primitives/          # 기본 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Text.tsx
│   │   ├── patterns/            # 패턴 컴포넌트
│   │   │   ├── VoteCard.tsx
│   │   │   ├── ResultBar.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── screens/             # 화면별 컴포넌트
│   │   │   ├── HomeScreen/
│   │   │   ├── VoteScreen/
│   │   │   └── ResultScreen/
│   │   └── states/              # 상태 컴포넌트
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── Skeleton.tsx
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useAuth.ts           # 인증 훅
│   │   ├── usePolls.ts          # 투표 데이터 훅
│   │   ├── useCircles.ts        # Circle 데이터 훅
│   │   ├── useAnimation.ts      # 애니메이션 훅
│   │   └── useHaptics.ts        # 햅틱 피드백 훅
│   ├── stores/                  # 상태 관리 (Zustand)
│   │   ├── auth.ts              # 인증 스토어
│   │   ├── poll.ts              # 투표 스토어
│   │   └── circle.ts            # Circle 스토어
│   ├── theme/                   # 디자인 시스템
│   │   ├── tokens.ts            # 디자인 토큰 ✅
│   │   ├── animations.ts        # 애니메이션 프리셋 ✅
│   │   ├── ThemeContext.tsx     # 테마 컨텍스트 ✅
│   │   └── index.ts
│   ├── types/                   # TypeScript 타입
│   │   ├── auth.ts
│   │   ├── circle.ts
│   │   ├── poll.ts
│   │   └── common.ts
│   └── utils/                   # 유틸리티
│       ├── date.ts              # 날짜 포맷팅
│       ├── validation.ts        # 입력 검증
│       └── storage.ts           # AsyncStorage 래퍼
└── package.json
```

---

## 🔌 API 연동 가이드

### 1. API 클라이언트 설정

**파일**: `src/api/client.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // 토큰 만료 → 로그아웃 처리
      await AsyncStorage.removeItem('access_token');
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

// 공통 에러 타입
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 공통 응답 타입
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

---

### 2. Auth API 함수

**파일**: `src/api/auth.ts`

```typescript
import { apiClient } from './client';
import type {
  UserCreate,
  LoginRequest,
  AuthResponse,
  UserResponse,
  UserUpdate,
} from '../types/auth';

export const authApi = {
  // 회원가입
  async register(data: UserCreate): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // 로그인
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // 현재 사용자 정보
  async getMe(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data;
  },

  // 프로필 수정
  async updateProfile(data: UserUpdate): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>('/auth/me', data);
    return response.data;
  },
};
```

---

### 3. Circle API 함수

**파일**: `src/api/circle.ts`

```typescript
import { apiClient } from './client';
import type {
  CircleCreate,
  CircleResponse,
  CircleDetail,
  JoinByCodeRequest,
  MemberInfo,
  RegenerateInviteCodeResponse,
} from '../types/circle';

export const circleApi = {
  // Circle 생성
  async createCircle(data: CircleCreate): Promise<CircleResponse> {
    const response = await apiClient.post<CircleResponse>('/circles', data);
    return response.data;
  },

  // 내 Circle 목록
  async getMyCircles(): Promise<CircleResponse[]> {
    const response = await apiClient.get<CircleResponse[]>('/circles');
    return response.data;
  },

  // Circle 상세
  async getCircleDetail(circleId: string): Promise<CircleDetail> {
    const response = await apiClient.get<CircleDetail>(`/circles/${circleId}`);
    return response.data;
  },

  // 코드로 참여
  async joinByCode(data: JoinByCodeRequest): Promise<CircleResponse> {
    const response = await apiClient.post<CircleResponse>('/circles/join/code', data);
    return response.data;
  },

  // Circle 나가기
  async leaveCircle(circleId: string): Promise<void> {
    await apiClient.post(`/circles/${circleId}/leave`);
  },

  // 멤버 목록
  async getMembers(circleId: string): Promise<MemberInfo[]> {
    const response = await apiClient.get<MemberInfo[]>(`/circles/${circleId}/members`);
    return response.data;
  },

  // 초대코드 재생성
  async regenerateInviteCode(circleId: string): Promise<RegenerateInviteCodeResponse> {
    const response = await apiClient.post<RegenerateInviteCodeResponse>(
      `/circles/${circleId}/regenerate-code`
    );
    return response.data;
  },
};
```

---

### 4. Poll API 함수

**파일**: `src/api/poll.ts`

```typescript
import { apiClient } from './client';
import type {
  PollTemplateResponse,
  PollCreate,
  PollResponse,
  VoteRequest,
  VoteResponse,
  TemplateCategory,
} from '../types/poll';

export const pollApi = {
  // 템플릿 목록 (카테고리 필터 옵션)
  async getTemplates(category?: TemplateCategory): Promise<PollTemplateResponse[]> {
    const params = category ? { category } : {};
    const response = await apiClient.get<PollTemplateResponse[]>('/polls/templates', {
      params,
    });
    return response.data;
  },

  // 투표 생성
  async createPoll(circleId: string, data: PollCreate): Promise<PollResponse> {
    const response = await apiClient.post<PollResponse>(
      `/polls/circles/${circleId}/polls`,
      data
    );
    return response.data;
  },

  // 투표하기
  async vote(pollId: string, data: VoteRequest): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>(
      `/polls/${pollId}/vote`,
      data
    );
    return response.data;
  },
};
```

---

## 🗂️ 상태 관리 (Zustand + React Query)

### 전략

- **서버 상태**: React Query (캐싱, 재시도, 백그라운드 업데이트)
- **클라이언트 상태**: Zustand (인증, UI 상태)

### 1. Auth 스토어 (Zustand)

**파일**: `src/stores/auth.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserResponse } from '../types/auth';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: UserResponse | null) => void;
  setAccessToken: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAccessToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('access_token', token);
    } else {
      await AsyncStorage.removeItem('access_token');
    }
    set({ accessToken: token });
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = await AsyncStorage.getItem('access_token');
    set({ accessToken: token });
  },
}));
```

---

### 2. React Query 훅

**파일**: `src/hooks/useAuth.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';
import type { UserCreate, LoginRequest, UserUpdate } from '../types/auth';

// 현재 사용자 정보 조회
export function useCurrentUser() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: authApi.getMe,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });
}

// 회원가입
export function useRegister() {
  const { setUser, setAccessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      setUser(data.user);
      await setAccessToken(data.access_token);
      queryClient.setQueryData(['user', 'me'], data.user);
    },
  });
}

// 로그인
export function useLogin() {
  const { setUser, setAccessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setUser(data.user);
      await setAccessToken(data.access_token);
      queryClient.setQueryData(['user', 'me'], data.user);
    },
  });
}

// 프로필 수정
export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['user', 'me'], data);
    },
  });
}
```

---

**파일**: `src/hooks/useCircles.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circleApi } from '../api/circle';
import type { CircleCreate, JoinByCodeRequest } from '../types/circle';

// 내 Circle 목록
export function useMyCircles() {
  return useQuery({
    queryKey: ['circles', 'my'],
    queryFn: circleApi.getMyCircles,
    staleTime: 2 * 60 * 1000, // 2분간 캐시
  });
}

// Circle 상세
export function useCircleDetail(circleId: string) {
  return useQuery({
    queryKey: ['circles', circleId],
    queryFn: () => circleApi.getCircleDetail(circleId),
    enabled: !!circleId,
  });
}

// Circle 생성
export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: circleApi.createCircle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
    },
  });
}

// 코드로 참여
export function useJoinByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: circleApi.joinByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
    },
  });
}
```

---

**파일**: `src/hooks/usePolls.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollApi } from '../api/poll';
import type { PollCreate, VoteRequest, TemplateCategory } from '../types/poll';

// 템플릿 목록
export function usePollTemplates(category?: TemplateCategory) {
  return useQuery({
    queryKey: ['polls', 'templates', category],
    queryFn: () => pollApi.getTemplates(category),
    staleTime: 10 * 60 * 1000, // 10분간 캐시
  });
}

// 투표 생성
export function useCreatePoll(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PollCreate) => pollApi.createPoll(circleId, data),
    onSuccess: () => {
      // Circle 상세 다시 불러오기 (진행중 투표 갱신)
      queryClient.invalidateQueries({ queryKey: ['circles', circleId] });
    },
  });
}

// 투표하기
export function useVote(pollId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VoteRequest) => pollApi.vote(pollId, data),
    onSuccess: () => {
      // 투표 결과 갱신
      queryClient.invalidateQueries({ queryKey: ['polls', pollId] });
    },
  });
}
```

---

## 🎬 화면별 구현 가이드

### 1. Home 화면 (진행중 투표 목록)

**파일**: `app/(main)/(home)/index.tsx`

```typescript
import { FlatList, RefreshControl } from 'react-native';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { VoteCard } from '../../../src/components/patterns/VoteCard';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';

export default function HomeScreen() {
  const { data: circles, isLoading, refetch, isRefetching } = useMyCircles();

  if (isLoading) return <LoadingSpinner />;

  if (!circles || circles.length === 0) {
    return (
      <EmptyState
        emoji="🗳️"
        title="진행 중인 투표가 없어요"
        description="새로운 투표를 만들거나 Circle에 참여해보세요!"
        actionText="투표 만들기"
        onAction={() => router.push('/create')}
      />
    );
  }

  return (
    <FlatList
      data={circles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <VoteCard
          circleId={item.id}
          circleName={item.name}
          onPress={() => router.push(`/poll/${item.id}`)}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    />
  );
}
```

---

### 2. 투표 화면

**참고**: `prd/features/01-voting-spec.md`
**디자인**: `prd/design/05-complete-ui-specification.md` → 섹션 2.3

```typescript
// app/poll/[id].tsx
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useCircleDetail } from '../../src/hooks/useCircles';
import { useVote } from '../../src/hooks/usePolls';

export default function VoteScreen() {
  const { id: pollId } = useLocalSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: poll } = usePollDetail(pollId);
  const { data: circle } = useCircleDetail(poll?.circle_id);
  const { mutate: vote, isPending } = useVote(pollId);

  const handleVote = () => {
    if (!selectedUserId) return;

    vote(
      { voted_for_id: selectedUserId },
      {
        onSuccess: () => {
          // 성공 애니메이션 후 결과 화면으로
          router.replace(`/poll/result/${pollId}`);
        },
      }
    );
  };

  return (
    <VotingScreen
      question={poll.question_text}
      options={circle.members}
      selectedOption={selectedUserId}
      onSelect={setSelectedUserId}
      onSubmit={handleVote}
      isSubmitting={isPending}
    />
  );
}
```

---

## 📊 에러 처리 전략

### 1. API 에러 코드 매핑

**파일**: `src/utils/errorMessages.ts`

```typescript
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  AUTH_REQUIRED: '로그인이 필요합니다',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다',

  // Circle
  CIRCLE_NOT_FOUND: 'Circle을 찾을 수 없습니다',
  INVALID_INVITE_CODE: '유효하지 않은 초대 코드입니다',
  CIRCLE_FULL: 'Circle 인원이 가득 찼습니다',
  ALREADY_MEMBER: '이미 참여 중인 Circle입니다',

  // Poll
  POLL_NOT_FOUND: '투표를 찾을 수 없습니다',
  POLL_ENDED: '이미 종료된 투표입니다',
  ALREADY_VOTED: '이미 투표에 참여하셨습니다',
  SELF_VOTE_NOT_ALLOWED: '자기 자신에게는 투표할 수 없습니다',
  MAX_POLLS_EXCEEDED: '생성 가능한 투표 수를 초과했습니다',

  // Default
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
};

export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
}
```

---

### 2. Toast 알림 컴포넌트

```typescript
// src/components/Toast.tsx
import { useToast } from 'react-native-toast-notifications';

export function showErrorToast(errorCode: string) {
  const toast = useToast();
  const message = getErrorMessage(errorCode);

  toast.show(message, {
    type: 'danger',
    duration: 3000,
    icon: '❌',
  });
}

export function showSuccessToast(message: string) {
  const toast = useToast();

  toast.show(message, {
    type: 'success',
    duration: 2000,
    icon: '✅',
  });
}
```

---

## 🎨 디자인 시스템 사용법

### Tokens 사용 예시

```typescript
import { tokens } from '../theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.lg,
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[6],
    ...tokens.shadows.primary,
  },
  text: {
    fontSize: tokens.fontSizes.base,
    fontWeight: tokens.fontWeights.semibold,
    color: tokens.colors.white,
  },
});
```

---

## 📝 체크리스트

### 구현 순서

- [ ] **1단계: 기반 설정** (1-2일)
  - [ ] API 클라이언트 설정
  - [ ] 타입 정의 작성
  - [ ] React Query 설정
  - [ ] Zustand 스토어 생성

- [ ] **2단계: 인증 플로우** (2-3일)
  - [ ] 로그인/회원가입 화면
  - [ ] 토큰 저장/복원
  - [ ] Protected Route 설정

- [ ] **3단계: Circle 기능** (3-4일)
  - [ ] Circle 목록/생성
  - [ ] 초대 코드 입력
  - [ ] 멤버 목록

- [ ] **4단계: 투표 기능** (4-5일)
  - [ ] 투표 템플릿 선택
  - [ ] 투표 생성
  - [ ] 투표 참여
  - [ ] 실시간 결과

- [ ] **5단계: 폴리싱** (2-3일)
  - [ ] 애니메이션 추가
  - [ ] 에러 처리 강화
  - [ ] 로딩 상태 개선
  - [ ] 접근성 검증

---

## 🔗 참조 문서

| 문서 | 역할 |
|------|------|
| `docs/DSL.md` | **API 스키마, 엔드포인트 정의** |
| `prd/00-prd.md` | 제품 전체 요구사항 |
| `prd/design/02-ui-design-system.md` | **디자인 토큰 정의** |
| `prd/design/03-animations.md` | **애니메이션 명세** |
| `prd/design/05-complete-ui-specification.md` | **화면별 픽셀 스펙** |
| `prd/features/01-voting-spec.md` | **투표 기능 상세** |

---

**버전 이력**:
- v1.0.0 (2024-12-28): 초안 작성
