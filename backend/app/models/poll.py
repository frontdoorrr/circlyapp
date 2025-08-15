from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    question_template = Column(String(500), nullable=False)
    circle_id = Column(Integer, ForeignKey("circles.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    is_anonymous = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    circle = relationship("Circle", back_populates="polls")
    creator = relationship("User", back_populates="created_polls")
    options = relationship("PollOption", back_populates="poll")
    votes = relationship("Vote", back_populates="poll")

class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    text = Column(String(200), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 멤버 선택지인 경우
    order_index = Column(Integer, default=0)
    
    # 관계 설정
    poll = relationship("Poll", back_populates="options")
    user = relationship("User")
    votes = relationship("Vote", back_populates="option")

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User", back_populates="votes")