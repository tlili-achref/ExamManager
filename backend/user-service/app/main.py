from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.exceptions import register_exception_handlers
from app.models import Group, Student, Subject, SupervisorAssignment, Teacher
from app.schemas import (
    GroupCreate,
    GroupResponse,
    StudentCreate,
    StudentResponse,
    SubjectCreate,
    SubjectResponse,
    SupervisorCreate,
    SupervisorResponse,
    TeacherCreate,
    TeacherResponse,
)

app = FastAPI(title="ExamManager User Service", version="1.0.0")
register_exception_handlers(app)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "UP", "service": "user-service"}


# --- Groups ---
@app.get("/users/groups", response_model=list[GroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return db.query(Group).order_by(Group.id.asc()).all()


@app.post("/users/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    if db.query(Group).filter(Group.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Group code already exists")
    group = Group(**payload.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@app.delete("/users/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    db.delete(group)
    db.commit()


# --- Teachers ---
@app.get("/users/teachers", response_model=list[TeacherResponse])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).order_by(Teacher.id.asc()).all()


@app.post("/users/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(payload: TeacherCreate, db: Session = Depends(get_db)):
    if db.query(Teacher).filter(Teacher.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Teacher email already exists")
    teacher = Teacher(**payload.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@app.delete("/users/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    db.delete(teacher)
    db.commit()


# --- Students ---
@app.get("/users/students", response_model=list[StudentResponse])
def list_students(auth_user_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Student)
    if auth_user_id is not None:
        query = query.filter(Student.auth_user_id == auth_user_id)
    return query.order_by(Student.id.asc()).all()


@app.get("/users/students/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@app.post("/users/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    if db.query(Student).filter((Student.email == payload.email) | (Student.matricule == payload.matricule)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student email or matricule already exists")
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.delete("/users/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    db.delete(student)
    db.commit()


# --- Subjects ---
@app.get("/users/subjects", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.id.asc()).all()


@app.post("/users/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    if db.query(Subject).filter(Subject.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Subject code already exists")
    subject = Subject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@app.delete("/users/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.delete(subject)
    db.commit()


# --- Supervisors ---
@app.get("/users/supervisors", response_model=list[SupervisorResponse])
def list_supervisors(exam_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(SupervisorAssignment)
    if exam_id is not None:
        query = query.filter(SupervisorAssignment.exam_id == exam_id)
    return query.order_by(SupervisorAssignment.id.asc()).all()


@app.post("/users/supervisors", response_model=SupervisorResponse, status_code=status.HTTP_201_CREATED)
def assign_supervisor(payload: SupervisorCreate, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    existing = (
        db.query(SupervisorAssignment)
        .filter(
            SupervisorAssignment.exam_id == payload.exam_id,
            SupervisorAssignment.teacher_id == payload.teacher_id,
        )
        .first()
    )
    if existing:
        return existing
    assignment = SupervisorAssignment(
        exam_id=payload.exam_id,
        teacher_id=payload.teacher_id,
        teacher_name=teacher.full_name,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@app.delete("/users/supervisors/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_supervisor(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(SupervisorAssignment).filter(SupervisorAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supervisor assignment not found")
    db.delete(assignment)
    db.commit()
