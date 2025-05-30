from pydantic import BaseModel
from typing import List
from datetime import datetime

class GroupMembershipBase(BaseModel):
    user_id: int

class GroupMembershipCreate(GroupMembershipBase):
    pass

class GroupMembershipResponse(GroupMembershipBase):
    id: int
    group_id: int
    time_joined: datetime

    class Config:
        from_attributes = True
        
class GroupMembershipCheckRequest(GroupMembershipBase):
    group_id: int



class UserGroupBase(BaseModel):
    name: str

class UserGroupCreate(UserGroupBase):
    description: str | None = None
    creator_id: int

class UserGroupResponse(UserGroupBase):
    id: int
    description: str | None
    creator_id: int
    time_created: datetime

    class Config:
        from_attributes = True

class GroupByNameRequest(UserGroupBase):
    pass

class GroupByIdRequest(BaseModel):
    group_id: int