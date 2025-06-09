from tokenize import group
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base

class GroupWhitelist(Base):
    __tablename__ = "group_whitelists"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("user_groups.id"))
    session_id = Column(Integer, ForeignKey("voting_sessions.id"))
    
    group = relationship("Group", back_populates="group_whitelist")
    session = relationship("VotingSession", back_populates="group_whitelist")