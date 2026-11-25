import os
os.environ["DATABASE_URL"] = "sqlite:///./test_room.db"

from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from app.database import Base, engine
from app.main import app
from app.schemas import RoomCreate

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_room_schema_validation_unit():
    valid = RoomCreate(name="Amphi A", building="Principal", floor="RDC", capacity=120)
    assert valid.capacity == 120
    with pytest.raises(ValidationError):
        RoomCreate(name="X", building="B", capacity=0)


def test_room_crud_and_availability_integration():
    created = client.post(
        "/rooms",
        json={"name": "Amphi A", "building": "Bâtiment principal", "floor": "RDC", "capacity": 120, "available": True, "usage_rate": 78},
    )
    assert created.status_code == 201
    room_id = created.json()["id"]

    listed = client.get("/rooms")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    avail = client.get(f"/rooms/{room_id}/availability")
    assert avail.status_code == 200
    assert avail.json()["available"] is True

    updated = client.put(f"/rooms/{room_id}", json={"available": False})
    assert updated.status_code == 200
    assert updated.json()["available"] is False

    deleted = client.delete(f"/rooms/{room_id}")
    assert deleted.status_code == 204
