from unittest.mock import AsyncMock, MagicMock, patch
import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app, validate_jwt

client = TestClient(app)


def test_jwt_validation_unit():
    token = jwt.encode(
        {"sub": "1", "role": "ADMIN", "type": "access"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    claims = validate_jwt(f"Bearer {token}")
    assert claims["role"] == "ADMIN"


def test_gateway_auth_and_status_integration():
    unauth = client.get("/api/exams")
    assert unauth.status_code == 401
    assert {"timestamp", "status", "message", "path"}.issubset(unauth.json().keys())

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    with patch("app.main.httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        status_resp = client.get("/status")
    assert status_resp.status_code == 200
    assert len(status_resp.json()["summary"]) == 3
    assert all(item["up"] for item in status_resp.json()["summary"])
