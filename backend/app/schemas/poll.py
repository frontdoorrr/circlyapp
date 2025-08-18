from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class PollOptionBase(BaseModel):
    member_id: int
    member_nickname: str
    display_order: int


class PollOptionCreate(PollOptionBase):
    pass


class PollOptionResponse(PollOptionBase):
    id: str
    poll_id: str
    vote_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PollBase(BaseModel):
    question_text: str = Field(..., min_length=5, max_length=500)
    deadline: datetime


class PollCreate(PollBase):
    template_id: str
    circle_id: int
    
    @validator('deadline')
    def deadline_must_be_future(cls, v):
        if v <= datetime.now():
            raise ValueError('마감 시간은 현재 시간보다 미래여야 합니다')
        return v


class PollUpdate(BaseModel):
    question_text: Optional[str] = None
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class PollResponse(PollBase):
    id: str
    circle_id: int
    creator_id: int
    template_id: Optional[str]
    is_anonymous: bool
    max_votes_per_user: int
    is_active: bool
    is_closed: bool
    total_votes: int
    total_participants: int
    created_at: datetime
    options: List[PollOptionResponse] = []

    class Config:
        from_attributes = True


class PollListResponse(BaseModel):
    polls: List[PollResponse]
    total: int
    limit: int
    offset: int


class VoteCreate(BaseModel):
    option_id: str


class VoteResponse(BaseModel):
    id: str
    poll_id: str
    option_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class PollResultOption(BaseModel):
    option_id: str
    member_nickname: str
    vote_count: int
    percentage: float
    rank: int


class PollResultResponse(BaseModel):
    poll_id: str
    question_text: str
    total_votes: int
    total_participants: int
    is_closed: bool
    deadline: datetime
    results: List[PollResultOption]
    winner: Optional[PollResultOption] = None


class PollWithUserStatus(PollResponse):
    user_voted: bool
    user_vote_option_id: Optional[str] = None