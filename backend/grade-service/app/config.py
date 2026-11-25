from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./grade.db"
    RABBITMQ_URL: str = "amqp://exammanager:exammanager_secret@rabbitmq:5672/"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
