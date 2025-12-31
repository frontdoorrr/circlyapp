"""Pydantic schemas for authentication module."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    username: str | None = Field(None, min_length=2, max_length=50)
    display_name: str | None = Field(None, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    username: str | None = Field(None, min_length=2, max_length=50)
    display_name: str | None = Field(None, max_length=100)
    profile_emoji: str | None = Field(None, max_length=10)


class UserResponse(BaseModel):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    supabase_user_id: str | None
    username: str | None
    display_name: str | None
    profile_emoji: str
    role: str
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Schema for authentication response (register/login)."""

    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: uuid.UUID  # user_id
    exp: datetime


class PushTokenUpdate(BaseModel):
    """Schema for updating push notification token."""

    push_token: str = Field(..., min_length=1)
