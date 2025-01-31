from pydantic import BaseModel
from datetime import datetime

#Base schema for Feedback
class FeedbackBase(BaseModel):
    title: str
    description: str
    user_id: int

#Schema for creating new feedback
class FeedbackCreate(FeedbackBase):
    pass

#Schema for response when retrieving feedback
class FeedbackResponse(FeedbackBase):
    id: int
    feedback_date: datetime

    class Config:
        from_attributes = True
