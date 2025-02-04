from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.models import User
from app.schemas.user_schema import UserCreate, UserOut, UserBase, LoginRequest
from passlib.hash import bcrypt

router = APIRouter()

#Get all users
@router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

#Register a new user
@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    #Check if email already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    #Hash the password
    hashed_password = bcrypt.hash(user.password)

    #Create a new user entry
    new_user = User(username=user.username, email=user.email, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

#Delete user
@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):

    #Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

#Get user by username
@router.get("/username/{user_name}", response_model=UserOut)
def get_user(user_name: str, db: Session = Depends(get_db)):

    #Check if user exists
    user = db.query(User).filter(User.username == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

#Get user by id
@router.get("/id/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):

    #Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

#Get user by email
@router.get("/email/{user_email}", response_model=UserOut)
def get_user(user_email: str, db: Session = Depends(get_db)):

    #Check if user exists
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    return user

#Check if user exists
@router.get("/{user_name}/exists", response_model=dict)
def check_user_exists(user_name: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_name).first()
    return {"exists": user is not None}

#Login and get user credentials
@router.post("/login/", response_model=UserBase)
def login(request: LoginRequest, db: Session = Depends(get_db)):

    #Check if credentials are correct
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not bcrypt.verify(request.password, user.password):
        raise HTTPException(status_code=404, detail="Invalid email or password")

    return {"username": user.username, "email": user.email, "id": user.id}