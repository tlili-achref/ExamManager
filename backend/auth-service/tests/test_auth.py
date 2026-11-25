import os
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"

from fastapi.testclient import TestClient
from app.database import Base, engine
from app.main import app
from app.security import create_access_token, decode_token, hash_password, verify_password

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_password_hashing_and_jwt_unit():
    hashed = hash_password("exammanager")
    assert hashed != "exammanager"
    assert verify_password("exammanager", hashed)
    assert not verify_password("wrong", hashed)

    token = create_access_token(1, "admin@isi.utm.tn", "ADMIN", "Amine Ben Amor")
    decoded = decode_token(token)
    assert decoded["sub"] == "1"
    assert decoded["role"] == "ADMIN"


def test_register_login_refresh_me_integration():
    reg = client.post(
        "/auth/register",
        json={
            "email": "test.teacher@isi.utm.tn",
            "password": "password123",
            "full_name": "Leila Trabelsi",
            "role": "TEACHER",
        },
    )
    assert reg.status_code == 201
    assert reg.json()["role"] == "TEACHER"

    dup = client.post(
        "/auth/register",
        json={
            "email": "test.teacher@isi.utm.tn",
            "password": "password123",
            "full_name": "Leila Trabelsi",
            "role": "TEACHER",
        },
    )
    assert dup.status_code == 409
    assert {"timestamp", "status", "message", "path"}.issubset(dup.json().keys())

    login = client.post(
        "/auth/login",
        json={"email": "test.teacher@isi.utm.tn", "password": "password123"},
    )
    assert login.status_code == 200
    tokens = login.json()
    assert "access_token" in tokens and "refresh_token" in tokens

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "test.teacher@isi.utm.tn"

    ref = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert ref.status_code == 200
    assert ref.json()["access_token"]
