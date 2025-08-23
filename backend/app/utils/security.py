from datetime import datetime, timedelta
from typing import Optional, Dict, List
import secrets
import re
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """리프레시 토큰 생성 (30일 만료)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def verify_token(token: str) -> Optional[dict]:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

def verify_refresh_token(token: str) -> Optional[dict]:
    """리프레시 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def get_device_hash(device_id: str) -> str:
    """디바이스 ID 해시 생성"""
    return pwd_context.hash(device_id)

def verify_device_id(device_id: str, hashed_device_id: str) -> bool:
    """디바이스 ID 검증"""
    return pwd_context.verify(device_id, hashed_device_id)

def generate_verification_token() -> str:
    """이메일 인증 토큰 생성"""
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    """비밀번호 재설정 토큰 생성"""
    return secrets.token_urlsafe(32)

def generate_2fa_secret() -> str:
    """2FA TOTP 시크릿 생성"""
    return secrets.token_hex(16)

def generate_backup_codes(count: int = 10) -> List[str]:
    """2FA 백업 코드 생성"""
    return [secrets.token_hex(4) for _ in range(count)]

def validate_password_strength(password: str) -> Dict[str, any]:
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

def is_email_valid(email: str) -> bool:
    """이메일 형식 검증"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_phone_number_valid(phone: str) -> bool:
    """전화번호 형식 검증 (한국)"""
    pattern = r'^01[016789]-?\d{3,4}-?\d{4}$'
    return re.match(pattern, phone) is not None

def sanitize_user_agent(user_agent: str) -> str:
    """User-Agent 문자열 정제"""
    if not user_agent:
        return "Unknown"
    
    # 길이 제한
    if len(user_agent) > 500:
        user_agent = user_agent[:500]
    
    # 특수 문자 제거
    sanitized = re.sub(r'[<>"\']', '', user_agent)
    
    return sanitized

def extract_device_info(user_agent: str) -> Dict[str, str]:
    """User-Agent에서 디바이스 정보 추출"""
    user_agent = user_agent.lower()
    
    device_type = "web"
    if "mobile" in user_agent or "android" in user_agent:
        device_type = "android"
    elif "iphone" in user_agent or "ipad" in user_agent:
        device_type = "ios"
    
    # 브라우저 정보 추출
    browser = "Unknown"
    if "chrome" in user_agent:
        browser = "Chrome"
    elif "firefox" in user_agent:
        browser = "Firefox"
    elif "safari" in user_agent and "chrome" not in user_agent:
        browser = "Safari"
    elif "edge" in user_agent:
        browser = "Edge"
    
    return {
        "device_type": device_type,
        "browser": browser
    }