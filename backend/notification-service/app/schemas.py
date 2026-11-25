from datetime import datetime
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    event_type: str = Field(..., max_length=60)
    title: str = Field(..., max_length=150)
    message: str = Field(..., max_length=500)
    icon: str = Field(default="calendar", max_length=30)
    target_role: str = Field(default="ALL", max_length=30)


class NotificationResponse(BaseModel):
    id: int
    event_type: str
    title: str
    message: str
    icon: str
    target_role: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
