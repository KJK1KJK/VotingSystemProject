from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.answer import (
    AnswerCreate,
    AnswerUpdate,
    AnswerResponse
)

router = APIRouter()

#Create an answer (only if question is a quiz)
@router.post("/{question_id}/answers/", response_model=AnswerResponse)
def create_answer(
    question_id: int,
    answer_data: AnswerCreate,
    db: Session = Depends(get_db)
):
    #Check if the question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    #Check if the question is a quiz
    if not question.is_quiz:
        raise HTTPException(status_code=400, detail="Answers can only be added to quiz questions")

    new_answer = Answer(
        question_id=question_id,
        text=answer_data.text
    )
    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)

    return new_answer

#Get all answers for a question
@router.get("/{question_id}/answers/", response_model=List[AnswerResponse])
def get_answers(question_id: int, db: Session = Depends(get_db)):

    #Check if the question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    answers = db.query(Answer).filter(Answer.question_id == question_id).all()
    return answers

#Get a specific answer
@router.get("/answers/{answer_id}", response_model=AnswerResponse)
def get_answer(answer_id: int, db: Session = Depends(get_db)):

    #Check if the answer exists
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return answer

#Update an answer
@router.put("/answers/{answer_id}", response_model=AnswerResponse)
def update_answer(
    answer_id: int,
    answer_data: AnswerUpdate,
    db: Session = Depends(get_db)
):
    #Check if the answer exists
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    answer.text = answer_data.text

    db.commit()
    db.refresh(answer)
    return answer

#Delete an answer
@router.delete("/answers/{answer_id}")
def delete_answer(answer_id: int, db: Session = Depends(get_db)):
    #Check if the answer exists
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    db.delete(answer)
    db.commit()
    return {"detail": "Answer deleted successfully"}
