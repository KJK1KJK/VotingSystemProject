from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from app.services.database import get_db
from app.models.api_key import APIKey

router = APIRouter()

#Generate a secure 64-character API key.
def generate_api_key():
    return secrets.token_hex(32)

#Create a new API key for a client app.
@router.post("/generate-api-key/")
def create_api_key(app_name: str, db: Session = Depends(get_db)):
   
    existing_key = db.query(APIKey).filter(APIKey.app_name == app_name).first()
    if existing_key:
        raise HTTPException(status_code=400, detail="App already has an API key")

    new_key = APIKey(key=generate_api_key(), app_name=app_name)
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return {"app_name": new_key.app_name, "api_key": new_key.key}
