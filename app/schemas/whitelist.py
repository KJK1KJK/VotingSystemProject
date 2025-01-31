from pydantic import BaseModel

class WhitelistBase(BaseModel):
    user_id: int
    session_id: int

class WhitelistCreate(WhitelistBase):
    pass

class WhitelistResponse(WhitelistBase):
    id: int
    
    class Config:
        orm_mode = True
