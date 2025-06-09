from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.question import Question
from app.models.voting_session import VotingSession
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse
)

router = APIRouter()

#Create a new question for a voting session
@router.post("/{session_id}/questions/", response_model=QuestionResponse)
def create_question(
    session_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    #Check if the voting session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")

    #Creare a new question entry
    new_question = Question(
        session_id=session_id,
        type=question_data.type,
        title=question_data.title,
        description=question_data.description,
        is_quiz=question_data.is_quiz
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    return new_question

#Get all questions for a voting session
@router.get("/{session_id}/questions/", response_model=List[QuestionResponse])
def get_questions(session_id: int, db: Session = Depends(get_db)):

    #Check if the voting session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")

    #Check if question exists
    questions = db.query(Question).filter(Question.session_id == session_id).all()
    
    return questions

#Get a specific question
@router.get("/questions/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    
    #Check if question exists 
    question = db.query(Question).filter(Question.id == question_id).first()

    return question

#Update a question
@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db)
):
    
    #Check if question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.type = question_data.type
    question.title = question_data.title
    question.description = question_data.description
    question.is_quiz = question_data.is_quiz

    db.commit()
    db.refresh(question)
    return question

#Delete a question
@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    
    #Check if question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return {"detail": "Question deleted successfully"}
