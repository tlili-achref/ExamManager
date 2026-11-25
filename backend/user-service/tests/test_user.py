import os
os.environ["DATABASE_URL"] = "sqlite:///./test_user.db"

from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from app.database import Base, engine
from app.main import app
from app.schemas import StudentCreate

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_student_schema_unit():
    s = StudentCreate(matricule="2201843", full_name="Yasmine Ben Amor", email="yasmine@isi.utm.tn")
    assert s.matricule == "2201843"
    with pytest.raises(ValidationError):
        StudentCreate(matricule="22", full_name="Y", email="not-an-email")


def test_user_entities_and_supervisors_integration():
    grp = client.post("/users/groups", json={"code": "GL3", "name": "3ème année GL", "student_count": 32})
    assert grp.status_code == 201
    group_id = grp.json()["id"]

    tch = client.post("/users/teachers", json={"full_name": "Leïla Trabelsi", "email": "leila@isi.utm.tn", "department": "Génie Logiciel"})
    assert tch.status_code == 201
    teacher_id = tch.json()["id"]

    stu = client.post("/users/students", json={"matricule": "2201843", "full_name": "Yasmine Ben Amor", "email": "yasmine@isi.utm.tn", "group_id": group_id})
    assert stu.status_code == 201

    sub = client.post("/users/subjects", json={"code": "GL301", "name": "Génie Logiciel", "teacher_id": teacher_id, "teacher_name": "Leïla Trabelsi", "level": "GL3", "credits": 6})
    assert sub.status_code == 201

    sup = client.post("/users/supervisors", json={"exam_id": 1, "teacher_id": teacher_id})
    assert sup.status_code == 201
    assert sup.json()["teacher_name"] == "Leïla Trabelsi"
