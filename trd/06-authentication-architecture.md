# TRD 06: 인증 시스템 아키텍처 (Authentication Architecture)

## 📋 문서 정보
- **작성일**: 2025-01-20
- **수정일**: 2025-08-26
- **버전**: v2.0
- **담당자**: Backend Team
- **상태**: In Progress
- **관련 PRD**: PRD 09: 인증 시스템

---

## 🎯 개요

**기존 복잡한 인증 시스템을 단순화하여 JWT 기반 이메일/비밀번호 로그인만 지원하는 표준 인증 시스템으로 리팩토링합니다.**

**변경 사항**:
- ❌ 디바이스 기반 로그인 제거
- ❌ 소셜 로그인 제거 (추후 필요시 추가)
- ❌ 2FA, 생체 인증 등 고급 기능 제거
- ✅ FastAPI OAuth2 표준 구현
- ✅ 간단하고 명확한 JWT 기반 인증
- ✅ 이메일/비밀번호 회원가입 및 로그인만 지원

---

## 🏗️ 현재 시스템 분석

### 기존 문제점
**현재 구현**:
- ❌ 복잡한 다중 인증 방식 (디바이스, 이메일, 소셜)
- ❌ 과도한 인증 서비스 레이어 분리
- ❌ 불필요한 마이그레이션 로직
- ❌ FastAPI OAuth2 표준 미준수
- ❌ Swagger UI 로그인 기능 미흡

**제거할 컴포넌트**:
- 디바이스 기반 로그인 (`device_auth.py`)
- 소셜 로그인 (`social_auth.py`)
- 계정 마이그레이션 (`migration.py`)
- 복잡한 서비스 계층 구조

---

## 🎯 새로운 단순화된 Architecture

### Target Architecture (FastAPI 표준)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Login/Register│◄┼────┼►│OAuth2 Token  │◄┼────┼►│ users Table │ │
│ │  Pages      │ │    │ │  Endpoint    │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │Swagger UI   │◄┼────┼►│  JWT Auth    │ │    │                 │
│ │Authorization│ │    │ │ Dependencies │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**핵심 컴포넌트**:
- **OAuth2PasswordBearer**: 표준 OAuth2 토큰 인증
- **login/access-token**: 표준 토큰 엔드포인트
- **User CRUD**: 간단한 사용자 관리
- **JWT 토큰**: Access Token만 사용 (Refresh Token 제거)

---

## 🗄️ 단순화된 데이터베이스 설계

### 1. User 테이블 (최소 필드만 유지)

```sql
-- users 테이블 (기존 유지하되 정리)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,           -- 필수
    hashed_password VARCHAR(255) NOT NULL,        -- 필수
    username VARCHAR(50),                         -- 선택
    display_name VARCHAR(100),                    -- 선택
    profile_emoji VARCHAR(10) DEFAULT '😊',       -- 선택
    role VARCHAR(20) DEFAULT 'USER',              -- 권한 (USER, ADMIN)
    is_active BOOLEAN DEFAULT TRUE,               -- 활성 상태
    is_superuser BOOLEAN DEFAULT FALSE,           -- 슈퍼유저 (관리용)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 필수 인덱스
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

**제거되는 컬럼들**:
- ❌ `device_id` (디바이스 로그인 제거)
- ❌ `account_type` (이메일만 사용)
- ❌ `email_verified` (단순화)
- ❌ `login_attempts` (복잡한 보안 로직 제거)
- ❌ `locked_until` (복잡한 보안 로직 제거)

**제거되는 테이블들**:
- ❌ `user_social_accounts` (소셜 로그인 제거)
- ❌ `user_two_factor_auth` (2FA 제거) 
- ❌ `user_devices` (디바이스 관리 제거)
- ❌ `user_login_logs` (복잡한 로깅 제거)
- ❌ `email_verifications` (이메일 인증 단순화)
- ❌ `password_reset_tokens` (비밀번호 재설정 제거, 추후 필요시 추가)

---

## 🔧 단순화된 백엔드 구현 (FastAPI OAuth2 표준)

**참고 아키텍처**: `/app/` 레퍼런스 폴더의 FastAPI OAuth2 표준 구현

### 4.1 핵심 구조

```
app/
├── api/
│   └── api_v1/
│       └── endpoints/
│           └── login.py            # OAuth2 토큰 엔드포인트
├── core/
│   ├── config.py                   # 설정
│   └── security.py                 # JWT 유틸리티
├── crud/
│   └── crud_user.py                # 사용자 CRUD
├── models/
│   └── user.py                     # User 모델 
├── schemas/
│   ├── token.py                    # Token 스키마
│   └── user.py                     # User 스키마
├── deps.py                         # 의존성 (OAuth2PasswordBearer)
└── main.py                         # FastAPI 앱
```

### 4.2 핵심 엔드포인트 (OAuth2 표준)

```python
# OAuth2 호환 토큰 엔드포인트 (Swagger UI 지원)
POST /api/v1/login/access-token     # OAuth2PasswordRequestForm 사용
POST /api/v1/login/test-token       # 토큰 검증

# 비밀번호 관리
POST /api/v1/password-recovery/{email}  # 비밀번호 찾기
POST /api/v1/reset-password/            # 비밀번호 재설정

# 사용자 관리 
POST /api/v1/users/                     # 사용자 등록
GET /api/v1/users/me                    # 현재 사용자 정보
PUT /api/v1/users/me                    # 사용자 정보 수정
```

**제거되는 복잡한 구조**:
- ❌ `services/auth/` 전체 폴더 (디바이스, 소셜, 마이그레이션)
- ❌ `services/email/` 폴더 
- ❌ `services/external/` 폴더
- ❌ 과도한 서비스 레이어 분리

### 4.3 핵심 컴포넌트 (레퍼런스 기반)

#### 1) OAuth2 의존성 (deps.py)
```python
# app/deps.py (레퍼런스 참고)
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core import security
from app.core.config import settings

# OAuth2 스키마 정의
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(reusable_oauth2)
) -> models.User:
    """현재 인증된 사용자 반환"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = crud.user.get(db, id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

#### 2) 로그인 엔드포인트 (login.py)
```python
# app/api/api_v1/endpoints/login.py (레퍼런스 참고)
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login/access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user
```

#### 3) 토큰 및 사용자 스키마 (schemas/)
```python
# app/schemas/token.py (레퍼런스 참고)
from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
```

```python
# app/schemas/user.py (간소화)
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: Optional[int] = None
    
    class Config:
        orm_mode = True
```

#### 4) CRUD 구현 (crud/crud_user.py)
```python
# app/crud/crud_user.py (레퍼런스 기반 간소화)
from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            username=obj_in.username,
            display_name=obj_in.display_name,
            is_active=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def authenticate(
        self, db: Session, *, email: str, password: str
    ) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def is_active(self, user: User) -> bool:
        return user.is_active
    
    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

user = CRUDUser(User)
```

### 4.5 사용자 모델 (models/user.py)
```python
# app/models/user.py (간소화된 버전)
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    profile_emoji = Column(String, default="😊")
    role = Column(String, default="USER")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

---

## 📱 간소화된 프론트엔드 구현

### 5.1 간단한 인증 상태 관리

```typescript
// src/store/authStore.ts (단순화)
interface AuthStore extends AuthState {
  // 기본 메서드들
  emailLogin: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  
  // 프로필 관리
  getCurrentUser: () => Promise<User>;
  updateProfile: (userData: UserUpdate) => Promise<void>;
  
  // 비밀번호 관리 (추후 구현)
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}
```

### 5.2 API 서비스 (간소화)

```typescript
// src/services/api/authApi.ts
export class AuthApiService {
  
  async login(email: string, password: string): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', email); // OAuth2 standard uses 'username'
    formData.append('password', password);
    
    const response = await fetch('/api/v1/login/access-token', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }
  
  async register(userData: UserCreate): Promise<User> {
    const response = await fetch('/api/v1/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    return response.json();
  }
  
  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    
    return response.json();
  }
}
```

---

## 🔒 간소화된 보안 고려사항

### 6.1 기본 보안 원칙

**FastAPI OAuth2 표준 보안**:
- ✅ JWT 토큰 기반 인증
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ HTTPS 강제 사용
- ✅ Swagger UI OAuth2 통합

**최소 보안 요구사항**:
```python
# app/core/security.py (간소화)
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

---

## 📋 단순화된 마이그레이션 계획

### 7.1 기존 시스템에서 제거할 항목

**제거할 파일들**:
```bash
# 복잡한 인증 서비스 제거
rm -rf backend/app/services/auth/
rm -rf backend/app/services/external/
rm -rf backend/app/services/email/

# 디바이스 관련 제거
rm backend/app/models/device.py
rm backend/app/api/v1/routers/device_auth.py

# 소셜 로그인 관련 제거  
rm backend/app/models/social_account.py
rm backend/app/api/v1/routers/social_auth.py
```

**데이터베이스 마이그레이션**:
```python
# migration: remove_complex_auth_tables.py
def upgrade():
    # 복잡한 테이블들 제거
    op.drop_table('user_social_accounts')
    op.drop_table('user_two_factor_auth') 
    op.drop_table('user_devices')
    op.drop_table('user_login_logs')
    op.drop_table('email_verifications')
    
    # users 테이블 정리 (불필요한 컬럼 제거)
    op.drop_column('users', 'device_id')
    op.drop_column('users', 'account_type') 
    op.drop_column('users', 'login_attempts')
    op.drop_column('users', 'locked_until')
```

### 7.2 구현 단계

**1단계: FastAPI OAuth2 표준 구현**
```bash
# 새로운 파일 생성
touch backend/app/schemas/token.py
touch backend/app/schemas/user.py  
touch backend/app/api/api_v1/endpoints/login.py
touch backend/app/deps.py

# 기존 파일 업데이트
# backend/app/models/user.py - 간소화
# backend/app/crud/crud_user.py - OAuth2 표준 맞춤
# backend/app/core/security.py - JWT 토큰만 유지
```

**2단계: 기존 복잡한 시스템 제거**
```bash
# 복잡한 인증 관련 제거
rm -rf backend/app/services/auth/
rm -rf backend/app/services/external/
rm -rf backend/app/api/v1/routers/device_auth.py
rm -rf backend/app/api/v1/routers/social_auth.py
```

**3단계: 데이터베이스 정리**
```bash
# 마이그레이션 생성 및 실행
alembic revision --autogenerate -m "simplify_auth_system"
alembic upgrade head
```

---

## 🧪 간소화된 테스트 전략

### 8.1 기본 테스트 구조

```python
# tests/test_auth.py (간소화된 버전)
import pytest
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    """OAuth2 로그인 성공 테스트"""
    response = client.post("/api/v1/login/access-token", data={
        "username": "test@example.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient):
    """잘못된 자격증명으로 로그인 실패 테스트"""
    response = client.post("/api/v1/login/access-token", data={
        "username": "test@example.com", 
        "password": "wrongpassword"
    })
    assert response.status_code == 400

def test_protected_endpoint(client: TestClient, auth_headers):
    """보호된 엔드포인트 접근 테스트"""
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
```

---

**문서 버전**: v1.0  
**최종 업데이트**: 2025-01-20  
**검토자**: Backend Team Lead  
**승인자**: CTO

---

*이 문서는 개발 진행에 따라 지속적으로 업데이트됩니다.*