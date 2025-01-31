from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VotingSessionBase(BaseModel):
    title: str
    description: Optional[str] = None

class VotingSessionCreate(VotingSessionBase):
    pass

class VotingSessionResponse(VotingSessionBase):
    id: int
    creator_id: int
    time_created: datetime
    is_published: bool

    class Config:
        from_attributes = True
