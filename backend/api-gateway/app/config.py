from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    JWT_SECRET: str = "exammanager_dev_jwt_secret_key_2026_isi"
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    AUTH_SERVICE_URL: str = "http://auth-service:8001"
    EXAM_SERVICE_URL: str = "http://exam-service:8002"
    ROOM_SERVICE_URL: str = "http://room-service:8003"
    USER_SERVICE_URL: str = "http://user-service:8004"
    GRADE_SERVICE_URL: str = "http://grade-service:8005"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8006"
    SOAP_SERVICE_URL: str = "http://soap-service:8007"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
