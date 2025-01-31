from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.vote import Vote
from app.models.user import User
from app.models.candidate import Candidate
from app.models.question import Question
from app.schemas.vote import VoteCreate, VoteResponse

router = APIRouter()

#Cast a vote
@router.post("/", response_model=VoteResponse)
def cast_vote(vote_data: VoteCreate, db: Session = Depends(get_db)):
    #Check if the user and candidate exist
    user = db.query(User).filter(User.id == vote_data.user_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == vote_data.candidate_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    #Check if vote already cast
    existing_vote = db.query(Vote).filter(
        Vote.user_id == vote_data.user_id,
        Vote.candidate_id == vote_data.candidate_id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="User has already voted for this candidate")

    #Create a new vote entry
    new_vote = Vote(
        user_id=vote_data.user_id,
        candidate_id=vote_data.candidate_id
    )
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    return new_vote

#Get all votes for a candidate
@router.get("/candidate/{candidate_id}", response_model=List[VoteResponse])
def get_votes_by_candidate(candidate_id: int, db: Session = Depends(get_db)):

    #Check if the candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    votes = db.query(Vote).filter(Vote.candidate_id == candidate_id).all()
    return votes

#Get all votes cast by a user
@router.get("/user/{user_id}", response_model=List[VoteResponse])
def get_user_votes(user_id: int, db: Session = Depends(get_db)):

    #Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    #Get all the votes for the user
    votes = db.query(Vote).filter(Vote.user_id == user_id).all()
    return votes

#Get all votes in a voting session
@router.get("/session/{session_id}", response_model=List[VoteResponse])
def get_votes_by_session(session_id: int, db: Session = Depends(get_db)):
    
    votes = (
        db.query(Vote)
        .join(Candidate)
        .filter(Candidate.question_id == session_id)
        .all()
    )
    return votes

#Get total votes per candidate in a session
@router.get("/session/{session_id}/results")
def get_session_results(session_id: int, db: Session = Depends(get_db)):
    
    #Get all questions for the session
    questions = db.query(Question).filter(Question.session_id == session_id).all()

    #Check if there are any question in the session
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this session")

    #Get all candidates for those questions
    question_ids = [q.id for q in questions]
    candidates = db.query(Candidate).filter(Candidate.question_id.in_(question_ids)).all()

    #Check if there are any candidates
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found for this session")

    #Get all votes for those candidates
    candidate_ids = [c.id for c in candidates]
    votes = db.query(Vote).filter(Vote.candidate_id.in_(candidate_ids)).all()

    #Check if there are any votes
    if not votes:
        raise HTTPException(status_code=404, detail="No votes found for this session")

    return votes

#Delete a vote
@router.delete("/{vote_id}")
def delete_vote(vote_id: int, db: Session = Depends(get_db)):

    #Check if vote exists
    vote = db.query(Vote).filter(Vote.id == vote_id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    db.delete(vote)
    db.commit()
    return {"detail": "Vote deleted successfully"}