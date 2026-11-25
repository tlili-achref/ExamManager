from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.events import publish_event
from app.exceptions import register_exception_handlers
from app.models import Exam
from app.schemas import ConflictItem, ExamCreate, ExamResponse, ExamUpdate, PlanningResponse

app = FastAPI(title="ExamManager Exam Service", version="1.0.0")
register_exception_handlers(app)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "UP", "service": "exam-service"}


def _to_minutes(t) -> int:
    return t.hour * 60 + t.minute


def detect_conflicts(exams: list[Exam]) -> list[ConflictItem]:
    conflicts: list[ConflictItem] = []
    active = [e for e in exams if e.status != "Annulé"]
    for i in range(len(active)):
        for j in range(i + 1, len(active)):
            a, b = active[i], active[j]
            if a.exam_date != b.exam_date:
                continue
            a_start, a_end = _to_minutes(a.start_time), _to_minutes(a.start_time) + a.duration_minutes
            b_start, b_end = _to_minutes(b.start_time), _to_minutes(b.start_time) + b.duration_minutes
            if not (a_start < b_end and b_start < a_end):
                continue

            if a.room_name.lower() == b.room_name.lower():
                conflicts.append(
                    ConflictItem(
                        type="ROOM_OVERLAP",
                        message=f"La salle {a.room_name} est affectée à {a.subject_name} et {b.subject_name} le {a.exam_date}.",
                        exam_a_id=a.id,
                        exam_b_id=b.id,
                        exam_date=a.exam_date,
                        start_time=a.start_time,
                        resource=a.room_name,
                    )
                )

            shared_sup = set(a.supervisor_ids or []) & set(b.supervisor_ids or [])
            if shared_sup:
                conflicts.append(
                    ConflictItem(
                        type="TEACHER_OVERLAP",
                        message=f"Chevauchement de surveillant (ID {sorted(shared_sup)[0]}) entre {a.subject_name} et {b.subject_name}.",
                        exam_a_id=a.id,
                        exam_b_id=b.id,
                        exam_date=a.exam_date,
                        start_time=a.start_time,
                        resource=f"Surveillant #{sorted(shared_sup)[0]}",
                    )
                )
    return conflicts


@app.get("/exams", response_model=list[ExamResponse])
def list_exams(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    department: str | None = Query(default=None),
    group_name: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Exam)
    if search:
        query = query.filter(Exam.subject_name.ilike(f"%{search}%"))
    if status_filter and status_filter != "Tous les statuts":
        query = query.filter(Exam.status == status_filter)
    if department and department != "Tous les départements":
        query = query.filter(Exam.department == department)
    if group_name:
        query = query.filter(Exam.group_name == group_name)
    return query.order_by(Exam.exam_date.asc(), Exam.start_time.asc()).all()


@app.get("/exams/conflicts", response_model=list[ConflictItem])
def get_conflicts(db: Session = Depends(get_db)):
    exams = db.query(Exam).all()
    return detect_conflicts(exams)


@app.get("/exams/planning", response_model=PlanningResponse)
def get_planning(db: Session = Depends(get_db)):
    exams = db.query(Exam).order_by(Exam.exam_date.asc(), Exam.start_time.asc()).all()
    return PlanningResponse(exams=exams, conflicts=detect_conflicts(exams))


@app.post("/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(**payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    await publish_event(
        "ExamCreated",
        {
            "exam_id": exam.id,
            "subject_name": exam.subject_name,
            "exam_date": str(exam.exam_date),
            "start_time": exam.start_time.strftime("%H:%M"),
            "room_name": exam.room_name,
            "group_name": exam.group_name,
        },
    )
    return exam


@app.get("/exams/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    return exam


@app.put("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: int, payload: ExamUpdate, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    db.commit()
    db.refresh(exam)
    await publish_event(
        "ExamUpdated",
        {
            "exam_id": exam.id,
            "subject_name": exam.subject_name,
            "exam_date": str(exam.exam_date),
            "start_time": exam.start_time.strftime("%H:%M"),
            "room_name": exam.room_name,
            "status": exam.status,
        },
    )
    return exam


@app.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    db.delete(exam)
    db.commit()
