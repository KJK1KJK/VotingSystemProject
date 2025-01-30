from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.models import AdminUser
from app.schemas.user_schema import AdminCreate, AdminOut, AdminBase
from passlib.hash import bcrypt

router = APIRouter()

#Get all admins
@router.get("/", response_model=list[AdminOut])
def get_admins(db: Session = Depends(get_db)):
    admins = db.query(AdminUser).all()
    return admins

#Register a new admin
@router.post("/", response_model=AdminOut)
def create_admin(user: AdminCreate, db: Session = Depends(get_db)):
    #Check if email already exists
    db_admin = db.query(AdminUser).filter(AdminUser.username == admin.username).first()
    if db_admin:
        raise HTTPException(status_code=400, detail="Admin already registered")
    
    #Hash the password
    hashed_password = bcrypt.hash(admin.password)

    #Create a new admin
    new_admin = AdminUser(username=admin.username, email=admin.email, password=hashed_password)
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

#Delete admin
@router.delete("/{admin_id}", response_model=dict)
def delete_user(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    db.delete(admin)
    db.commit()
    return {"message": "Admin deleted successfully"}

#Get admin by username
@router.get("/username/{admin_name}", response_model=AdminOut)
def get_user(admin_name: str, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == admin_name).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

#Get admin by id
@router.get("/id/{admin_id}", response_model=AdminOut)
def get_user(admin_id: int, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

#Get admin by email
@router.get("/email/{user_email}", response_model=AdminOut)
def get_user(user_email: str, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == user_email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

#Check if admin exists
@router.get("/{admin_name}/exists", response_model=dict)
def check_user_exists(admin_name: str, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == admin_name).first()
    return {"exists": admin is not None}

#Login and get admin credentials
@router.post("/login/", response_model=AdminBase)
def login(email: str, password: str, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Invalid email or password")
    if not bcrypt.verify(password, admin.password):
        raise HTTPException(status_code=404, detail="Invalid email or password")
    return {"username": admin.username, "email": admin.email}
