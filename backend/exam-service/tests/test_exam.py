import os
os.environ["DATABASE_URL"] = "sqlite:///./test_exam.db"

from datetime import date, time
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app, detect_conflicts
from app.models import Exam

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_conflict_detection_unit():
    e1 = Exam(id=1, subject_name="GL", department="GL", exam_date=date(2025, 6, 3), start_time=time(8, 30), duration_minutes=90, status="Planifié", room_name="Amphi A", group_name="GL3", supervisor_ids=[1])
    e2 = Exam(id=2, subject_name="SOA", department="GL", exam_date=date(2025, 6, 3), start_time=time(9, 0), duration_minutes=90, status="Planifié", room_name="Amphi A", group_name="RT3", supervisor_ids=[1])
    conflicts = detect_conflicts([e1, e2])
    types = {c.type for c in conflicts}
    assert "ROOM_OVERLAP" in types
    assert "TEACHER_OVERLAP" in types


def test_exam_crud_and_planning_integration():
    with patch("app.main.publish_event", new_callable=AsyncMock) as mock_pub:
        r1 = client.post(
            "/exams",
            json={
                "subject_name": "Génie Logiciel",
                "department": "Génie Logiciel",
                "exam_date": "2025-06-03",
                "start_time": "08:30:00",
                "duration_minutes": 90,
                "room_name": "Amphi A",
                "group_name": "GL3",
                "supervisor_ids": [1],
            },
        )
        assert r1.status_code == 201
        assert mock_pub.called

        r2 = client.post(
            "/exams",
            json={
                "subject_name": "Architecture SOA",
                "department": "Génie Logiciel",
                "exam_date": "2025-06-03",
                "start_time": "09:00:00",
                "duration_minutes": 90,
                "room_name": "Amphi A",
                "group_name": "RT3",
                "supervisor_ids": [],
            },
        )
        assert r2.status_code == 201

    planning = client.get("/exams/planning")
    assert planning.status_code == 200
    assert len(planning.json()["exams"]) == 2
    assert len(planning.json()["conflicts"]) == 1
