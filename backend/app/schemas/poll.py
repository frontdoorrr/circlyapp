from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .user import UserResponse

class PollOptionBase(BaseModel):
    text: str = Field(..., max_length=200)
    user_id: Optional[int] = None
    order_index: int = Field(default=0)

class PollOptionCreate(PollOptionBase):
    pass

class PollOption(PollOptionBase):
    id: int
    poll_id: int
    user: Optional[UserResponse] = None
    vote_count: Optional[int] = 0

    class Config:
        from_attributes = True

class PollBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    question_template: str = Field(..., max_length=500)
    expires_at: Optional[datetime] = None
    is_anonymous: bool = Field(default=True)

class PollCreate(PollBase):
    circle_id: int
    options: List[PollOptionCreate] = []

class PollUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class Poll(PollBase):
    id: int
    circle_id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PollResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    question_template: str
    circle_id: int
    creator_id: int
    expires_at: Optional[datetime]
    is_active: bool
    is_anonymous: bool
    created_at: datetime
    options: List[PollOption] = []
    total_votes: Optional[int] = 0
    user_voted: Optional[bool] = False

    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    option_id: int

class Vote(BaseModel):
    id: int
    poll_id: int
    option_id: int
    user_id: int
    voted_at: datetime

    class Config:
        from_attributes = True