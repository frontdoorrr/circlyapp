# TRD 06: 인증 시스템 아키텍처 (Authentication Architecture)

## 📋 문서 정보
- **작성일**: 2025-01-20
- **버전**: v1.0
- **담당자**: Backend Team
- **상태**: Draft
- **관련 PRD**: PRD 09: 인증 시스템

---

## 🎯 개요

현재 디바이스 기반 로그인 시스템을 확장하여 이메일/비밀번호 로그인 및 소셜 로그인을 지원하는 종합적인 인증 시스템 아키텍처를 설계합니다.

---

## 🏗️ 현재 시스템 분석

### 기존 Architecture
```
[Frontend] → [Auth API] → [JWT Token] → [Database]
```

**현재 구현**:
- 디바이스 ID 기반 자동 계정 생성
- JWT 토큰 (7일 만료)
- SQLAlchemy ORM
- FastAPI + Pydantic 스키마

**장점**:
- 간단한 로그인 플로우
- 익명성 보장
- 빠른 온보딩

**한계**:
- 디바이스 분실 시 계정 복구 불가
- 다중 기기 지원 불가
- 사용자 식별 어려움

---

## 🎯 새로운 Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Auth Pages  │◄┼────┼►│ Auth Service │◄┼────┼►│ User Table  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Social SDK  │◄┼────┼►│ OAuth Service│◄┼────┼►│Social Table │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Biometric   │◄┼────┼►│ 2FA Service  │◄┼────┼►│ 2FA Table   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘

                              │
                              ▼
                    ┌──────────────────┐
                    │ External Services │
                    │ ┌──────────────┐ │
                    │ │ Email Service│ │
                    │ └──────────────┘ │
                    │ ┌──────────────┐ │
                    │ │ SMS Service  │ │
                    │ └──────────────┘ │
                    │ ┌──────────────┐ │
                    │ │ Social APIs  │ │
                    │ └──────────────┘ │
                    └──────────────────┘
```

---

## 🗄️ 데이터베이스 설계

### 1. User 테이블 확장

```sql
-- 기존 User 테이블 확장
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'device'; -- device, email, social
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;

-- 인덱스 추가
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

### 2. 새로운 테이블 추가

#### 2.1 소셜 계정 연동
```sql
CREATE TABLE user_social_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- kakao, google, apple, naver
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(100),
    profile_image_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider ON user_social_accounts(provider, provider_id);
```

#### 2.2 2단계 인증
```sql
CREATE TABLE user_two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL, -- sms, email, totp
    secret VARCHAR(255), -- TOTP secret
    phone_number VARCHAR(20), -- SMS 인증용
    backup_codes TEXT[], -- 백업 코드 배열
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, method)
);

CREATE INDEX idx_2fa_user_id ON user_two_factor_auth(user_id);
```

#### 2.3 디바이스 관리
```sql
CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(20), -- ios, android, web
    fcm_token VARCHAR(255), -- 푸시 알림용
    last_used_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_devices_device_id ON user_devices(device_id);
```

#### 2.4 로그인 기록
```sql
CREATE TABLE user_login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    login_method VARCHAR(20), -- device, email, social
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX idx_login_logs_created_at ON user_login_logs(created_at);
CREATE INDEX idx_login_logs_ip_address ON user_login_logs(ip_address);
```

#### 2.5 이메일 인증
```sql
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(token)
);

CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
```

#### 2.6 비밀번호 재설정
```sql
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(token)
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
```

---

## 🔧 백엔드 구현

### 1. 서비스 레이어 구조

```
app/
├── services/
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── base_auth.py          # 공통 인증 로직
│   │   ├── device_auth.py        # 기존 디바이스 로그인
│   │   ├── email_auth.py         # 이메일 로그인
│   │   ├── social_auth.py        # 소셜 로그인
│   │   ├── two_factor_auth.py    # 2FA
│   │   └── migration.py          # 계정 마이그레이션
│   ├── email/
│   │   ├── __init__.py
│   │   ├── email_service.py      # 이메일 발송
│   │   └── templates/            # 이메일 템플릿
│   └── external/
│       ├── __init__.py
│       ├── kakao.py             # 카카오 로그인
│       ├── google.py            # 구글 로그인
│       ├── apple.py             # 애플 로그인
│       └── naver.py             # 네이버 로그인
```

### 2. 인증 서비스 기본 구조

```python
# app/services/auth/base_auth.py
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from app.models.user import User

class BaseAuthService(ABC):
    """인증 서비스 기본 클래스"""
    
    @abstractmethod
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """사용자 인증"""
        pass
    
    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """사용자 생성"""
        pass
    
    async def create_tokens(self, user: User) -> Dict[str, str]:
        """JWT 토큰 생성"""
        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    async def log_login_attempt(self, user_id: int, success: bool, **kwargs):
        """로그인 시도 기록"""
        # 로그인 로그 저장
        pass
```

### 3. 이메일 인증 서비스

```python
# app/services/auth/email_auth.py
from app.services.auth.base_auth import BaseAuthService
from app.utils.security import verify_password, get_password_hash
from app.services.email.email_service import EmailService

class EmailAuthService(BaseAuthService):
    
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """이메일/비밀번호 인증"""
        email = credentials.get("email")
        password = credentials.get("password")
        
        # 이메일로 사용자 찾기
        user = await self.get_user_by_email(email)
        if not user:
            return None
        
        # 비밀번호 확인
        if not verify_password(password, user.password_hash):
            await self.increment_login_attempts(user.id)
            return None
        
        # 계정 잠금 확인
        if await self.is_account_locked(user.id):
            return None
            
        # 로그인 성공 시 시도 횟수 리셋
        await self.reset_login_attempts(user.id)
        
        return user
    
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """이메일 계정 생성"""
        # 비밀번호 해싱
        password_hash = get_password_hash(user_data["password"])
        
        user = User(
            email=user_data["email"],
            password_hash=password_hash,
            username=user_data.get("username"),
            display_name=user_data.get("display_name"),
            profile_emoji=user_data.get("profile_emoji", "😊"),
            account_type="email"
        )
        
        # 이메일 인증 토큰 발송
        await self.send_verification_email(user)
        
        return user
    
    async def send_verification_email(self, user: User):
        """이메일 인증 발송"""
        token = generate_verification_token()
        
        # DB에 토큰 저장
        await self.save_verification_token(user.id, token)
        
        # 이메일 발송
        email_service = EmailService()
        await email_service.send_verification_email(
            user.email, 
            user.display_name, 
            token
        )
```

### 4. 소셜 로그인 서비스

```python
# app/services/auth/social_auth.py
from app.services.auth.base_auth import BaseAuthService
from app.services.external.kakao import KakaoService
from app.services.external.google import GoogleService

class SocialAuthService(BaseAuthService):
    
    def __init__(self):
        self.providers = {
            "kakao": KakaoService(),
            "google": GoogleService(),
            "apple": AppleService(),
            "naver": NaverService()
        }
    
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """소셜 로그인 인증"""
        provider = credentials.get("provider")
        access_token = credentials.get("access_token")
        
        if provider not in self.providers:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # 소셜 플랫폼에서 사용자 정보 조회
        social_user = await self.providers[provider].get_user_info(access_token)
        
        # 기존 소셜 계정 연동 확인
        social_account = await self.get_social_account(provider, social_user["id"])
        
        if social_account:
            # 기존 연동 계정
            return social_account.user
        
        # 이메일로 기존 계정 찾기
        if social_user.get("email"):
            existing_user = await self.get_user_by_email(social_user["email"])
            if existing_user:
                # 기존 계정에 소셜 연동
                await self.link_social_account(existing_user.id, provider, social_user)
                return existing_user
        
        # 신규 소셜 계정 생성
        return await self.create_social_user(provider, social_user)
    
    async def create_social_user(self, provider: str, social_user: Dict) -> User:
        """소셜 계정으로 신규 사용자 생성"""
        user = User(
            email=social_user.get("email"),
            display_name=social_user.get("name"),
            profile_emoji="😊",
            account_type="social",
            email_verified=True  # 소셜 로그인은 이메일 인증 완료로 처리
        )
        
        # 소셜 계정 연동 정보 저장
        await self.link_social_account(user.id, provider, social_user)
        
        return user
```

### 5. 계정 마이그레이션 서비스

```python
# app/services/auth/migration.py
class AccountMigrationService:
    
    async def migrate_device_to_email(
        self, 
        device_id: str, 
        email: str, 
        password: str
    ) -> User:
        """디바이스 계정을 이메일 계정으로 마이그레이션"""
        
        # 기존 디바이스 계정 찾기
        device_user = await self.get_user_by_device_id(device_id)
        if not device_user:
            raise ValueError("Device account not found")
        
        # 이메일 중복 확인
        existing_email_user = await self.get_user_by_email(email)
        if existing_email_user:
            raise ValueError("Email already registered")
        
        # 계정 업데이트
        device_user.email = email
        device_user.password_hash = get_password_hash(password)
        device_user.account_type = "email"
        device_user.email_verified = False
        
        # 이메일 인증 발송
        await self.send_verification_email(device_user)
        
        # 마이그레이션 완료 로그
        await self.log_migration(device_user.id, "device_to_email")
        
        return device_user
    
    async def link_social_to_existing(
        self, 
        user_id: int, 
        provider: str, 
        social_data: Dict
    ) -> bool:
        """기존 계정에 소셜 계정 연동"""
        
        # 중복 연동 확인
        existing_link = await self.get_social_account(provider, social_data["id"])
        if existing_link:
            raise ValueError("Social account already linked")
        
        # 소셜 계정 연동
        await self.create_social_account_link(user_id, provider, social_data)
        
        return True
```

---

## 📱 프론트엔드 구현

### 1. 인증 상태 관리 확장

```typescript
// src/store/authStore.ts 확장
interface AuthStore extends AuthState {
  // 기존 메서드들...
  
  // 새로운 메서드들
  emailLogin: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: string, accessToken: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enable2FA: (method: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  migrateAccount: (email: string, password: string) => Promise<void>;
  linkSocialAccount: (provider: string, token: string) => Promise<void>;
}
```

### 2. 소셜 로그인 SDK 래퍼

```typescript
// src/services/social/socialAuth.ts
export class SocialAuthService {
  
  async kakaoLogin(): Promise<KakaoLoginResult> {
    try {
      // Kakao SDK 초기화 확인
      if (!window.Kakao?.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
      }
      
      return new Promise((resolve, reject) => {
        window.Kakao.Auth.login({
          success: (authObj: any) => {
            resolve({
              provider: 'kakao',
              accessToken: authObj.access_token,
              refreshToken: authObj.refresh_token
            });
          },
          fail: (err: any) => {
            reject(new Error(`Kakao login failed: ${err.error_description}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Kakao login error: ${error.message}`);
    }
  }
  
  async googleLogin(): Promise<GoogleLoginResult> {
    // Google 로그인 구현
  }
  
  async appleLogin(): Promise<AppleLoginResult> {
    // Apple 로그인 구현 (iOS only)
  }
  
  async naverLogin(): Promise<NaverLoginResult> {
    // 네이버 로그인 구현
  }
}
```

### 3. 생체 인증 서비스

```typescript
// src/services/biometric/biometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricAuthService {
  
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }
  
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }
  
  async authenticate(reason: string): Promise<LocalAuthentication.LocalAuthenticationResult> {
    return await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: '취소',
      fallbackLabel: '비밀번호로 로그인',
      disableDeviceFallback: false
    });
  }
  
  async saveCredentialsSecurely(key: string, value: string): Promise<void> {
    // SecureStore를 사용한 안전한 저장
    await SecureStore.setItemAsync(key, value);
  }
  
  async getCredentialsSecurely(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }
}
```

---

## 🔒 보안 고려사항

### 1. 비밀번호 정책

```python
# app/utils/security.py 확장
import re
from typing import List

class PasswordValidator:
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """비밀번호 강도 검사"""
        issues = []
        score = 0
        
        # 길이 검사
        if len(password) < 8:
            issues.append("8자 이상 입력해주세요")
        else:
            score += 1
        
        # 복잡성 검사
        if not re.search(r"[a-z]", password):
            issues.append("소문자를 포함해주세요")
        else:
            score += 1
            
        if not re.search(r"[A-Z]", password):
            issues.append("대문자를 포함해주세요")
        else:
            score += 1
            
        if not re.search(r"\d", password):
            issues.append("숫자를 포함해주세요")
        else:
            score += 1
            
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            issues.append("특수문자를 포함해주세요")
        else:
            score += 1
        
        # 일반적인 패턴 검사
        common_patterns = [
            r"123", r"password", r"qwerty", 
            r"abc", r"admin", r"user"
        ]
        
        for pattern in common_patterns:
            if pattern in password.lower():
                issues.append("일반적인 패턴은 피해주세요")
                break
        
        return {
            "score": score,
            "max_score": 5,
            "issues": issues,
            "is_valid": len(issues) == 0 and score >= 3
        }
```

### 2. Rate Limiting

```python
# app/middleware/rate_limiting.py
from fastapi import Request, HTTPException
from app.services.cache.redis_service import RedisService

class RateLimitMiddleware:
    
    def __init__(self, redis: RedisService):
        self.redis = redis
    
    async def check_login_attempts(self, request: Request) -> bool:
        """로그인 시도 제한 확인"""
        ip = request.client.host
        email = request.json().get("email", "")
        
        # IP 기반 제한 (시간당 10회)
        ip_key = f"login_attempts:ip:{ip}"
        ip_attempts = await self.redis.get(ip_key) or 0
        
        if int(ip_attempts) >= 10:
            raise HTTPException(
                status_code=429, 
                detail="Too many login attempts. Try again later."
            )
        
        # 이메일 기반 제한 (시간당 5회)
        if email:
            email_key = f"login_attempts:email:{email}"
            email_attempts = await self.redis.get(email_key) or 0
            
            if int(email_attempts) >= 5:
                raise HTTPException(
                    status_code=429,
                    detail="Too many failed attempts for this account."
                )
        
        return True
    
    async def record_failed_attempt(self, request: Request):
        """실패한 로그인 시도 기록"""
        ip = request.client.host
        email = request.json().get("email", "")
        
        # IP 카운터 증가 (1시간 TTL)
        ip_key = f"login_attempts:ip:{ip}"
        await self.redis.incr(ip_key, expire=3600)
        
        # 이메일 카운터 증가 (1시간 TTL)
        if email:
            email_key = f"login_attempts:email:{email}"
            await self.redis.incr(email_key, expire=3600)
```

### 3. 토큰 보안

```python
# app/utils/security.py 토큰 관련 확장
import secrets
from datetime import datetime, timedelta

def create_refresh_token(data: dict) -> str:
    """리프레시 토큰 생성 (30일 만료)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def verify_refresh_token(token: str) -> Optional[dict]:
    """리프레시 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

def generate_verification_token() -> str:
    """이메일 인증 토큰 생성"""
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    """비밀번호 재설정 토큰 생성"""
    return secrets.token_urlsafe(32)
```

---

## 🧪 테스트 전략

### 1. 단위 테스트

```python
# tests/services/test_email_auth.py
import pytest
from app.services.auth.email_auth import EmailAuthService

class TestEmailAuth:
    
    @pytest.fixture
    async def email_auth_service(self):
        return EmailAuthService()
    
    async def test_authenticate_valid_credentials(self, email_auth_service):
        """올바른 자격증명으로 인증 테스트"""
        credentials = {
            "email": "test@example.com",
            "password": "ValidPassword123!"
        }
        
        user = await email_auth_service.authenticate(credentials)
        assert user is not None
        assert user.email == "test@example.com"
    
    async def test_authenticate_invalid_password(self, email_auth_service):
        """잘못된 비밀번호로 인증 테스트"""
        credentials = {
            "email": "test@example.com",
            "password": "WrongPassword"
        }
        
        user = await email_auth_service.authenticate(credentials)
        assert user is None
    
    async def test_account_lockout_after_failed_attempts(self, email_auth_service):
        """여러 번 실패 후 계정 잠금 테스트"""
        credentials = {
            "email": "test@example.com",
            "password": "WrongPassword"
        }
        
        # 5번 실패 시도
        for i in range(5):
            user = await email_auth_service.authenticate(credentials)
            assert user is None
        
        # 6번째 시도에서 계정 잠금
        with pytest.raises(AccountLockedException):
            await email_auth_service.authenticate(credentials)
```

### 2. 통합 테스트

```python
# tests/integration/test_auth_flow.py
class TestAuthenticationFlow:
    
    async def test_complete_registration_flow(self, client):
        """완전한 회원가입 플로우 테스트"""
        
        # 1. 회원가입
        response = await client.post("/v1/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "username": "newuser",
            "display_name": "New User"
        })
        assert response.status_code == 201
        
        # 2. 이메일 인증
        user_id = response.json()["user"]["id"]
        verification_token = await self.get_verification_token(user_id)
        
        response = await client.post(f"/v1/auth/verify-email", json={
            "token": verification_token
        })
        assert response.status_code == 200
        
        # 3. 로그인
        response = await client.post("/v1/auth/login", json={
            "email": "newuser@example.com",
            "password": "SecurePassword123!"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    async def test_social_login_flow(self, client, mock_kakao_api):
        """소셜 로그인 플로우 테스트"""
        
        # 1. 카카오 로그인 시도
        response = await client.post("/v1/auth/social-login", json={
            "provider": "kakao",
            "access_token": "mock_kakao_token"
        })
        assert response.status_code == 200
        
        # 2. 사용자 정보 확인
        user_data = response.json()["user"]
        assert user_data["account_type"] == "social"
        assert user_data["email_verified"] == True
    
    async def test_account_migration_flow(self, client, device_user):
        """계정 마이그레이션 플로우 테스트"""
        
        # 1. 디바이스 로그인
        response = await client.post("/v1/auth/login", json={
            "device_id": device_user.device_id
        })
        access_token = response.json()["access_token"]
        
        # 2. 계정 마이그레이션
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.post("/v1/auth/migrate-account", 
            json={
                "email": "upgraded@example.com",
                "password": "NewPassword123!"
            },
            headers=headers
        )
        assert response.status_code == 200
        
        # 3. 새로운 인증 정보로 로그인 가능 확인
        response = await client.post("/v1/auth/login", json={
            "email": "upgraded@example.com",
            "password": "NewPassword123!"
        })
        assert response.status_code == 200
```

### 3. 보안 테스트

```python
# tests/security/test_auth_security.py
class TestAuthSecurity:
    
    async def test_password_brute_force_protection(self, client):
        """비밀번호 브루트포스 공격 방어 테스트"""
        
        # 짧은 시간 내에 많은 실패 시도
        for i in range(10):
            response = await client.post("/v1/auth/login", json={
                "email": "test@example.com",
                "password": f"wrong_password_{i}"
            })
        
        # Rate limiting 확인
        response = await client.post("/v1/auth/login", json={
            "email": "test@example.com",
            "password": "another_wrong_password"
        })
        assert response.status_code == 429
    
    async def test_jwt_token_security(self, client, auth_headers):
        """JWT 토큰 보안 테스트"""
        
        # 유효한 토큰으로 접근
        response = await client.get("/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        
        # 변조된 토큰으로 접근
        tampered_token = auth_headers["Authorization"].replace("a", "b")
        tampered_headers = {"Authorization": tampered_token}
        
        response = await client.get("/v1/auth/me", headers=tampered_headers)
        assert response.status_code == 401
    
    async def test_social_token_validation(self, client, mock_social_apis):
        """소셜 로그인 토큰 검증 테스트"""
        
        # 유효하지 않은 소셜 토큰
        response = await client.post("/v1/auth/social-login", json={
            "provider": "kakao",
            "access_token": "invalid_token"
        })
        assert response.status_code == 401
        
        # 만료된 소셜 토큰
        response = await client.post("/v1/auth/social-login", json={
            "provider": "kakao", 
            "access_token": "expired_token"
        })
        assert response.status_code == 401
```

---

## 🚀 배포 및 모니터링

### 1. 환경 설정

```bash
# backend/.env.production
DATABASE_URL=postgresql://user:pass@prod-db:5432/circly_prod
REDIS_URL=redis://prod-redis:6379/0

# JWT 설정
SECRET_KEY=super-secure-production-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# 소셜 로그인 설정
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_PRIVATE_KEY=your_apple_private_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 이메일 서비스
EMAIL_SERVICE_API_KEY=your_email_service_key
SMS_SERVICE_API_KEY=your_sms_service_key

# 모니터링
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=WARNING
```

### 2. 모니터링 대시보드

```python
# app/utils/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# 인증 관련 메트릭
auth_login_attempts = Counter(
    'auth_login_attempts_total',
    'Total login attempts',
    ['method', 'status']
)

auth_login_duration = Histogram(
    'auth_login_duration_seconds',
    'Login duration',
    ['method']
)

auth_active_sessions = Gauge(
    'auth_active_sessions',
    'Number of active sessions'
)

social_login_attempts = Counter(
    'social_login_attempts_total',
    'Social login attempts',
    ['provider', 'status']
)

password_reset_requests = Counter(
    'password_reset_requests_total',
    'Password reset requests'
)

# 보안 관련 메트릭
security_suspicious_login_attempts = Counter(
    'security_suspicious_login_attempts_total',
    'Suspicious login attempts',
    ['reason']
)

security_account_lockouts = Counter(
    'security_account_lockouts_total',
    'Account lockouts'
)
```

### 3. 알림 설정

```yaml
# monitoring/alerts.yml
groups:
- name: authentication
  rules:
  - alert: HighFailedLoginRate
    expr: rate(auth_login_attempts_total{status="failed"}[5m]) > 10
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High failed login rate detected"
      
  - alert: SuspiciousLoginActivity
    expr: rate(security_suspicious_login_attempts_total[10m]) > 5
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Suspicious login activity detected"
      
  - alert: SocialLoginServiceDown
    expr: rate(social_login_attempts_total{status="error"}[5m]) > 0.5
    for: 3m
    labels:
      severity: critical
    annotations:
      summary: "Social login service appears to be down"
```

---

## 📋 마이그레이션 계획

### 1. 데이터베이스 마이그레이션

```python
# migrations/versions/add_extended_auth_system.py
"""Add extended authentication system

Revision ID: auth_system_v2
Revises: previous_migration
Create Date: 2025-01-20 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # User 테이블 확장
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True, unique=True))
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), default=False))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('account_type', sa.String(20), default='device'))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('login_attempts', sa.Integer(), default=0))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(), nullable=True))
    
    # 새 테이블들 생성
    op.create_table('user_social_accounts', ...)
    op.create_table('user_two_factor_auth', ...)
    op.create_table('user_devices', ...)
    op.create_table('user_login_logs', ...)
    op.create_table('email_verifications', ...)
    op.create_table('password_reset_tokens', ...)
    
    # 인덱스 생성
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_account_type', 'users', ['account_type'])

def downgrade():
    # 마이그레이션 롤백
    op.drop_table('password_reset_tokens')
    op.drop_table('email_verifications')
    op.drop_table('user_login_logs')
    op.drop_table('user_devices')
    op.drop_table('user_two_factor_auth')
    op.drop_table('user_social_accounts')
    
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'login_attempts')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'account_type')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email')
```

### 2. 점진적 배포 전략

**Phase 1: 백엔드 API 확장**
- 기존 디바이스 로그인 유지
- 새로운 인증 엔드포인트 추가
- 데이터베이스 마이그레이션 실행

**Phase 2: 프론트엔드 업데이트**
- 새로운 로그인 화면 구현
- 기존 사용자에게 마이그레이션 안내
- A/B 테스트로 점진적 적용

**Phase 3: 소셜 로그인 활성화**
- 소셜 로그인 SDK 통합
- 소셜 계정 연동 기능
- 친구 찾기 기능 (선택적)

**Phase 4: 고급 보안 기능**
- 2단계 인증 구현
- 생체 인증 연동
- 디바이스 관리 기능

---

## 🔄 향후 확장 계획

### 1. Enterprise 기능
- Single Sign-On (SSO) 연동
- Active Directory 통합
- 조직 계정 관리

### 2. 글로벌 확장
- Facebook, Twitter, Discord 로그인
- 다국어 이메일 템플릿
- 지역별 개인정보보호법 준수

### 3. AI 기반 보안
- 이상 로그인 패턴 감지
- 행동 기반 인증
- 자동 위험도 평가

---

**문서 버전**: v1.0  
**최종 업데이트**: 2025-01-20  
**검토자**: Backend Team Lead  
**승인자**: CTO

---

*이 문서는 개발 진행에 따라 지속적으로 업데이트됩니다.*