from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app.models.api_key import APIKey
from app.services.database import SessionLocal

#Check if the provided API key exists in the database.
def verify_api_key(api_key: str):
    db: Session = SessionLocal()
    try:
        key_entry = db.query(APIKey).filter(APIKey.key == api_key).first()
        if not key_entry:
            raise HTTPException(status_code=403, detail="Invalid API Key")
    finally:
        db.close()
        
#Middleware to enforce API key authentication.
async def api_key_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):  # Protect only API routes
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            raise HTTPException(status_code=403, detail="Missing API Key")
        verify_api_key(api_key)
    return await call_next(request)
