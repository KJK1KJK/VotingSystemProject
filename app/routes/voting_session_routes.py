from app.models import voting_session, whitelist
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.voting_session import VotingSession
from app.models.user import User
from app.schemas.voting_session import VotingSessionCreate, VotingSessionResponse, VotingSessionUpdate

router = APIRouter()

#Create a new voting session
@router.post("/", response_model=VotingSessionResponse)
def create_voting_session(
    session_data: VotingSessionCreate, 
    creator_id: int, 
    db: Session = Depends(get_db)
):

    #Check if user exists
    creator = db.query(User).filter(User.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="User not found")

    #Create a new voting session entry
    new_session = VotingSession(
        title=session_data.title,
        description=session_data.description,
        creator_id=creator_id,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session

#Get all voting sessions
@router.get("/", response_model=List[VotingSessionResponse])
def get_voting_sessions(db: Session = Depends(get_db)):

    #Check if any sessions exists
    sessions = db.query(VotingSession).all()
    if not sessions:
        raise HTTPException(status_code=404, detail="No voting sessions found")

    return sessions

#Get a voting session by ID
@router.get("/{session_id}", response_model=VotingSessionResponse)
def get_voting_session(session_id: int, db: Session = Depends(get_db)):

    #Check if session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")

    return session

#Delete a voting session
@router.delete("/{session_id}")
def delete_voting_session(session_id: int, db: Session = Depends(get_db)):
    #Check if id in database
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")
    #Delete
    db.delete(session)
    db.commit()
    return {"detail": "Voting session deleted successfully"}

#Publish a voting session
@router.patch("/{session_id}/publish")
def publish_voting_session(session_id: int, db: Session = Depends(get_db)):

    #Check if session in database
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")

    #Mark a voting session as published.
    session.is_published = True
    db.commit()
    return {"detail": "Voting session published successfully"}

#Get all published sessions for a user
@router.get("/user/{user_id}/published", response_model=List[VotingSessionResponse])
def get_published_sessions(user_id: int, db: Session = Depends(get_db)):
    #Fetch all published voting sessions by a user
    sessions = db.query(VotingSession).filter(
        VotingSession.creator_id == user_id,
        VotingSession.is_published == True
    ).all()
    
    if not sessions:
        raise HTTPException(status_code=404, detail="No published voting sessions found for this user")
    
    return sessions

#Get all drafts for a user
@router.get("/user/{user_id}/drafts", response_model=List[VotingSessionResponse])
def get_unpublished_sessions(user_id: int, db: Session = Depends(get_db)):

    #Fetch all drafts for a user
    sessions = db.query(VotingSession).filter(
        VotingSession.creator_id == user_id,
        VotingSession.is_published == False
    ).all()
    
    #Check if there are any drafts for this user
    if not sessions:
        raise HTTPException(status_code=404, detail="No unpublished drafts found for this user")
    
    return sessions

#Update an existing voting session
@router.put("/{session_id}", response_model=VotingSessionResponse)
def update_voting_session(
    session_id: int,
    voting_session: VotingSessionUpdate,
    db: Session = Depends(get_db)):
    
    #Check if session exists
    db_voting_session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not db_voting_session:
        raise HTTPException(status_code=404, detail="Voting session not found")
    
    # Update the fields if provided
    if voting_session.title is not None:
        db_voting_session.title = voting_session.title
    if voting_session.description is not None:
        db_voting_session.description = voting_session.description
    if voting_session.is_published is not None:
        db_voting_session.is_published = voting_session.is_published
    
    #Commit the changes
    db.commit()
    db.refresh(db_voting_session)
    
    return db_voting_session