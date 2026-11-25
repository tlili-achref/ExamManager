from unittest.mock import AsyncMock, MagicMock, patch
import jwt
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app, authorize_request, validate_jwt

client = TestClient(app)


def _make_token(role: str) -> str:
    return jwt.encode(
        {"sub": "1", "role": role, "type": "access"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def test_jwt_and_rbac_unit():
    token = _make_token("ADMIN")
    claims = validate_jwt(f"Bearer {token}")
    assert claims["role"] == "ADMIN"

    # Admin cannot create exams or access grades; only Teacher can
    with pytest.raises(HTTPException) as exc_exam:
        authorize_request("ADMIN", "POST", "/api/exams")
    assert exc_exam.value.status_code == 403

    authorize_request("TEACHER", "POST", "/api/exams")
    authorize_request("TEACHER", "POST", "/api/grades/publish")

    # Only Admin can view /status
    with pytest.raises(HTTPException) as exc_status:
        authorize_request("TEACHER", "GET", "/api/status")
    assert exc_status.value.status_code == 403
    authorize_request("ADMIN", "GET", "/api/status")


def test_gateway_auth_rbac_and_status_integration():
    unauth = client.get("/api/exams")
    assert unauth.status_code == 401
    assert {"timestamp", "status", "message", "path"}.issubset(unauth.json().keys())

    teacher_headers = {"Authorization": f"Bearer {_make_token('TEACHER')}"}
    forbidden_status = client.get("/api/status", headers=teacher_headers)
    assert forbidden_status.status_code == 403

    admin_headers = {"Authorization": f"Bearer {_make_token('ADMIN')}"}
    forbidden_exam_create = client.post("/api/exams", json={}, headers=admin_headers)
    assert forbidden_exam_create.status_code == 403

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    with patch("app.main.httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        status_resp = client.get("/status", headers=admin_headers)
    assert status_resp.status_code == 200
    assert len(status_resp.json()["summary"]) == 3
    assert all(item["up"] for item in status_resp.json()["summary"])
