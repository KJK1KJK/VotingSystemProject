from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("voting_sessions.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_quiz = Column(Boolean, default=False)

    voting_session = relationship("VotingSession", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="question", cascade="all, delete-orphan")