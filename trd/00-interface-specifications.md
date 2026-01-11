# Circly Interface Specifications

> Implementation-Ready TypeScript & Python Interfaces
>
> **Note**: 이 문서는 `docs/DSL.md`를 기반으로 작성되었습니다.
> 스키마 및 타입 정의의 Single Source of Truth는 DSL.md입니다.

---

## 1. Shared Type Definitions

### 1.1 Core Types (TypeScript)

```typescript
// types/common.ts

// UUID type alias
export type UUID = string;

// ISO 8601 date string
export type ISODateString = string;

// Pagination
export interface PaginationParams {
  limit?: number;  // default: 20, max: 100
  offset?: number; // default: 0
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// API Response Envelope (DSL.md 9. API 응답 표준 기준)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;  // e.g., "AUTH_REQUIRED", "CIRCLE_NOT_FOUND"
  message: string;
  details?: Record<string, string>;
}
```

### 1.2 Core Types (Python)

```python
# app/core/types.py
from datetime import datetime
from typing import TypeVar, Generic, Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int
    has_more: bool

class ApiError(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[ApiError] = None
```

---

## 2. Domain Models (DSL.md 기준)

### 2.1 User Domain

```typescript
// types/user.ts

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: UUID;
  email: string;
  username?: string;
  displayName?: string;
  profileEmoji: string;  // default: '😊'
  role: UserRole;
  isActive: boolean;
  pushToken?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface UserUpdate {
  username?: string;
  displayName?: string;
  profileEmoji?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  tokenType: string;  // "bearer"
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
}

export interface TokenPayload {
  sub: UUID;  // user_id
  exp: number;  // expiration timestamp
}
```

```python
# app/modules/auth/schemas.py
from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

UserRole = Literal['USER', 'ADMIN']

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    profile_emoji: Optional[str] = Field(None, max_length=10)

class UserResponse(BaseModel):
    id: UUID
    email: str
    username: Optional[str]
    display_name: Optional[str]
    profile_emoji: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

### 2.2 Circle Domain

```typescript
// types/circle.ts

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Circle {
  id: UUID;
  name: string;
  description?: string;
  inviteCode: string;  // 6자리 영숫자
  inviteLinkId: UUID;
  ownerId: UUID;
  maxMembers: number;  // default: 50
  memberCount: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CircleCreate {
  name: string;
  description?: string;
  maxMembers?: number;
}

export interface CircleUpdate {
  name?: string;
  description?: string;
  maxMembers?: number;
}

export interface CircleDetail {
  circle: Circle;
  members: MemberInfo[];
  activePolls: PollSummary[];
  myRole: MemberRole;
}

export interface CircleListItem {
  id: UUID;
  name: string;
  memberCount: number;
  activePollCount: number;
  myRole: MemberRole;
}

export interface Membership {
  id: UUID;
  circleId: UUID;
  userId: UUID;
  role: MemberRole;
  nickname: string;
  joinedAt: ISODateString;
}

export interface MemberInfo {
  userId: UUID;
  nickname: string;
  profileEmoji: string;
  role: MemberRole;
  joinedAt: ISODateString;
}

// Request types
export interface JoinCircleByCodeRequest {
  code: string;
  nickname: string;
}

export interface JoinCircleByLinkRequest {
  nickname: string;
}
```

```python
# app/modules/circles/schemas.py
from datetime import datetime
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re

MemberRole = Literal['OWNER', 'ADMIN', 'MEMBER']

class CircleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    max_members: int = Field(default=50, ge=10, le=50)

class CircleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    max_members: Optional[int] = Field(None, ge=10, le=50)

class CircleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    invite_code: str
    invite_link_id: UUID
    owner_id: UUID
    max_members: int
    member_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MemberInfoResponse(BaseModel):
    user_id: UUID
    nickname: str
    profile_emoji: str
    role: MemberRole
    joined_at: datetime

class CircleDetailResponse(BaseModel):
    circle: CircleResponse
    members: List[MemberInfoResponse]
    active_polls: List['PollSummaryResponse']
    my_role: MemberRole

class CircleListItemResponse(BaseModel):
    id: UUID
    name: str
    member_count: int
    active_poll_count: int
    my_role: MemberRole

class JoinCircleByCodeRequest(BaseModel):
    code: str = Field(..., pattern=r'^[A-Z0-9]{6}$')
    nickname: str = Field(..., min_length=1, max_length=50)

    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if re.search(r'[<>\"\'&]', v):
            raise ValueError('Nickname contains invalid characters')
        return v

class JoinCircleByLinkRequest(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
```

### 2.3 Poll Domain

```typescript
// types/poll.ts

export type TemplateCategory = 'APPEARANCE' | 'PERSONALITY' | 'TALENT' | 'SPECIAL';
export type PollStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PollDuration = '1H' | '3H' | '6H' | '24H';

export interface PollTemplate {
  id: UUID;
  category: TemplateCategory;
  questionText: string;
  emoji?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: ISODateString;
}

export interface Poll {
  id: UUID;
  circleId: UUID;
  templateId: UUID;
  creatorId: UUID;
  questionText: string;
  status: PollStatus;
  endsAt: ISODateString;
  voteCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PollDetail {
  poll: Poll;
  template: PollTemplate;
  options: VoteOption[];  // Circle 멤버들 (투표 생성자 제외)
  hasVoted: boolean;
  results?: PollResultItem[];  // 투표 후 또는 종료 후에만
  timeRemaining: number;  // seconds
}

export interface PollListItem {
  id: UUID;
  questionText: string;
  emoji?: string;
  status: PollStatus;
  voteCount: number;
  endsAt: ISODateString;
  hasVoted: boolean;
}

export interface VoteOption {
  userId: UUID;
  nickname: string;
  profileEmoji: string;
}

// 투표 익명성 보장: voter_id 직접 저장 금지
export interface Vote {
  id: UUID;
  pollId: UUID;
  voterHash: string;  // SHA-256(voter_id + poll_id + salt)
  votedForId: UUID;
  createdAt: ISODateString;
}

export interface PollResult {
  id: UUID;
  pollId: UUID;
  userId: UUID;
  voteCount: number;
  votePercentage: number;
  rank: number;
}

export interface PollResultItem {
  userId: UUID;
  nickname: string;
  profileEmoji: string;
  voteCount: number;
  votePercentage: number;
  rank: number;
}

export interface VoteResponse {
  success: boolean;
  results: PollResultItem[];
  message: string;
}

// Request types
export interface CreatePollRequest {
  templateId: UUID;
  duration: PollDuration;
}

export interface VoteRequest {
  votedForId: UUID;
}
```

```python
# app/modules/polls/schemas.py
from datetime import datetime
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field

TemplateCategory = Literal['APPEARANCE', 'PERSONALITY', 'TALENT', 'SPECIAL']
PollStatus = Literal['ACTIVE', 'COMPLETED', 'CANCELLED']
PollDuration = Literal['1H', '3H', '6H', '24H']

class PollTemplateResponse(BaseModel):
    id: UUID
    category: TemplateCategory
    question_text: str
    emoji: Optional[str]
    is_active: bool
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class VoteOptionResponse(BaseModel):
    user_id: UUID
    nickname: str
    profile_emoji: str

class PollResponse(BaseModel):
    id: UUID
    circle_id: UUID
    template_id: UUID
    creator_id: UUID
    question_text: str
    status: PollStatus
    ends_at: datetime
    vote_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PollResultItemResponse(BaseModel):
    user_id: UUID
    nickname: str
    profile_emoji: str
    vote_count: int
    vote_percentage: float
    rank: int

class PollDetailResponse(BaseModel):
    poll: PollResponse
    template: PollTemplateResponse
    options: List[VoteOptionResponse]
    has_voted: bool
    results: Optional[List[PollResultItemResponse]] = None
    time_remaining: int  # seconds

class PollListItemResponse(BaseModel):
    id: UUID
    question_text: str
    emoji: Optional[str]
    status: PollStatus
    vote_count: int
    ends_at: datetime
    has_voted: bool

class CreatePollRequest(BaseModel):
    template_id: UUID
    duration: PollDuration

class VoteRequest(BaseModel):
    voted_for_id: UUID

class VoteResponse(BaseModel):
    success: bool
    results: List[PollResultItemResponse]
    message: str
```

### 2.4 Notification Domain

```typescript
// types/notification.ts

export type NotificationType =
  | 'POLL_STARTED'
  | 'POLL_REMINDER'
  | 'POLL_ENDED'
  | 'VOTE_RECEIVED'
  | 'CIRCLE_INVITE';

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    pollId?: UUID;
    circleId?: UUID;
  };
  isRead: boolean;
  sentAt?: ISODateString;
  createdAt: ISODateString;
}

export interface NotificationCreate {
  userId: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushPayload {
  to: string;  // Expo push token
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound?: string;
  badge?: number;
}
```

```python
# app/modules/notifications/schemas.py
from datetime import datetime
from typing import Optional, Literal, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel

NotificationType = Literal[
    'POLL_STARTED',
    'POLL_REMINDER',
    'POLL_ENDED',
    'VOTE_RECEIVED',
    'CIRCLE_INVITE'
]

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int

class PushPayload(BaseModel):
    to: str
    title: str
    body: str
    data: Dict[str, Any]
    sound: Optional[str] = None
    badge: Optional[int] = None
```

### 2.5 Report Domain

```typescript
// types/report.ts

export type ReportTargetType = 'USER' | 'CIRCLE' | 'POLL';
export type ReportReason = 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
export type ReviewAction = 'RESOLVE' | 'DISMISS' | 'BAN_USER' | 'DELETE_CONTENT';

export interface Report {
  id: UUID;
  reporterId: UUID;
  targetType: ReportTargetType;
  targetId: UUID;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: UUID;
  reviewedAt?: ISODateString;
  createdAt: ISODateString;
}

export interface ReportCreate {
  targetType: ReportTargetType;
  targetId: UUID;
  reason: ReportReason;
  description?: string;
}
```

```python
# app/modules/reports/schemas.py
from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel

ReportTargetType = Literal['USER', 'CIRCLE', 'POLL']
ReportReason = Literal['INAPPROPRIATE', 'SPAM', 'HARASSMENT', 'OTHER']
ReportStatus = Literal['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']
ReviewAction = Literal['RESOLVE', 'DISMISS', 'BAN_USER', 'DELETE_CONTENT']

class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: UUID
    reason: ReportReason
    description: Optional[str] = None

class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    target_type: ReportTargetType
    target_id: UUID
    reason: ReportReason
    description: Optional[str]
    status: ReportStatus
    reviewed_by: Optional[UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
```

---

## 3. Service Interfaces

> 상세 서비스 인터페이스는 `docs/DSL.md`의 모듈 정의를 참조하세요.

### 3.1 Auth Service

```python
# app/modules/auth/service.py
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

class IAuthService(ABC):
    @abstractmethod
    async def register(self, email: str, password: str, username: Optional[str] = None) -> 'AuthResponse':
        """회원가입"""
        ...

    @abstractmethod
    async def login(self, email: str, password: str) -> 'TokenResponse':
        """로그인"""
        ...

    @abstractmethod
    async def get_current_user(self, token: str) -> 'UserResponse':
        """현재 사용자 조회"""
        ...

    @abstractmethod
    async def update_profile(self, user_id: UUID, data: 'UserUpdate') -> 'UserResponse':
        """Profile 업데이트"""
        ...

    @abstractmethod
    async def logout(self, user_id: UUID) -> None:
        """로그아웃"""
        ...
```

### 3.2 Circle Service

```python
# app/modules/circles/service.py
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

class ICircleService(ABC):
    @abstractmethod
    async def create_circle(self, owner_id: UUID, name: str, description: Optional[str] = None, max_members: int = 50) -> 'CircleResponse':
        """Circle 생성"""
        ...

    @abstractmethod
    async def get_circle(self, circle_id: UUID) -> 'CircleDetailResponse':
        """Circle 상세 조회"""
        ...

    @abstractmethod
    async def get_user_circles(self, user_id: UUID) -> List['CircleListItemResponse']:
        """사용자 Circle 목록"""
        ...

    @abstractmethod
    async def join_by_code(self, user_id: UUID, code: str, nickname: str) -> 'Membership':
        """코드로 참여"""
        ...

    @abstractmethod
    async def join_by_link(self, user_id: UUID, link_id: UUID, nickname: str) -> 'Membership':
        """링크로 참여"""
        ...

    @abstractmethod
    async def leave_circle(self, circle_id: UUID, user_id: UUID) -> None:
        """Circle 탈퇴"""
        ...

    @abstractmethod
    async def regenerate_invite_code(self, circle_id: UUID, user_id: UUID) -> str:
        """초대 코드 재생성"""
        ...
```

### 3.3 Poll Service

```python
# app/modules/polls/service.py
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

class IPollService(ABC):
    @abstractmethod
    async def get_templates(self, category: Optional[str] = None) -> List['PollTemplateResponse']:
        """템플릿 목록"""
        ...

    @abstractmethod
    async def create_poll(self, circle_id: UUID, creator_id: UUID, template_id: UUID, duration: str) -> 'PollResponse':
        """투표 생성"""
        ...

    @abstractmethod
    async def get_poll(self, poll_id: UUID, user_id: UUID) -> 'PollDetailResponse':
        """투표 상세 조회"""
        ...

    @abstractmethod
    async def vote(self, poll_id: UUID, voter_id: UUID, voted_for_id: UUID) -> 'VoteResponse':
        """투표 참여"""
        ...

    @abstractmethod
    async def get_results(self, poll_id: UUID) -> List['PollResultItemResponse']:
        """결과 조회"""
        ...

    @abstractmethod
    async def close_poll(self, poll_id: UUID) -> None:
        """투표 종료"""
        ...
```

### 3.4 Notification Service

```python
# app/modules/notifications/service.py
from abc import ABC, abstractmethod
from typing import List
from uuid import UUID

class INotificationService(ABC):
    @abstractmethod
    async def send_poll_started(self, poll_id: UUID, circle_members: List[UUID]) -> None:
        """투표 시작 알림"""
        ...

    @abstractmethod
    async def send_poll_reminder(self, poll_id: UUID, non_voters: List[UUID]) -> None:
        """투표 리마인더"""
        ...

    @abstractmethod
    async def send_poll_ended(self, poll_id: UUID, circle_members: List[UUID]) -> None:
        """투표 종료 알림"""
        ...

    @abstractmethod
    async def get_notifications(self, user_id: UUID, limit: int = 20, offset: int = 0) -> 'NotificationListResponse':
        """알림 목록"""
        ...

    @abstractmethod
    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> None:
        """읽음 처리"""
        ...
```

---

## 4. Error Types

### 4.1 Error Codes (DSL.md 기준)

```python
# app/core/exceptions.py
from typing import Optional, Dict, Any

class CirclyException(Exception):
    """Base exception"""
    code: str = "INTERNAL_ERROR"
    message: str = "서버 오류가 발생했습니다"
    status_code: int = 500

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message or self.__class__.message
        self.details = details or {}
        super().__init__(self.message)


# Auth Errors
class AuthRequired(CirclyException):
    code = "AUTH_REQUIRED"
    message = "인증이 필요합니다"
    status_code = 401

class InvalidCredentials(CirclyException):
    code = "INVALID_CREDENTIALS"
    message = "잘못된 인증 정보입니다"
    status_code = 401

class TokenExpired(CirclyException):
    code = "TOKEN_EXPIRED"
    message = "토큰이 만료되었습니다"
    status_code = 401


# Circle Errors
class CircleNotFound(CirclyException):
    code = "CIRCLE_NOT_FOUND"
    message = "Circle을 찾을 수 없습니다"
    status_code = 404

class InvalidInviteCode(CirclyException):
    code = "INVALID_INVITE_CODE"
    message = "유효하지 않은 초대 코드입니다"
    status_code = 400

class CircleFull(CirclyException):
    code = "CIRCLE_FULL"
    message = "Circle 멤버 수가 초과되었습니다"
    status_code = 400

class AlreadyMember(CirclyException):
    code = "ALREADY_MEMBER"
    message = "이미 가입된 Circle입니다"
    status_code = 409


# Poll Errors
class PollNotFound(CirclyException):
    code = "POLL_NOT_FOUND"
    message = "투표를 찾을 수 없습니다"
    status_code = 404

class PollEnded(CirclyException):
    code = "POLL_ENDED"
    message = "투표가 종료되었습니다"
    status_code = 400

class AlreadyVoted(CirclyException):
    code = "ALREADY_VOTED"
    message = "이미 투표에 참여하셨습니다"
    status_code = 409

class SelfVoteNotAllowed(CirclyException):
    code = "SELF_VOTE_NOT_ALLOWED"
    message = "자기 자신에게 투표할 수 없습니다"
    status_code = 400

class MaxPollsExceeded(CirclyException):
    code = "MAX_POLLS_EXCEEDED"
    message = "동시 진행 가능한 투표 수를 초과했습니다"
    status_code = 400


# General Errors
class ValidationError(CirclyException):
    code = "VALIDATION_ERROR"
    message = "입력값 검증 실패"
    status_code = 400

class NotFound(CirclyException):
    code = "NOT_FOUND"
    message = "리소스를 찾을 수 없습니다"
    status_code = 404

class Forbidden(CirclyException):
    code = "FORBIDDEN"
    message = "접근 권한이 없습니다"
    status_code = 403
```

---

## 5. Event Contracts

> 이벤트 시스템 상세는 `docs/DSL.md` 섹션 4를 참조하세요.

```python
# app/core/events.py
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

@dataclass
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)

# Circle Events
@dataclass
class CircleCreated(DomainEvent):
    circle_id: UUID
    owner_id: UUID
    name: str

@dataclass
class MemberJoined(DomainEvent):
    circle_id: UUID
    user_id: UUID
    nickname: str

@dataclass
class MemberLeft(DomainEvent):
    circle_id: UUID
    user_id: UUID

# Poll Events
@dataclass
class PollCreated(DomainEvent):
    poll_id: UUID
    circle_id: UUID
    creator_id: UUID
    question_text: str
    ends_at: datetime

@dataclass
class VoteCast(DomainEvent):
    poll_id: UUID
    voted_for_id: UUID

@dataclass
class PollEnded(DomainEvent):
    poll_id: UUID
    circle_id: UUID
    results: list
```

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Created | 2024-12-02 |
| Updated | 2024-12-02 |
| Status | Implementation Ready |
| Source of Truth | docs/DSL.md |
