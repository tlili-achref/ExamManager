from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./room.db"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
