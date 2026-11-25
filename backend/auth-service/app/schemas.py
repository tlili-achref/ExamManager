from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


RoleType = Literal["ADMIN", "TEACHER", "STUDENT"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: RoleType = "STUDENT"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class ErrorResponse(BaseModel):
    timestamp: str
    status: int
    message: str
    path: str
