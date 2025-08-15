from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .user import UserResponse

class CircleBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None

class CircleCreate(CircleBase):
    pass

class CircleUpdate(CircleBase):
    name: Optional[str] = Field(None, max_length=100)

class Circle(CircleBase):
    id: int
    invite_code: str
    creator_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CircleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    invite_code: str
    creator_id: int
    is_active: bool
    created_at: datetime
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CircleMemberBase(BaseModel):
    role: str = Field(default="member", pattern="^(admin|member)$")

class CircleMemberCreate(CircleMemberBase):
    circle_id: int
    user_id: int

class CircleMember(CircleMemberBase):
    id: int
    circle_id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class CircleJoinRequest(BaseModel):
    invite_code: str = Field(..., max_length=20)