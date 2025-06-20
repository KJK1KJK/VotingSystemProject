from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.voting_session import VotingSession
from app.models.whitelist import Whitelist
from app.models.user import User
from app.schemas.voting_session import VotingSessionCreate, VotingSessionResponse, VotingSessionUpdate, UserIDRequest

router = APIRouter()

#Create a new voting session
@router.post("/", response_model=VotingSessionResponse)
def create_voting_session(
    session_data: VotingSessionCreate, 
    db: Session = Depends(get_db)
):

    #Check if user exists
    creator = db.query(User).filter(User.id == session_data.creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="User not found")

    #Create a new voting session entry
    new_session = VotingSession(
        title=session_data.title,
        description=session_data.description,
        creator_id=session_data.creator_id,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    #Add creator to the whitelist
    whitelist_entry = Whitelist(
        user_id = session_data.creator_id,
        session_id = new_session.id
    )
    db.add(whitelist_entry)
    db.commit()
    db.refresh(whitelist_entry)
    
    return new_session

#Get all voting sessions
@router.get("/", response_model=List[VotingSessionResponse])
def get_voting_sessions(db: Session = Depends(get_db)):

    #Check if any sessions exists
    sessions = db.query(VotingSession).all()

    return sessions

#Get a voting session by ID
@router.get("/{session_id}", response_model=VotingSessionResponse)
def get_voting_session(session_id: int, db: Session = Depends(get_db)):

    #Check if session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()

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
@router.post("/user/published", response_model=List[VotingSessionResponse])
def get_published_sessions(request: UserIDRequest, db: Session = Depends(get_db)):
    
    #Fetch all published voting sessions by a user
    sessions = db.query(VotingSession).filter(
        VotingSession.creator_id == request.user_id,
        VotingSession.is_published == True
    ).all()
    
    return sessions

#Get all drafts for a user
@router.post("/user/drafts", response_model=List[VotingSessionResponse])
def get_unpublished_sessions(request: UserIDRequest, db: Session = Depends(get_db)):

    #Fetch all drafts for a user
    sessions = db.query(VotingSession).filter(
        VotingSession.creator_id == request.user_id,
        VotingSession.is_published == False
    ).all()
    
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

#Get all sessions that the user has access to
@router.post("/user/whitelisted", response_model=List[VotingSessionResponse])
def get_whitelisted_sessions(request: UserIDRequest, db: Session = Depends(get_db)):
    
    #Fetch all published voting sessions that the user has access to
    sessions = db.query(VotingSession).join(Whitelist).filter(
        Whitelist.user_id == request.user_id,
        VotingSession.is_published == True
    ).all()

    return sessions