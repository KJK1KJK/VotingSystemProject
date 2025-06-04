from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, String
from sqlalchemy.orm import relationship
from app.services.database import Base

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    vote_date = Column(DateTime, default=func.now())
    user_input = Column(String, nullable=True)

    user = relationship("User", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")
