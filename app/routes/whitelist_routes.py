from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.schemas.whitelist import (
    WhitelistCreate, WhitelistResponse, WhitelistBySessionRequest, 
    WhitelistByUserRequest, WhitelistGroupUsersRequest, WhitelistByID
)
from app.models.whitelist import Whitelist
from app.models.voting_session import VotingSession
from app.models.user import User
from app.models.user_group import GroupMembership

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

    #Check if any whitelists entries exist
    whitelists = db.query(Whitelist).all()

    return whitelists

@router.post("/entries", response_model=list[WhitelistResponse])
def get_whitelist(request: WhitelistByID, db: Session = Depends(get_db)):

    #Check if whitelist exists
    whitelist = db.query(Whitelist).filter(Whitelist.id == request.whitelist_id).all()
    if not whitelist:
         raise HTTPException(status_code=404, detail="No whitelist found")

    return whitelist

#Get all entries where a user is whitelisted
@router.post("/user", response_model=list[WhitelistResponse])
def get_sessions_by_user(request: WhitelistByUserRequest, db: Session = Depends(get_db)):

    #Check if any whitelisted users exist
    whitelists = db.query(Whitelist).filter(Whitelist.user_id == request.user_id).all()
    if not whitelists:
         raise HTTPException(status_code=404, detail="No whitelisted sessions for user found")

    return whitelists


#Get all users whitelisted for a specific session
@router.post("/session", response_model=list[WhitelistResponse])
def get_users_by_session(request: WhitelistBySessionRequest, db: Session = Depends(get_db)):

    #Check if any sessions with whitelisted users exist
    whitelists = db.query(Whitelist).filter(Whitelist.session_id == request.session_id).all()

    return whitelists


#Remove a user from the whitelist for a specific session
@router.delete("/", response_model=WhitelistResponse)
def remove_from_whitelist(whitelist_entry: WhitelistCreate, db: Session = Depends(get_db)):

    #Check if whitelist entry exists
    entry = db.query(Whitelist).filter(
        Whitelist.user_id == whitelist_entry.user_id,
        Whitelist.session_id == whitelist_entry.session_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found")
    
    #Update the database
    db.delete(entry)
    db.commit()
    
    return entry

#Add all users in a group to the database
@router.post("/group", response_model = list[WhitelistResponse])
def whitelist_group_users(request: WhitelistGroupUsersRequest, db: Session = Depends(get_db)):
    
    #Validate if session exists
    session = db.query(VotingSession).filter(VotingSession.id ==request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting Session not found")

    #Fetch users in the group
    members = db.query(GroupMembership).filter(GroupMembership.group_id == request.group_id).all()

    new_entries = []

    for member in members:

        #Check for existing whitelist entry
        check_entry = db.query(Whitelist).filter(
            Whitelist.user_id == member.user_id,
            Whitelist.session_id == request.session_id
        ).first()

        #If there isn't an entry create  a new one
        if not check_entry:
            whitelist_entry = Whitelist(user_id=member.user_id, session_id=request.session_id)
            db.add(whitelist_entry)
            new_entries.append(whitelist_entry)

    #Update the database
    db.commit()
    for entry in new_entries:
        db.refresh(entry)

    return new_entries