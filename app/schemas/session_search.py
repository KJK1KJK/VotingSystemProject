from pydantic import BaseModel
from datetime import datetime
from typing import Optional

#Schema for search query parameters
class SessionSearch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    creator_id: Optional[int] = None
    is_published: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
