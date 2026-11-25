import os
os.environ["DATABASE_URL"] = "sqlite:///./test_grade.db"

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app, compute_stats
from app.models import Grade

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_compute_stats_unit():
    grades = [
        Grade(exam_id=1, subject_name="GL", student_id=1, student_matricule="2201", student_name="A", score=15.0),
        Grade(exam_id=1, subject_name="GL", student_id=2, student_matricule="2202", student_name="B", score=9.0),
    ]
    stats = compute_stats(grades)
    assert stats.count == 2
    assert stats.average == 12.0
    assert stats.highest == 15.0
    assert stats.pass_rate == 50.0


def test_grade_crud_csv_and_publish_integration():
    r = client.post(
        "/grades",
        json={
            "exam_id": 1,
            "subject_name": "Génie Logiciel",
            "student_id": 1,
            "student_matricule": "2201843",
            "student_name": "Yasmine Ben Amor",
            "score": 14.5,
        },
    )
    assert r.status_code == 201

    csv_content = b"student_id,matricule,student_name,score\n2,2201921,Aziz Chaabane,12.75\n"
    imp = client.post(
        "/grades/import-csv",
        data={"exam_id": "1", "subject_name": "Génie Logiciel"},
        files={"file": ("grades.csv", csv_content, "text/csv")},
    )
    assert imp.status_code == 200
    assert len(imp.json()) == 1

    with patch("app.main.publish_event", new_callable=AsyncMock) as mock_pub:
        pub = client.post("/grades/publish", json={"exam_id": 1})
        assert pub.status_code == 200
        assert pub.json()["published_count"] == 2
        assert mock_pub.called

    stats = client.get("/grades/stats?exam_id=1")
    assert stats.status_code == 200
    assert stats.json()["count"] == 2
