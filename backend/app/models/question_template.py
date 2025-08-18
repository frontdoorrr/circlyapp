from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base
import uuid


class QuestionTemplate(Base):
    __tablename__ = "question_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(50), nullable=False, index=True)
    question_text = Column(Text, nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    usage_count = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<QuestionTemplate(id={self.id}, category={self.category}, question_text={self.question_text[:30]}...)>"

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "question_text": self.question_text,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "usage_count": self.usage_count,
            "is_popular": self.usage_count > 50  # 인기 템플릿 기준
        }