from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr 

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    time_created: datetime

    class Config:
        orm_mode = True