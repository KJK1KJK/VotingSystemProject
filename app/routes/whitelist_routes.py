from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.models.whitelist import Whitelist
from app.schemas.whitelist import WhitelistCreate, WhitelistResponse
from app.models.session import Session as VotingSession
from app.models.user import User

router = APIRouter()

#Add a user to the whitelist for a specific session
@router.post("/", response_model=WhitelistResponse)
def add_to_whitelist(whitelist_entry: WhitelistCreate, db: Session = Depends(get_db)):

    #Check if the user exists
    user = db.query(User).filter(User.id == whitelist_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    #Check if the session exists
    session = db.query(VotingSession).filter(VotingSession.id == whitelist_entry.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    #Create a new whitelist entry
    new_entry = Whitelist(**whitelist_entry.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return new_entry


#Get all whitelist entries (users and their sessions)
@router.get("/", response_model=list[WhitelistResponse])
def get_whitelist(db: Session = Depends(get_db)):

    #Check if any whitelists exist
    whitelists = db.query(Whitelist).all()
    if not whitelists:
         raise HTTPException(status_code=404, detail="Not whitelists found")

    return whitelists


#Get all sessions where a user is whitelisted
@router.get("/user/{user_id}", response_model=list[WhitelistResponse])
def get_sessions_by_user(user_id: int, db: Session = Depends(get_db)):

    #Check if any whitelisted users exist
    whitelists = db.query(Whitelist).filter(Whitelist.user_id == user_id).all()
    if not whitelists:
         raise HTTPException(status_code=404, detail="No whitelisted sessions for user found")

    return whitelists


#Get all users whitelisted for a specific session
@router.get("/session/{session_id}", response_model=list[WhitelistResponse])
def get_users_by_session(session_id: int, db: Session = Depends(get_db)):

    #Check if any sessions with whitelisted users exist
    whitelists = db.query(Whitelist).filter(Whitelist.session_id == session_id).all()
    if not whitelists:
         raise HTTPException(status_code=404, detail="No whitelisted user for session found")

    return whitelists


# Remove a user from the whitelist for a specific session
@router.delete("/", response_model=WhitelistResponse)
def remove_from_whitelist(whitelist_entry: WhitelistCreate, db: Session = Depends(get_db)):

    #Check if whitelist entry exists
    entry = db.query(Whitelist).filter(
        Whitelist.user_id == whitelist_entry.user_id,
        Whitelist.session_id == whitelist_entry.session_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found")
    
    db.delete(entry)
    db.commit()
    
    return entry
