from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.services.database import Base

class APIKey(Base):
    __tablename__ = "api_keys"

    key = Column(String, primary_key=True, index=True)
    app_name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)