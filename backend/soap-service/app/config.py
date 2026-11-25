from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    EXAM_SERVICE_URL: str = "http://exam-service:8002"
    ROOM_SERVICE_URL: str = "http://room-service:8003"
    USER_SERVICE_URL: str = "http://user-service:8004"
    GRADE_SERVICE_URL: str = "http://grade-service:8005"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
