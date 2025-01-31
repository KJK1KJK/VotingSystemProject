from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.candidate import Candidate
from app.models.question import Question
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse
)

router = APIRouter()

#Create a candidate for a question
@router.post("/{question_id}/candidates/", response_model=CandidateResponse)
def create_candidate(
    question_id: int,
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db)
):
    #Check if question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    #Create a new candidate entry
    new_candidate = Candidate(
        question_id=question_id,
        name=candidate_data.name,
        description=candidate_data.description,
        user_input=candidate_data.user_input
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return new_candidate

#Get all candidates for a question
@router.get("/{question_id}/candidates/", response_model=List[CandidateResponse])
def get_candidates(question_id: int, db: Session = Depends(get_db)):
    #Check if question exists
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    candidates = db.query(Candidate).filter(Candidate.question_id == question_id).all()
    return candidates

#Get a specific candidate
@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    #Check if candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

#Update a candidate
@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db)
):
    #Check if candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.name = candidate_data.name
    candidate.description = candidate_data.description
    candidate.user_input = candidate_data.user_input

    db.commit()
    db.refresh(candidate)
    return candidate

#Delete a candidate
@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):

    #Check if candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    db.delete(candidate)
    db.commit()
    return {"detail": "Candidate deleted successfully"}