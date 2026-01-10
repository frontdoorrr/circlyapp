# Circly Admin Dashboard 구현 계획

## 목표
React 기반 웹 관리자 대시보드 구축

## 기능 범위 (우선순위 순)
1. **통계 대시보드** - DAU, MAU, 투표 수, Circle 수, 신고 현황
2. **신고 관리** - 목록 조회, 상태 변경, 사용자 제재
3. **사용자 관리** - 목록, 역할 변경, 활성화/비활성화
4. **Circle 관리** - 목록, 강제 삭제, 멤버 관리
5. **알림 관리** - 전체 알림 발송, 발송 이력

---

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| Framework | React 18 + TypeScript + Vite | 빠른 개발, 타입 안전성 |
| Styling | Tailwind CSS + shadcn/ui | 모던 UI, 커스터마이징 용이 |
| State | React Query + Zustand | 기존 모바일 앱과 동일 패턴 |
| Charts | Recharts | 통계 시각화 |
| Auth | Supabase Auth | 기존 인증 시스템 재사용 |

---

## 디렉토리 구조

```
admin-frontend/
├── src/
│   ├── api/           # API 클라이언트 (client, stats, users, reports...)
│   ├── components/
│   │   ├── ui/        # shadcn/ui 컴포넌트
│   │   ├── layout/    # Sidebar, Header, Layout
│   │   └── [feature]/ # 기능별 컴포넌트
│   ├── hooks/         # React Query 훅 (useStats, useUsers...)
│   ├── pages/         # 페이지 컴포넌트
│   ├── stores/        # Zustand (auth)
│   ├── types/         # TypeScript 타입
│   └── lib/           # supabase, utils
```

---

## 백엔드 API 추가 필요

### 1. Stats 모듈 (신규)

| Endpoint | 설명 |
|----------|------|
| `GET /admin/stats/overview` | 전체 통계 (사용자, Circle, 투표, 신고 수) |
| `GET /admin/stats/users?period=daily` | 사용자 추이 (신규/활성) |
| `GET /admin/stats/polls?period=daily` | 투표 추이 |
| `GET /admin/stats/reports` | 신고 통계 (상태별, 유형별) |

### 2. Notifications 확장

| Endpoint | 설명 |
|----------|------|
| `POST /admin/notifications/broadcast` | 전체 알림 발송 |
| `GET /admin/notifications/history` | 발송 이력 조회 |

### 3. 기존 API 확장

| Endpoint | 설명 |
|----------|------|
| `DELETE /admin/circles/{id}` | Circle 강제 삭제 |
| `GET /admin/circles/{id}/members` | Circle 멤버 목록 |

---

## 구현 단계

### Phase 1: 프로젝트 초기화 (1일) ✅
- [x] Vite + React + TypeScript 생성
- [x] Tailwind + shadcn/ui 설정
- [x] 기본 레이아웃 (Sidebar, Header)
- [x] Supabase Auth 연동 + 로그인 페이지
- [x] Protected Route 구현

### Phase 2: 통계 대시보드 (2일) ✅
- [x] Backend: stats 모듈 생성
  - `backend/app/modules/stats/` (router, service, schemas)
- [x] Frontend: 대시보드 페이지
  - StatCard, ChartCard 컴포넌트
  - useStatsOverview, useUserStats, usePollStats, useReportStats 훅

### Phase 3: 신고 관리 (1일) ✅
- [x] 신고 목록 테이블 (필터, 페이지네이션)
- [x] 상태 변경 다이얼로그
- [x] API 연동 (기존 `/reports/admin/*` 활용)

### Phase 4: 사용자 관리 (1일) ✅
- [x] 사용자 목록 테이블 (검색, 필터링, 페이지네이션)
- [x] 역할 변경 다이얼로그, 상태 변경 기능
- [x] API 연동 (기존 `/auth/admin/*` 활용)

### Phase 5: Circle 관리 (1일) ✅
- [x] Circle 목록 테이블 (검색, 필터링, 페이지네이션)
- [x] 멤버 목록 다이얼로그 (멤버 추방 기능)
- [x] Circle 상태 변경 (활성/비활성화)
- [x] 초대 코드 복사 기능

### Phase 6: 알림 관리 (2일) ✅
- [x] Backend: broadcast API, history API
- [x] 발송 폼 UI
- [x] 발송 이력 테이블

### Phase 7: 마무리 (1일) ✅
- [x] 에러 처리, 로딩 상태 (Toast 알림 시스템)
- [x] 반응형 디자인
- [x] 빌드/배포 설정 (Dockerfile, nginx.conf)

---

## 핵심 파일 (참조)

| 파일 | 용도 |
|------|------|
| `backend/app/deps.py` | `AdminUserDep` - Admin 인증 의존성 |
| `backend/app/modules/reports/router.py` | Admin API 라우팅 패턴 참조 |
| `frontend/src/api/client.ts` | Axios 인터셉터 패턴 참조 |
| `docs/DSL.md` | 도메인 모델 정의 |

---

## 검증 계획

1. **로컬 테스트**: Backend 서버 + Admin 웹 동시 실행
2. **API 검증**: Swagger UI (`/docs`)로 각 엔드포인트 테스트
3. **권한 테스트**: 일반 사용자로 Admin API 접근 시 403 확인
4. **E2E 테스트**: 전체 관리 워크플로우 수동 검증

---

## 예상 일정
- 총 **8-10일** (풀타임 기준)
- Phase 1-2 (통계 대시보드)를 먼저 완료하여 핵심 가치 확인
