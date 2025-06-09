from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from app.services.database import Base
from datetime import datetime

class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_created = Column(DateTime, default=datetime.utcnow)

    members = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="user_group")
    group_whitelist = relationship("GroupWhitelist", back_populates="group")

class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_joined = Column(DateTime, default=datetime.utcnow)

    group = relationship("UserGroup", back_populates="members")
    user = relationship("User", back_populates="membership")