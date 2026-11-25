import os
os.environ["DATABASE_URL"] = "sqlite:///./test_notification.db"

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.consumer import event_to_notification
from app.database import Base, engine
from app.main import app

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def test_event_mapping_unit():
    n1 = event_to_notification("ExamCreated", {"subject_name": "SOA", "exam_date": "2025-06-03", "start_time": "08:30", "room_name": "Amphi A"})
    assert n1.title == "Nouvel examen planifié"
    assert "SOA" in n1.message

    n2 = event_to_notification("GradesPublished", {"subjects": ["GL"], "count": 5})
    assert n2.icon == "grade"


def test_notifications_rest_integration():
    with patch("app.main.start_consumer", new_callable=AsyncMock):
        with TestClient(app) as client:
            created = client.post(
                "/notifications",
                json={"event_type": "ExamCreated", "title": "Test", "message": "Hello", "icon": "calendar"},
            )
            assert created.status_code == 201
            nid = created.json()["id"]

            unread = client.get("/notifications?unread_only=true")
            assert unread.status_code == 200
            assert len(unread.json()) == 1

            marked = client.patch(f"/notifications/{nid}/read")
            assert marked.status_code == 200
            assert marked.json()["is_read"] is True

            read_all = client.post("/notifications/read-all")
            assert read_all.status_code == 200
