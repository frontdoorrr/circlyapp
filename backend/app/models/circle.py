from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Circle(Base):
    __tablename__ = "circles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    invite_code = Column(String(20), unique=True, index=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    creator = relationship("User")
    members = relationship("CircleMember", back_populates="circle")
    polls = relationship("Poll", back_populates="circle")

class CircleMember(Base):
    __tablename__ = "circle_members"
    
    id = Column(Integer, primary_key=True, index=True)
    circle_id = Column(Integer, ForeignKey("circles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")  # admin, member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    circle = relationship("Circle", back_populates="members")
    user = relationship("User", back_populates="circles")