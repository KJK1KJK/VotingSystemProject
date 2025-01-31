from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base

class SessionSettings(Base):
    __tablename__ = "session_settings"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("voting_sessions.id"), nullable=False)
    setting_name = Column(String, nullable=False)
    setting_value = Column(String, nullable=False)

    voting_session = relationship("VotingSession", back_populates="settings")
