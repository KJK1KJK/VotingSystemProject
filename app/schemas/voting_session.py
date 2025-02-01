from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VotingSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    whitelist: Optional[bool] = False

class VotingSessionCreate(VotingSessionBase):
    pass

class VotingSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None
    whitelist: Optional[bool] = None 

class VotingSessionResponse(VotingSessionBase):
    id: int
    creator_id: int
    time_created: datetime
    is_published: bool

    class Config:
        from_attributes = True
