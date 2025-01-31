from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.services.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, unique=True)
    email = Column(String, index=True, unique=True, nullable=False)
    password = Column(String, nullable=False)
    time_created = Column(DateTime(timezone=True), server_default=func.now())

    voting_sessions = relationship("VotingSession", back_populates="creator")
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user")
    whitelist = relationship("Whitelist", back_populates="user", cascade="all, delete-orphan")

    type = Column(String, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "user",
        "polymorphic_on": type,
        "with_polymorphic": "*"
    }

class AdminUser(User):
    __tablename__ = "administrators"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": "admin",
    }