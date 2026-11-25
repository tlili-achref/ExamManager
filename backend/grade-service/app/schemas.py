from datetime import datetime
from pydantic import BaseModel, Field


class GradeCreate(BaseModel):
    exam_id: int = Field(..., ge=1)
    subject_name: str = Field(..., min_length=2, max_length=150)
    student_id: int = Field(..., ge=1)
    student_matricule: str = Field(..., min_length=2, max_length=40)
    student_name: str = Field(..., min_length=2, max_length=150)
    score: float = Field(..., ge=0.0, le=20.0)
    published: bool = False


class GradeUpdate(BaseModel):
    score: float = Field(..., ge=0.0, le=20.0)


class GradePublishRequest(BaseModel):
    exam_id: int | None = None


class GradeResponse(BaseModel):
    id: int
    exam_id: int
    subject_name: str
    student_id: int
    student_matricule: str
    student_name: str
    score: float
    published: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class GradeStatsResponse(BaseModel):
    count: int
    average: float
    highest: float
    pass_rate: float
