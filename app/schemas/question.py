from pydantic import BaseModel
from typing import Optional

class QuestionBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    is_quiz: bool = False

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    session_id: int

    class Config:
        from_attributes = True
