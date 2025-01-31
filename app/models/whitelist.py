from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.services.database import Base

class Whitelist(Base):
    __tablename__ = "whitelists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("sessions.id"))
    
    user = relationship("User", back_populates="whitelist")
    session = relationship("Session", back_populates="whitelist")
