from pydantic import BaseModel

class WhitelistBase(BaseModel):
    group_id: int
    session_id: int

class WhitelistCreate(WhitelistBase):
    pass

class WhitelistResponse(WhitelistBase):
    id: int
    
    class Config:
        from_attributes = True

class WhitelistByUserRequest(BaseModel):
    group_id: int

class WhitelistBySessionRequest(BaseModel):
    session_id: int

class WhitelistByID(BaseModel):
    whitelist_id: int