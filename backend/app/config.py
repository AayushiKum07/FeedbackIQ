"""Application configuration using Pydantic Settings."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./feedbackiq.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
