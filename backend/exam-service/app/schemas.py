from datetime import date, datetime, time
from typing import Literal
from pydantic import BaseModel, Field

ExamStatus = Literal["Planifié", "En cours", "Terminé", "Annulé"]


class ExamCreate(BaseModel):
    subject_id: int | None = None
    subject_name: str = Field(..., min_length=2, max_length=150)
    department: str = Field(default="Informatique", max_length=120)
    exam_date: date
    start_time: time
    duration_minutes: int = Field(default=90, ge=30, le=360)
    status: ExamStatus = "Planifié"
    room_id: int | None = None
    room_name: str = Field(..., min_length=2, max_length=100)
    group_id: int | None = None
    group_name: str = Field(..., min_length=2, max_length=80)
    supervisor_ids: list[int] = Field(default_factory=list)


class ExamUpdate(BaseModel):
    subject_id: int | None = None
    subject_name: str | None = Field(default=None, min_length=2, max_length=150)
    department: str | None = Field(default=None, max_length=120)
    exam_date: date | None = None
    start_time: time | None = None
    duration_minutes: int | None = Field(default=None, ge=30, le=360)
    status: ExamStatus | None = None
    room_id: int | None = None
    room_name: str | None = Field(default=None, min_length=2, max_length=100)
    group_id: int | None = None
    group_name: str | None = Field(default=None, min_length=2, max_length=80)
    supervisor_ids: list[int] | None = None


class ExamResponse(BaseModel):
    id: int
    subject_id: int | None
    subject_name: str
    department: str
    exam_date: date
    start_time: time
    duration_minutes: int
    status: str
    room_id: int | None
    room_name: str
    group_id: int | None
    group_name: str
    supervisor_ids: list[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConflictItem(BaseModel):
    type: str
    message: str
    exam_a_id: int
    exam_b_id: int
    exam_date: date
    start_time: time
    resource: str


class PlanningResponse(BaseModel):
    exams: list[ExamResponse]
    conflicts: list[ConflictItem]
