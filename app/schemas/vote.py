from pydantic import BaseModel
from datetime import datetime

class VoteBase(BaseModel):
    user_id: int
    candidate_id: int

class VoteCreate(VoteBase):
    user_input: str = ""

class VoteResponse(VoteBase):
    id: int
    vote_date: datetime
    candidate_id: int
    user_id: int

    class Config:
        from_attributes = True
