# Backend Architecture - FastAPI 백엔드 기술 구현 상세서

## FastAPI 백엔드 아키텍처

### 1. 프로젝트 설정 및 의존성

#### 1.1 Python 버전 및 핵심 패키지
```
Python 3.13.3
uv (패키지 매니저)
```

```toml
# pyproject.toml
[project]
name = "circly-backend"
version = "1.0.0"
description = "Circly Backend API"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.104.1",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "sqlalchemy>=2.0.23",
    "alembic>=1.12.1",
    "asyncpg>=0.29.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "httpx>=0.25.2",
    "celery[redis]>=5.3.4",
    "redis>=5.0.1",
    "supabase>=2.0.2",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.3",
    "pytest-asyncio>=0.21.1",
    "pytest-cov>=4.1.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.7.0",
]
```

#### 1.2 프로젝트 구조
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 인스턴스
│   ├── config.py            # 환경 설정
│   ├── database.py          # DB 연결 설정
│   ├── dependencies.py      # 의존성 주입
│   │
│   ├── models/              # SQLAlchemy 모델
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── circle.py
│   │   ├── poll.py
│   │   └── vote.py
│   │
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── circle.py
│   │   ├── poll.py
│   │   └── response.py
│   │
│   ├── api/                 # API 라우터
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── circles.py
│   │   │   ├── polls.py
│   │   │   └── users.py
│   │   └── deps.py          # API 의존성
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── circle_service.py
│   │   ├── poll_service.py
│   │   ├── notification_service.py
│   │   └── image_service.py
│   │
│   ├── utils/               # 유틸리티 함수
│   │   ├── __init__.py
│   │   ├── security.py      # JWT, 암호화
│   │   ├── helpers.py       # 일반 헬퍼 함수
│   │   └── validators.py    # 데이터 검증
│   │
│   └── tasks/               # Celery 백그라운드 작업
│       ├── __init__.py
│       ├── notifications.py
│       └── cleanup.py
│
├── migrations/              # Alembic 마이그레이션
├── tests/                   # 테스트 코드
├── docker/                  # Docker 설정
├── scripts/                 # 유틸리티 스크립트
├── requirements.txt
├── requirements-dev.txt     # 개발용 추가 패키지
├── Dockerfile
├── Dockerfile.prod          # 프로덕션용 Dockerfile
└── docker-compose.yml
```

### 2. 환경 설정 (config.py)

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 앱 설정
    app_name: str = "Circly API"
    debug: bool = False
    version: str = "1.0.0"
    
    # 데이터베이스
    database_url: str
    database_url_sync: str
    
    # JWT 설정
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7일
    
    # Supabase 설정
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    
    # Redis 설정 (Celery)
    redis_url: str = "redis://localhost:6379/0"
    
    # 푸시 알림 설정
    expo_access_token: str
    
    # 파일 업로드 설정
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_image_types: list = ["image/jpeg", "image/png"]
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600  # 1시간
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 3. 데이터베이스 모델 (SQLAlchemy)

#### 3.1 User 모델
```python
# models/user.py
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(String(255), unique=True, index=True)
    push_token = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    circle_memberships = relationship("CircleMember", back_populates="user")
    created_polls = relationship("Poll", back_populates="creator")
    votes = relationship("Vote", back_populates="user")
```

#### 3.2 Circle 모델
```python
# models/circle.py
class Circle(Base):
    __tablename__ = "circles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(6), unique=True, index=True)
    invite_link_id = Column(String(255), unique=True, index=True)
    max_members = Column(Integer, default=50)
    expires_at = Column(DateTime)  # 24시간 후 만료
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    creator = relationship("User")
    members = relationship("CircleMember", back_populates="circle")
    polls = relationship("Poll", back_populates="circle")

class CircleMember(Base):
    __tablename__ = "circle_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id = Column(UUID(as_uuid=True), ForeignKey("circles.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    nickname = Column(String(20), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    circle = relationship("Circle", back_populates="members")
    user = relationship("User", back_populates="circle_memberships")
    
    __table_args__ = (UniqueConstraint('circle_id', 'user_id', name='unique_circle_user'),)
```

#### 3.3 Poll & Vote 모델
```python
# models/poll.py
class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id = Column(UUID(as_uuid=True), ForeignKey("circles.id"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    question = Column(Text, nullable=False)
    deadline = Column(DateTime, nullable=False)
    is_anonymous = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    circle = relationship("Circle", back_populates="polls")
    creator = relationship("User", back_populates="created_polls")
    options = relationship("PollOption", back_populates="poll")
    votes = relationship("Vote", back_populates="poll")

class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id"))
    text = Column(String(100), nullable=False)
    order = Column(Integer, nullable=False)
    
    # Relationships
    poll = relationship("Poll", back_populates="options")
    votes = relationship("Vote", back_populates="option")

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id"))
    option_id = Column(UUID(as_uuid=True), ForeignKey("poll_options.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # 익명성을 위해 암호화된 해시 저장
    vote_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User", back_populates="votes")
    
    __table_args__ = (UniqueConstraint('poll_id', 'user_id', name='unique_poll_user_vote'),)
```

### 4. API 라우터 설계

#### 4.1 인증 API
```python
# api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/device-login", response_model=Token)
async def device_login(
    device_id: str,
    db: AsyncSession = Depends(get_db)
):
    """디바이스 ID 기반 익명 로그인"""
    auth_service = AuthService(db)
    token = await auth_service.authenticate_device(device_id)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )
    return token

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """토큰 갱신"""
    auth_service = AuthService(db)
    return await auth_service.refresh_token(current_user)
```

#### 4.2 Circle 관리 API
```python
# api/v1/circles.py
@router.post("/", response_model=CircleResponse)
async def create_circle(
    circle_data: CircleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """새 Circle 생성"""
    circle_service = CircleService(db)
    return await circle_service.create_circle(circle_data, current_user.id)

@router.post("/join", response_model=CircleResponse)
async def join_circle(
    join_data: CircleJoin,  # code 또는 invite_link_id
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 참여 (코드 또는 링크로)"""
    circle_service = CircleService(db)
    return await circle_service.join_circle(join_data, current_user.id)

@router.get("/{circle_id}/members", response_model=List[MemberResponse])
async def get_circle_members(
    circle_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 멤버 목록"""
    circle_service = CircleService(db)
    return await circle_service.get_members(circle_id, current_user.id)
```

#### 4.3 Question Template API (새로 추가)
```python
# api/v1/templates.py
@router.get("/", response_model=List[QuestionTemplateResponse])
async def get_question_templates(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """질문 템플릿 목록 조회"""
    template_service = TemplateService(db)
    return await template_service.get_templates(category)

@router.get("/popular", response_model=List[QuestionTemplateResponse])
async def get_popular_templates(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """인기 질문 템플릿 조회"""
    template_service = TemplateService(db)
    return await template_service.get_popular_templates(limit)
```

#### 4.4 Poll API (수정됨)
```python
# api/v1/polls.py
@router.post("/", response_model=PollResponse)
async def create_poll(
    poll_data: PollCreateFromTemplate,  # 템플릿 기반 생성
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """템플릿 기반 투표 생성"""
    poll_service = PollService(db)
    poll = await poll_service.create_poll_from_template(
        poll_data.template_id, 
        poll_data.circle_id,
        poll_data.deadline,
        current_user.id
    )
    
    # 백그라운드에서 알림 발송
    background_tasks.add_task(
        send_poll_start_notification, 
        poll.id, poll.circle_id
    )
    
    return poll

@router.post("/{poll_id}/vote", response_model=VoteResponse)
async def vote_poll(
    poll_id: UUID,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """투표 참여"""
    poll_service = PollService(db)
    return await poll_service.vote(poll_id, vote_data.option_id, current_user.id)

@router.get("/{poll_id}/results", response_model=PollResultResponse)
async def get_poll_results(
    poll_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """투표 결과 조회"""
    poll_service = PollService(db)
    return await poll_service.get_results(poll_id, current_user.id)
```

### 5. 비즈니스 로직 서비스

#### 5.1 Template Service (새로 추가)
```python
# services/template_service.py
class TemplateService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_templates(self, category: Optional[str] = None) -> List[QuestionTemplate]:
        query = select(QuestionTemplate).where(QuestionTemplate.is_active == True)
        if category:
            query = query.where(QuestionTemplate.category == category)
        
        result = await self.db.execute(query.order_by(QuestionTemplate.usage_count.desc()))
        return result.scalars().all()
    
    async def get_popular_templates(self, limit: int = 10) -> List[QuestionTemplate]:
        result = await self.db.execute(
            select(QuestionTemplate)
            .where(QuestionTemplate.is_active == True)
            .order_by(QuestionTemplate.usage_count.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def increment_usage(self, template_id: UUID):
        """템플릿 사용 횟수 증가"""
        await self.db.execute(
            update(QuestionTemplate)
            .where(QuestionTemplate.id == template_id)
            .values(usage_count=QuestionTemplate.usage_count + 1)
        )
        await self.db.commit()
```

#### 5.2 Poll Service (수정됨)
```python
# services/poll_service.py
class PollService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_poll_from_template(
        self, 
        template_id: UUID, 
        circle_id: UUID,
        deadline: datetime,
        creator_id: UUID
    ) -> Poll:
        # Circle 멤버십 검증
        membership = await self.db.execute(
            select(CircleMember).where(
                CircleMember.circle_id == circle_id,
                CircleMember.user_id == creator_id,
                CircleMember.is_active == True
            )
        )
        if not membership.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not a member of this circle")
        
        # 템플릿 조회
        template = await self.db.get(QuestionTemplate, template_id)
        if not template or not template.is_active:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # 투표 생성
        poll = Poll(
            circle_id=circle_id,
            creator_id=creator_id,
            template_id=template_id,
            question_text=template.question_text,
            deadline=deadline
        )
        self.db.add(poll)
        await self.db.flush()
        
        # Circle 멤버들을 선택지로 자동 생성 (생성자 제외)
        members = await self.db.execute(
            select(CircleMember).where(
                CircleMember.circle_id == circle_id,
                CircleMember.user_id != creator_id,  # 생성자 제외
                CircleMember.is_active == True
            ).order_by(CircleMember.joined_at)
        )
        
        for i, member in enumerate(members.scalars().all()):
            option = PollOption(
                poll_id=poll.id,
                member_id=member.id,
                member_nickname=member.nickname,
                display_order=i
            )
            self.db.add(option)
        
        # 템플릿 사용 횟수 증가
        template_service = TemplateService(self.db)
        await template_service.increment_usage(template_id)
        
        await self.db.commit()
        await self.db.refresh(poll)
        
        # 마감 알림 스케줄링
        await self.schedule_deadline_notifications(poll.id)
        
        return poll
    
    async def vote(self, poll_id: UUID, option_id: UUID, user_id: UUID) -> Vote:
        # 중복 투표 검증
        existing_vote = await self.db.execute(
            select(Vote).where(
                Vote.poll_id == poll_id,
                Vote.user_id == user_id
            )
        )
        if existing_vote.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Already voted")
        
        # 투표 저장 (익명성을 위한 해시 생성)
        vote_hash = self.generate_anonymous_hash(poll_id, user_id, option_id)
        vote = Vote(
            poll_id=poll_id,
            option_id=option_id,
            user_id=user_id,
            vote_hash=vote_hash
        )
        
        self.db.add(vote)
        await self.db.commit()
        
        return vote
    
    def generate_anonymous_hash(self, poll_id: UUID, user_id: UUID, option_id: UUID) -> str:
        """익명성 보장을 위한 해시 생성"""
        import hashlib
        import secrets
        
        # 솔트 추가하여 역추적 불가능하게
        salt = secrets.token_hex(16)
        data = f"{poll_id}:{user_id}:{option_id}:{salt}"
        return hashlib.sha256(data.encode()).hexdigest()
```

### 6. 백그라운드 작업 (Celery)

#### 6.1 알림 발송 작업
```python
# tasks/notifications.py
from celery import Celery
from app.services.notification_service import NotificationService

celery_app = Celery('circly', broker=settings.redis_url)

@celery_app.task
async def send_poll_start_notification(poll_id: str, circle_id: str):
    """투표 시작 알림 발송"""
    async with AsyncSession(engine) as db:
        notification_service = NotificationService(db)
        await notification_service.send_poll_start_notification(poll_id, circle_id)

@celery_app.task
async def send_deadline_reminder(poll_id: str, reminder_type: str):
    """마감 임박 알림 (1시간 전, 10분 전)"""
    async with AsyncSession(engine) as db:
        notification_service = NotificationService(db)
        await notification_service.send_deadline_reminder(poll_id, reminder_type)

@celery_app.task
async def send_poll_result_notification(poll_id: str):
    """투표 결과 알림 발송"""
    async with AsyncSession(engine) as db:
        notification_service = NotificationService(db)
        await notification_service.send_result_notification(poll_id)
```

### 7. 보안 및 인증

#### 7.1 JWT 토큰 관리
```python
# utils/security.py
from jose import JWTError, jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.secret_key, 
        algorithm=settings.algorithm
    )
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
```

### 8. 실시간 업데이트 (WebSocket)

```python
# api/v1/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, poll_id: str):
        await websocket.accept()
        if poll_id not in self.active_connections:
            self.active_connections[poll_id] = []
        self.active_connections[poll_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, poll_id: str):
        if poll_id in self.active_connections:
            self.active_connections[poll_id].remove(websocket)
    
    async def broadcast_poll_update(self, poll_id: str, data: dict):
        if poll_id in self.active_connections:
            for connection in self.active_connections[poll_id]:
                await connection.send_json(data)

manager = ConnectionManager()

@router.websocket("/polls/{poll_id}/live")
async def websocket_endpoint(websocket: WebSocket, poll_id: str):
    await manager.connect(websocket, poll_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, poll_id)
```

## 개발 우선순위
1. **Phase 1**: 기본 API 엔드포인트 및 데이터베이스 모델
2. **Phase 2**: 인증 시스템 및 보안 구현
3. **Phase 3**: 백그라운드 작업 및 알림 시스템
4. **Phase 4**: 실시간 업데이트 및 성능 최적화