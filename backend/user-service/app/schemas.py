from pydantic import BaseModel, EmailStr, Field


class GroupCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    student_count: int = Field(default=0, ge=0)
    academic_year: str = Field(default="2024/2025", max_length=20)
    status: str = Field(default="Actif", max_length=30)


class GroupResponse(GroupCreate):
    id: int
    model_config = {"from_attributes": True}


class TeacherCreate(BaseModel):
    auth_user_id: int | None = None
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    department: str = Field(..., min_length=2, max_length=120)


class TeacherResponse(TeacherCreate):
    id: int
    model_config = {"from_attributes": True}


class StudentCreate(BaseModel):
    auth_user_id: int | None = None
    matricule: str = Field(..., min_length=3, max_length=40)
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    group_id: int | None = None


class StudentResponse(StudentCreate):
    id: int
    model_config = {"from_attributes": True}


class SubjectCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=30)
    name: str = Field(..., min_length=2, max_length=150)
    teacher_id: int | None = None
    teacher_name: str = Field(..., min_length=2, max_length=150)
    level: str = Field(..., min_length=2, max_length=50)
    credits: int = Field(default=4, ge=1, le=30)


class SubjectResponse(SubjectCreate):
    id: int
    model_config = {"from_attributes": True}


class SupervisorCreate(BaseModel):
    exam_id: int = Field(..., ge=1)
    teacher_id: int = Field(..., ge=1)


class SupervisorResponse(BaseModel):
    id: int
    exam_id: int
    teacher_id: int
    teacher_name: str
    model_config = {"from_attributes": True}
