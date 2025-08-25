from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: Optional[str] = Field(None, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    profile_emoji: str = Field(default="😊", max_length=10)

class UserCreate(UserBase):
    device_id: str = Field(..., max_length=255)

class UserUpdate(UserBase):
    pass

class User(UserBase):
    id: int
    device_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: Optional[str]
    display_name: Optional[str]
    profile_emoji: str
    is_active: bool
    role: str
    created_at: datetime

    class Config:
        from_attributes = True