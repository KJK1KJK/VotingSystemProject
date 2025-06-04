from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VoteBase(BaseModel):
    user_id: int
    candidate_id: int

class VoteCreate(VoteBase):
    user_input: Optional[str] = None

class VoteResponse(VoteBase):
    id: int
    vote_date: datetime
    user_input: Optional[str] = None

    class Config:
        from_attributes = True
