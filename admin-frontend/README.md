# Circly Admin Dashboard

Circly 서비스 관리를 위한 웹 기반 관리자 대시보드

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | React Query (서버) + Zustand (클라이언트) |
| Routing | React Router v6 |
| Auth | Supabase Auth |
| HTTP Client | Fetch API |

## 시작하기

### 1. 의존성 설치

```bash
cd admin-frontend
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 값을 입력:

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:5173 에서 확인

### 4. 빌드

```bash
npm run build
npm run preview  # 빌드 결과 미리보기
```

## 프로젝트 구조

```
src/
├── api/                  # API 클라이언트 (Phase 2+)
│   ├── client.ts         # Axios 인스턴스
│   ├── stats.ts          # 통계 API
│   ├── users.ts          # 사용자 관리 API
│   ├── reports.ts        # 신고 관리 API
│   ├── circles.ts        # Circle 관리 API
│   └── notifications.ts  # 알림 관리 API
│
├── components/
│   ├── layout/           # 레이아웃 컴포넌트
│   │   ├── AppSidebar.tsx    # 사이드바 (5개 메뉴)
│   │   ├── Header.tsx        # 상단 헤더
│   │   └── Layout.tsx        # 전체 레이아웃
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── ProtectedRoute.tsx    # 인증 보호 라우트
│
├── hooks/                # React Query 훅 (Phase 2+)
│   ├── useStats.ts
│   ├── useUsers.ts
│   └── ...
│
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트
│   └── utils.ts          # 유틸리티 함수
│
├── pages/                # 페이지 컴포넌트
│   ├── LoginPage.tsx         # 로그인
│   ├── DashboardPage.tsx     # 대시보드 (통계)
│   ├── ReportsPage.tsx       # 신고 관리
│   ├── UsersPage.tsx         # 사용자 관리
│   ├── CirclesPage.tsx       # Circle 관리
│   └── NotificationsPage.tsx # 알림 관리
│
├── stores/
│   └── auth.ts           # 인증 상태 (Zustand)
│
├── types/                # TypeScript 타입
│   └── auth.ts
│
├── App.tsx               # 라우터 설정
├── main.tsx              # 엔트리 포인트
└── index.css             # 글로벌 스타일 (Tailwind)
```

## 라우팅

| 경로 | 페이지 | 인증 필요 |
|------|--------|----------|
| `/login` | 로그인 | ❌ |
| `/` | 대시보드 | ✅ (Admin) |
| `/reports` | 신고 관리 | ✅ (Admin) |
| `/users` | 사용자 관리 | ✅ (Admin) |
| `/circles` | Circle 관리 | ✅ (Admin) |
| `/notifications` | 알림 관리 | ✅ (Admin) |

## 인증 플로우

1. 사용자가 `/login`에서 이메일/비밀번호 입력
2. Supabase Auth로 로그인 → access_token 획득
3. 백엔드 `/auth/me` 호출 → 사용자 정보 + 역할 확인
4. `role === 'ADMIN'`인 경우만 접근 허용
5. 토큰은 Zustand + localStorage에 저장

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Supabase  │────▶│   Backend   │
│  (Admin UI) │     │    Auth     │     │   FastAPI   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │  1. Login          │                    │
      │───────────────────▶│                    │
      │                    │                    │
      │  2. access_token   │                    │
      │◀───────────────────│                    │
      │                    │                    │
      │  3. GET /auth/me (Bearer token)         │
      │────────────────────────────────────────▶│
      │                    │                    │
      │  4. User + role                         │
      │◀────────────────────────────────────────│
```

## 개발 가이드

### 새 페이지 추가

1. `src/pages/`에 페이지 컴포넌트 생성
2. `src/pages/index.ts`에 export 추가
3. `src/App.tsx`에 Route 추가
4. `src/components/layout/AppSidebar.tsx`에 메뉴 추가

### API 연동

```typescript
// src/api/example.ts
import { getAccessToken } from '@/stores/auth';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchData() {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/endpoint`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
```

### shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add [component-name]
# 예: npx shadcn@latest add table dialog
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 실행 |

## 관련 문서

- [구현 계획](./plan-admin.md) - 전체 구현 계획 및 Phase별 상세
- [Backend API 문서](http://localhost:8000/docs) - Swagger UI
- [shadcn/ui 문서](https://ui.shadcn.com/docs)
