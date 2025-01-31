from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

#Schemas for search query parameters
class VotingSessionSearchParams(BaseModel):
    day: Optional[int] = None
    year: Optional[int] = None
    month: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    exact_date: Optional[datetime] = None
    title: Optional[str] = None
    is_published: Optional[bool] = None
    description: Optional[str] = None
    order_by: Optional[str] = Field(None, description="Order by field name (e.g., 'time_created', 'title')")
    order_direction: Optional[str] = Field("asc", description="Sort direction ('asc' or 'desc')")
    
class WhitelistSearchParams(BaseModel):
    creator_name: Optional[str] = None
    day: Optional[int] = None
    year: Optional[int] = None
    month: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    exact_date: Optional[datetime] = None
    title: Optional[str] = None
    description: Optional[str] = None
    order_by: Optional[str] = Field(None, description="Order by field name (e.g., 'time_created', 'title')")
    order_direction: Optional[str] = Field("asc", description="Sort direction ('asc' or 'desc')")
