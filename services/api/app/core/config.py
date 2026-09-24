import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "RainMind API"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # In production, these should be securely injected
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
