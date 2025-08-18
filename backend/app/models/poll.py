from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    circle_id = Column(Integer, ForeignKey("circles.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 선택된 질문 템플릿
    template_id = Column(String, ForeignKey("question_templates.id"), nullable=True)
    question_text = Column(Text, nullable=False)  # 템플릿에서 복사된 실제 질문
    
    # 타이밍
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deadline = Column(DateTime(timezone=True), nullable=False)
    
    # 설정
    is_anonymous = Column(Boolean, default=True, nullable=False)
    max_votes_per_user = Column(Integer, default=1, nullable=False)
    
    # 상태
    is_active = Column(Boolean, default=True, nullable=False)
    is_closed = Column(Boolean, default=False, nullable=False)
    
    # 통계 캐싱
    total_votes = Column(Integer, default=0, nullable=False)
    total_participants = Column(Integer, default=0, nullable=False)
    
    # 관계 설정
    circle = relationship("Circle", back_populates="polls")
    creator = relationship("User", back_populates="created_polls")
    template = relationship("QuestionTemplate")
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="poll", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "circle_id": self.circle_id,
            "creator_id": self.creator_id,
            "template_id": self.template_id,
            "question_text": self.question_text,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "is_anonymous": self.is_anonymous,
            "max_votes_per_user": self.max_votes_per_user,
            "is_active": self.is_active,
            "is_closed": self.is_closed,
            "total_votes": self.total_votes,
            "total_participants": self.total_participants,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    poll_id = Column(String, ForeignKey("polls.id"), nullable=False)
    
    # Circle 멤버 정보 (선택지가 사람이므로)
    member_id = Column(Integer, ForeignKey("circle_members.id"), nullable=False)
    member_nickname = Column(String(20), nullable=False)  # 투표 생성 시점의 닉네임 저장
    display_order = Column(Integer, nullable=False)
    
    # 통계 캐싱
    vote_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    poll = relationship("Poll", back_populates="options")
    member = relationship("CircleMember")
    votes = relationship("Vote", back_populates="option")
    
    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "member_id": self.member_id,
            "member_nickname": self.member_nickname,
            "display_order": self.display_order,
            "vote_count": self.vote_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    poll_id = Column(String, ForeignKey("polls.id"), nullable=False)
    option_id = Column(String, ForeignKey("poll_options.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 익명성 보장을 위한 해시
    # 실제 투표 내용은 이 해시를 통해서만 연결되고, 직접적인 연결은 분리
    anonymous_hash = Column(String(255), nullable=False)
    
    # 메타데이터
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_hash = Column(String(255), nullable=True)  # IP 해시 (어뷰징 방지용)
    user_agent_hash = Column(String(255), nullable=True)  # User-Agent 해시
    
    # 관계 설정
    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User", back_populates="votes")
    
    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "option_id": self.option_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }