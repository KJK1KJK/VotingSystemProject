from pydantic import BaseModel

class CandidateBase(BaseModel):
    name: str
    description: str | None = None
    user_input: str | None = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(CandidateBase):
    pass

class CandidateResponse(CandidateBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True
