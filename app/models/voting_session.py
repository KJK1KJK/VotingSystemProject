from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.database import Base

class VotingSession(Base):
    __tablename__ = "voting_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_created = Column(DateTime, default=datetime.utcnow)
    is_published = Column(Boolean, default=False)

    creator = relationship("User", back_populates="voting_sessions")
    settings = relationship("SessionSettings", back_populates="voting_session", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="voting_session", cascade="all, delete-orphan")