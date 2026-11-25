import csv
import io
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.events import publish_event
from app.exceptions import register_exception_handlers
from app.models import Grade
from app.schemas import (
    GradeCreate,
    GradePublishRequest,
    GradeResponse,
    GradeStatsResponse,
    GradeUpdate,
)

app = FastAPI(title="ExamManager Grade Service", version="1.0.0")
register_exception_handlers(app)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "UP", "service": "grade-service"}


def compute_stats(grades: list[Grade]) -> GradeStatsResponse:
    if not grades:
        return GradeStatsResponse(count=0, average=0.0, highest=0.0, pass_rate=0.0)
    scores = [g.score for g in grades]
    passed = sum(1 for s in scores if s >= 10.0)
    return GradeStatsResponse(
        count=len(scores),
        average=round(sum(scores) / len(scores), 2),
        highest=round(max(scores), 2),
        pass_rate=round((passed / len(scores)) * 100.0, 1),
    )


@app.get("/grades", response_model=list[GradeResponse])
def list_grades(
    exam_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    published_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(Grade)
    if exam_id is not None:
        query = query.filter(Grade.exam_id == exam_id)
    if student_id is not None:
        query = query.filter(Grade.student_id == student_id)
    if published_only:
        query = query.filter(Grade.published == True)  # noqa: E712
    return query.order_by(Grade.id.asc()).all()


@app.get("/grades/stats", response_model=GradeStatsResponse)
def get_stats(
    exam_id: int | None = Query(default=None),
    student_id: int | None = Query(default=None),
    published_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(Grade)
    if exam_id is not None:
        query = query.filter(Grade.exam_id == exam_id)
    if student_id is not None:
        query = query.filter(Grade.student_id == student_id)
    if published_only:
        query = query.filter(Grade.published == True)  # noqa: E712
    return compute_stats(query.all())


@app.post("/grades", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def upsert_grade(payload: GradeCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Grade)
        .filter(Grade.exam_id == payload.exam_id, Grade.student_id == payload.student_id)
        .first()
    )
    if existing:
        existing.score = payload.score
        existing.published = payload.published
        db.commit()
        db.refresh(existing)
        return existing
    grade = Grade(**payload.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@app.put("/grades/{grade_id}", response_model=GradeResponse)
def update_grade(grade_id: int, payload: GradeUpdate, db: Session = Depends(get_db)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    grade.score = payload.score
    db.commit()
    db.refresh(grade)
    return grade


@app.post("/grades/import-csv", response_model=list[GradeResponse])
async def import_csv(
    exam_id: int = Form(...),
    subject_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    imported: list[Grade] = []
    for row in reader:
        matricule = (row.get("matricule") or "").strip()
        name = (row.get("student_name") or row.get("name") or "").strip()
        score_str = (row.get("score") or "").strip()
        student_id = int(row.get("student_id") or 1)
        if not matricule or not name or not score_str:
            continue
        score = float(score_str)
        if not (0.0 <= score <= 20.0):
            raise HTTPException(status_code=422, detail=f"Invalid score {score} for {matricule}")
        existing = (
            db.query(Grade)
            .filter(Grade.exam_id == exam_id, Grade.student_matricule == matricule)
            .first()
        )
        if existing:
            existing.score = score
            imported.append(existing)
        else:
            grade = Grade(
                exam_id=exam_id,
                subject_name=subject_name,
                student_id=student_id,
                student_matricule=matricule,
                student_name=name,
                score=score,
                published=False,
            )
            db.add(grade)
            imported.append(grade)
    db.commit()
    for g in imported:
        db.refresh(g)
    return imported


@app.post("/grades/publish")
async def publish_grades(payload: GradePublishRequest, db: Session = Depends(get_db)):
    query = db.query(Grade)
    if payload.exam_id is not None:
        query = query.filter(Grade.exam_id == payload.exam_id)
    grades = query.all()
    subjects = sorted({g.subject_name for g in grades})
    for g in grades:
        g.published = True
    db.commit()
    await publish_event(
        "GradesPublished",
        {
            "exam_id": payload.exam_id,
            "count": len(grades),
            "subjects": subjects,
        },
    )
    return {"published_count": len(grades), "subjects": subjects}
