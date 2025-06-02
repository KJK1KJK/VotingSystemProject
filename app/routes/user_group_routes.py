from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.database import get_db

from app.models.user_group import UserGroup, GroupMembership
from app.schemas.user_group import (
    UserGroupCreate, UserGroupResponse, GroupMembershipCreate, 
    GroupMembershipResponse, GroupByIdRequest, GroupByNameRequest,
    GroupMembershipCheckRequest
)
from app.models.user import User

router = APIRouter()

#Create a group
@router.post("/", response_model=UserGroupResponse)
def create_group(group: UserGroupCreate, db: Session = Depends(get_db)):

    #Check if the name is not already in use
    created_group = db.query(UserGroup).filter(UserGroup.name == group.name).first()
    if created_group:
        raise HTTPException(status_code=404, detail="User group name taken")

    new_group = UserGroup(
        name=group.name,
        description=group.description,
        creator_id=group.creator_id,
        )

    #Create a new group
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return new_group

#Add a new member to a group
@router.post("/{group_id}/members", response_model=GroupMembershipResponse)
def add_members(group_id: int, request: GroupMembershipCreate, db: Session = Depends(get_db)):
    
    #Check if group already exists
    group = db.query(UserGroup).filter(UserGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    #Check if the user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
       raise HTTPException(status_code=404, detail="User not found")

    #Create a new membership
    membership = GroupMembership(user_id = request.user_id, group_id = group_id)
    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership

#Remove a member from a group
@router.delete("/{group_id}/members", response_model=GroupMembershipResponse)
def remove_members(group_id: int, request: GroupMembershipCreate, db: Session = Depends(get_db)):
    
    #Cehck if group exists
    group = db.query(UserGroup).filter(UserGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    #Get memberships to delete
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == request.user_id
    ).first()

    #Check if the member exists
    if not membership:
        raise HTTPException(status_code=404, detail="No matching users found in the group")

    #Remove member from the database
    db.delete(membership)
    db.commit()

    return membership

#Delete a group
@router.delete("/{group_id}", response_model = UserGroupResponse)
def delete_group(group_id: int, db: Session = Depends(get_db)):

    #Check if group exists
    group = db.query(UserGroup).filter(UserGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    #Remove group from the database
    db.delete(group)
    db.commit()
    
    return group

#Get all groups
@router.get("/", response_model=list[UserGroupResponse])
def get_whitelist(db: Session = Depends(get_db)):

    #Check if any group exists
    groups = db.query(UserGroup).all()

    return groups

#Get a group by id
@router.post("/groups/by-id", response_model=UserGroupResponse)
def get_group_by_id(request: GroupByIdRequest, db: Session = Depends(get_db)):

    #Check if group exists
    group = db.query(UserGroup).filter(UserGroup.id == request.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    return group

#Get a group by name
@router.post("/groups/by-name", response_model=UserGroupResponse)
def get_group_by_name(request: GroupByNameRequest, db: Session = Depends(get_db)):
    
    #Check if group exists
    group = db.query(UserGroup).filter(UserGroup.name == request.name).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    return group

#Get members by group id
@router.post("/groups/members/by-id", response_model=list[GroupMembershipResponse])
def get_members_by_id(request: GroupByIdRequest, db: Session = Depends(get_db)):
    
    #Check if group exists
    group = db.query(UserGroup).filter(UserGroup.id == request.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    #Check if any members exists
    members = db.query(GroupMembership).filter(GroupMembership.group_id == request.group_id).all()
    if not members:
        raise HTTPException(status_code=404, detail="No members found for this group")
    
    return members

#Get a members by group name
@router.post("/groups/members/by-name", response_model=list[GroupMembershipResponse])
def get_members_by_name(request: GroupByNameRequest, db: Session = Depends(get_db)):
    
    #Check if group exists
    group = db.query(UserGroup).filter(UserGroup.name == request.name).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    #Check if any members exists
    members = db.query(GroupMembership).filter(GroupMembership.group_id == group.id).all()
    if not members:
        raise HTTPException(status_code=404, detail="No members found for this group")
    
    return members

#Check if user is a part of a group
@router.post("/groups/check-membership")
def check_user_membership(request: GroupMembershipCheckRequest, db: Session = Depends(get_db)):
        
    membership = db.query(GroupMembership).filter(
        GroupMembership.user_id == request.user_id,
        GroupMembership.group_id == request.group_id
    ).first()

    if membership:
        return {"is_member": True}
    else:
        return {"is_member": False}