from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.services.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_input = Column(String, nullable=True)

    question = relationship("Question", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")
