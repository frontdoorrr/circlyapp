from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, time
import uuid

from app.database import Base

class PushToken(Base):
    __tablename__ = "push_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expo_token = Column(String(255), unique=True, nullable=False, index=True)
    device_id = Column(String(255), nullable=True)
    platform = Column(String(10), nullable=True)  # ios, android
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="push_tokens")

class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    all_notifications = Column(Boolean, default=True, nullable=False)
    poll_start_notifications = Column(Boolean, default=True, nullable=False)
    poll_deadline_notifications = Column(Boolean, default=True, nullable=False)
    poll_result_notifications = Column(Boolean, default=True, nullable=False)
    quiet_hours_start = Column(Time, default=time(22, 0), nullable=False)  # 22:00
    quiet_hours_end = Column(Time, default=time(8, 0), nullable=False)     # 08:00
    max_daily_notifications = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notification_settings")

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    poll_id = Column(String, ForeignKey("polls.id"), nullable=True)  # Poll은 string ID 사용
    notification_type = Column(String(50), nullable=False)  # poll_start, poll_deadline, poll_result
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, sent, failed, clicked
    expo_receipt_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notification_logs")
    poll = relationship("Poll")