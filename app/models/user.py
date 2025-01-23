from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, DateTime
from app.services.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, unique=True)
    email = Column(String, index=True, unique=True, nullable=False)
    password = Column(String, nullable=False)
    time_created = Column(DateTime(timezone=True), server_default=func.now())