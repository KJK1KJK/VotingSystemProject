from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.schemas.group_whitelist import (
    WhitelistCreate, WhitelistResponse, WhitelistBySessionRequest, 
    WhitelistByUserRequest, WhitelistByID
)
from app.models.group_whitelist import GroupWhitelist
from app.models.voting_session import VotingSession
from app.models.user_group import UserGroup

router = APIRouter()

#Add a group to the whitelist for a specific session
@router.post("/", response_model=WhitelistResponse)
def add_to_whitelist(whitelist_entry: WhitelistCreate, db: Session = Depends(get_db)):

    #Check if the user exists
    user = db.query(UserGroup).filter(UserGroup.id == whitelist_entry.group_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    #Check if the session exists
    session = db.query(VotingSession).filter(VotingSession.id == whitelist_entry.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    #Create a new whitelist entry
    new_entry = GroupWhitelist(**whitelist_entry.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return new_entry


#Get all whitelist entries (groups and their sessions)
@router.get("/", response_model=list[WhitelistResponse])
def get_whitelist(db: Session = Depends(get_db)):

    #Check if any whitelists entries exist
    whitelists = db.query(GroupWhitelist).all()

    return whitelists

#Get whitelist entries by ID
@router.post("/entries", response_model=list[WhitelistResponse])
def get_whitelist(request: WhitelistByID, db: Session = Depends(get_db)):

    #Check if whitelist exists
    whitelist = db.query(GroupWhitelist).filter(GroupWhitelist.id == request.whitelist_id).all()

    return whitelist

#Get all entries where a group is whitelisted
@router.post("/user", response_model=list[WhitelistResponse])
def get_sessions_by_group(request: WhitelistByUserRequest, db: Session = Depends(get_db)):

    #Check if any whitelisted users exist
    whitelists = db.query(GroupWhitelist).filter(GroupWhitelist.group_id == request.group_id).all()

    return whitelists


#Get all users whitelisted for a specific session
@router.post("/session", response_model=list[WhitelistResponse])
def get_groups_by_session(request: WhitelistBySessionRequest, db: Session = Depends(get_db)):

    #Check if any sessions with whitelisted users exist
    whitelists = db.query(GroupWhitelist).filter(GroupWhitelist.session_id == request.session_id).all()

    return whitelists


#Remove a user from the whitelist for a specific session
@router.delete("/", response_model=WhitelistResponse)
def remove_from_whitelist(whitelist_entry: WhitelistCreate, db: Session = Depends(get_db)):

    #Check if whitelist entry exists
    entry = db.query(GroupWhitelist).filter(
        GroupWhitelist.group_id == whitelist_entry.group_id,
        GroupWhitelist.session_id == whitelist_entry.session_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found")
    
    #Update the database
    db.delete(entry)
    db.commit()
    
    return entry