from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.models.user import User
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()

# Create new feedback
@router.post("/", response_model=FeedbackResponse)
def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):

    #Check if user exists
    user = db.query(User).filter(User.id == feedback.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    #Create new feedback entry
    new_feedback = Feedback(**feedback.dict())
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return new_feedback

# Get all feedback from users
@router.get("/", response_model=list[FeedbackResponse])
def get_all_feedback(db: Session = Depends(get_db)):

    feedbacks = db.query(Feedback).all()
    return feedbacks

# Get feedback by user
@router.get("/user/{user_id}", response_model=list[FeedbackResponse])
def get_feedback_by_user(user_id: int, db: Session = Depends(get_db)):

    #Check if any feedback exists
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()
    if not feedbacks:
        raise HTTPException(status_code=404, detail="No feedback found for this user")

    return feedbacks

# Get feedback by ID
@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback_by_id(feedback_id: int, db: Session = Depends(get_db)):

    #Check if feedback exists
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return feedback

