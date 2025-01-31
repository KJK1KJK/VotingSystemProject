from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base
from datetime import datetime

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    feedback_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="feedback")
