from pydantic import BaseModel
from typing import List

class SessionSettingsBase(BaseModel):
    setting_name: str
    setting_value: str

class SessionSettingsCreate(SessionSettingsBase):
    pass

class SessionSettingsUpdate(SessionSettingsBase):
    pass

class SessionSettingsResponse(SessionSettingsBase):
    id: int
    session_id: int

    class Config:
        from_attributes = True
