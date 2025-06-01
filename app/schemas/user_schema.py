from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    
class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    time_created: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

#Admin schema
class AdminBase(BaseModel):
    username: str
    email: EmailStr

class AdminCreate(UserBase):
    password: str

class AdminOut(UserBase):
    id: int
    time_created: datetime

    class Config:
        from_attributes = True