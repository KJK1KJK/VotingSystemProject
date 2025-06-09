from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.services.database import get_db
from app.models.session_settings import SessionSettings
from app.models.voting_session import VotingSession
from app.schemas.session_settings import (
    SessionSettingsCreate,
    SessionSettingsUpdate,
    SessionSettingsResponse
)

router = APIRouter()

#Create a new session setting
@router.post("/{session_id}/settings/", response_model=SessionSettingsResponse)
def create_session_setting(
    session_id: int,
    setting_data: SessionSettingsCreate,
    db: Session = Depends(get_db)
):
    #Check if the voting session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")


    #Create a new settings entry
    new_setting = SessionSettings(
        session_id=session_id,
        setting_name=setting_data.setting_name,
        setting_value=setting_data.setting_value
    )
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)
    
    return new_setting

#Get all settings for a voting session
@router.get("/{session_id}/settings/", response_model=List[SessionSettingsResponse])
def get_session_settings(session_id: int, db: Session = Depends(get_db)):
    
    #Check if the voting session exists
    session = db.query(VotingSession).filter(VotingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Voting session not found")

    #Check if settings exists
    settings = db.query(SessionSettings).filter(SessionSettings.session_id == session_id).all()
    
    return settings

#Update a session setting
@router.put("/settings/{setting_id}", response_model=SessionSettingsResponse)
def update_session_setting(
    setting_id: int,
    setting_data: SessionSettingsUpdate,
    db: Session = Depends(get_db)
):
  
    #Check if settings exists
    setting = db.query(SessionSettings).filter(SessionSettings.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Session setting not found")

    setting.setting_name = setting_data.setting_name
    setting.setting_value = setting_data.setting_value

    db.commit()
    db.refresh(setting)
    return setting

#Delete a session setting
@router.delete("/settings/{setting_id}")
def delete_session_setting(setting_id: int, db: Session = Depends(get_db)):
   
    setting = db.query(SessionSettings).filter(SessionSettings.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Session setting not found")

    db.delete(setting)
    db.commit()
    return {"detail": "Session setting deleted successfully"}
