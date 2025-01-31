from pydantic import BaseModel

class AnswerBase(BaseModel):
    text: str

class AnswerCreate(AnswerBase):
    pass

class AnswerUpdate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True
