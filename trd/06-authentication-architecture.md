# TRD 06: 인증 시스템 아키텍처 (Supabase Auth)

## 문서 정보
- **작성일**: 2025-01-20
- **수정일**: 2025-12-31
- **버전**: v3.0
- **담당자**: Backend Team
- **상태**: Implemented

---

## 개요

Circly는 **Supabase Auth**를 사용한 인증 시스템을 구현합니다.

**핵심 특징**:
- 프론트엔드에서 Supabase Auth 직접 호출 (로그인/회원가입)
- 백엔드는 JWT 검증만 수행 (Stateless)
- 토큰 갱신은 Supabase JS 클라이언트가 자동 처리

---

## 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │    Supabase     │     │     Backend     │
│   (React Native)│     │      Auth       │     │    (FastAPI)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. 로그인 요청        │                       │
         │ signInWithPassword()  │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. JWT 토큰 반환      │                       │
         │  (access + refresh)   │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  3. API 요청 + Bearer Token                   │
         │──────────────────────────────────────────────>│
         │                       │                       │
         │                       │  4. JWKS로 JWT 검증   │
         │                       │<──────────────────────│
         │                       │                       │
         │  5. 응답 반환                                 │
         │<──────────────────────────────────────────────│
         │                       │                       │
         │  6. 토큰 만료 시       │                       │
         │  자동 갱신 (refresh)  │                       │
         │──────────────────────>│                       │
```

---

## 역할 분담

| 구성요소 | 역할 | 상세 |
|---------|------|------|
| **Supabase Auth** | 인증 서버 | 사용자 관리, JWT 발급, 토큰 갱신 |
| **Frontend** | 세션 관리 | 로그인/회원가입, 토큰 저장, 자동 갱신 |
| **Backend** | JWT 검증 | 토큰 서명 검증, 사용자 프로필 관리 |

---

## Frontend 구현

### Supabase 클라이언트 설정

```typescript
// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,        // React Native 저장소
    autoRefreshToken: true,       // 토큰 자동 갱신
    persistSession: true,         // 세션 유지
    detectSessionInUrl: false,    // 웹 전용 기능 비활성화
  },
});
```

### 인증 훅 (useAuth.ts)

```typescript
// 로그인
export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return authData;
    },
    onSuccess: async (result) => {
      setSession(result.session);
      // 백엔드에서 프로필 조회 (없으면 자동 생성)
      const userProfile = await authApi.getCurrentUser();
      setUser(userProfile);
    },
  });
}

// 회원가입
export function useRegister() {
  return useMutation({
    mutationFn: async (data: UserCreate) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { username: data.username, display_name: data.display_name },
        },
      });
      if (error) throw new Error(error.message);
      return authData;
    },
  });
}

// 로그아웃
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
  });
}
```

### API 클라이언트 (토큰 자동 주입)

```typescript
// src/api/client.ts
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});
```

---

## Backend 구현

### JWT 검증 (JWKS 사용)

```python
# app/core/supabase.py
from functools import lru_cache
import jwt
from jwt import PyJWKClient

@lru_cache
def get_jwks_client() -> PyJWKClient:
    """Supabase JWKS 클라이언트 (공개키 자동 캐싱)"""
    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)

def verify_supabase_token(token: str) -> dict | None:
    """Supabase JWT 검증"""
    settings = get_settings()
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
        return payload
    except jwt.exceptions.PyJWTError:
        return None
```

### 인증 의존성 (deps.py)

```python
# app/deps.py
async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """현재 인증된 사용자 반환 (JWT 검증)"""

    # 1. 토큰 추출
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header")
    token = authorization.split(" ")[1]

    # 2. JWT 검증 (Supabase JWKS)
    payload = verify_supabase_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    # 3. Supabase user_id 추출
    supabase_user_id = payload.get("sub")

    # 4. 로컬 사용자 조회/생성
    repo = UserRepository(db)
    user = await repo.find_by_supabase_id(supabase_user_id)

    if user is None:
        # 첫 요청 시 자동 프로필 생성
        email = payload.get("email", "")
        user = await repo.create_from_supabase(supabase_user_id, email)
        await db.commit()

    return user
```

---

## 데이터베이스 설계

### Users 테이블

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    supabase_user_id VARCHAR(255) UNIQUE,  -- Supabase auth.users.id
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    profile_emoji VARCHAR(10) DEFAULT '😊',
    role user_role DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX ix_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX ix_users_email ON users(email);
```

### Supabase Auth ↔ Local DB 관계

```
┌─────────────────────┐     ┌─────────────────────┐
│  Supabase auth.users│     │   public.users      │
├─────────────────────┤     ├─────────────────────┤
│ id (UUID)           │────>│ supabase_user_id    │
│ email               │     │ email               │
│ encrypted_password  │     │ username            │
│ created_at          │     │ display_name        │
│ ...                 │     │ profile_emoji       │
└─────────────────────┘     │ role                │
                            │ is_active           │
                            └─────────────────────┘
```

---

## API 엔드포인트

### 인증 관련 (프론트엔드 → Supabase 직접)

| 작업 | 호출 대상 | 메서드 |
|------|----------|--------|
| 로그인 | Supabase | `supabase.auth.signInWithPassword()` |
| 회원가입 | Supabase | `supabase.auth.signUp()` |
| 로그아웃 | Supabase | `supabase.auth.signOut()` |
| 토큰 갱신 | Supabase | 자동 (autoRefreshToken) |

### 프로필 관련 (프론트엔드 → 백엔드)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/auth/me` | GET | 현재 사용자 프로필 조회 |
| `/auth/me` | PUT | 프로필 수정 |

### 레거시 엔드포인트 (유지, 선택적 사용)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/auth/register` | POST | 백엔드 프록시 회원가입 |
| `/auth/login` | POST | 백엔드 프록시 로그인 |

---

## 환경 변수

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...              # 사용자 인증용
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # 관리자 작업용 (RLS 우회)
```

### Frontend (.env)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Supabase Dashboard 설정

### Authentication → Providers → Email

| 설정 | 값 | 설명 |
|------|-----|------|
| Enable Email Provider | ON | 이메일 로그인 활성화 |
| Confirm Email | OFF | 이메일 확인 비활성화 |
| Secure Email Change | ON | 이메일 변경 시 확인 |

### Authentication → Settings

| 설정 | 값 | 설명 |
|------|-----|------|
| JWT Expiry | 604800 | 7일 (초 단위) |
| Minimum Password Length | 8 | 최소 비밀번호 길이 |

---

## 보안 고려사항

### JWT 검증

- RS256 알고리즘 사용 (비대칭 키)
- JWKS 엔드포인트로 공개키 자동 획득
- `audience: "authenticated"` 검증
- `issuer` 검증

### 토큰 관리

- Access Token: 7일 만료
- Refresh Token: Supabase JS가 자동 갱신
- 토큰 저장: AsyncStorage (React Native)

### 프로필 자동 생성

- 첫 API 요청 시 로컬 프로필 자동 생성
- Supabase user_id로 연결

---

## 마이그레이션 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-01-20 | 초기 작성 (Self-managed JWT) |
| v2.0 | 2025-08-26 | 단순화 계획 |
| v3.0 | 2025-12-31 | Supabase Auth 마이그레이션 완료 |

---

## 관련 파일

### Backend
- `app/core/supabase.py` - Supabase 클라이언트, JWT 검증
- `app/deps.py` - 인증 의존성
- `app/modules/auth/service.py` - 레거시 프록시 로직
- `app/modules/auth/repository.py` - 사용자 데이터 접근

### Frontend
- `src/lib/supabase.ts` - Supabase 클라이언트
- `src/hooks/useAuth.ts` - 인증 훅
- `src/stores/auth.ts` - 인증 상태 관리
- `src/api/client.ts` - API 클라이언트 (토큰 주입)

---

**문서 버전**: v3.0
**최종 업데이트**: 2025-12-31
**작성자**: Claude Code
