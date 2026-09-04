from dotenv import load_dotenv
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Load the project-level .env regardless of the directory from which
# uvicorn is started.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


class Settings(BaseSettings):
    # ==================================================
    # APPLICATION
    # ==================================================

    APP_NAME: str = "LMS-AI"
    ENVIRONMENT: str = "development"


    # ==================================================
    # DATABASE
    # ==================================================

    DATABASE_URL: str = "sqlite:///./learnly.db"


    # ==================================================
    # JWT / AUTHENTICATION
    # ==================================================

    JWT_SECRET: str = "learnly-super-secret-key-change-this-later"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


    # ==================================================
    # REDIS
    # ==================================================

    REDIS_URL: str = "redis://localhost:6379/0"


    # ==================================================
    # MINIO
    # ==================================================

    MINIO_ENDPOINT: str = "localhost:9000"

    MINIO_ACCESS_KEY: str = "minioadmin"

    MINIO_SECRET_KEY: str = "minioadmin"

    MINIO_BUCKET: str = "learnly"


    # ==================================================
    # AI / OLLAMA
    # ==================================================

    AI_PROVIDER: str = "ollama"

    OLLAMA_BASE_URL: str = "http://localhost:11434"

    OLLAMA_MODEL: str = "llama3.2"


    # ==================================================
    # GROQ
    # ==================================================

    GROQ_API_KEY: str = ""

    GROQ_MODEL: str = ""


    # ==================================================
    # CORS
    # ==================================================

    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "http://localhost:5175,"
        "http://127.0.0.1:5175"
    )


    # ==================================================
    # PYDANTIC SETTINGS CONFIG
    # ==================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


    # ==================================================
    # CORS LIST
    # ==================================================

    @property
    def cors_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


    # ==================================================
    # COMPATIBILITY PROPERTIES
    # ==================================================

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL


    @property
    def access_token_expire_minutes(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES


    @property
    def refresh_token_expire_days(self) -> int:
        return self.REFRESH_TOKEN_EXPIRE_DAYS


# ==================================================
# SINGLE SETTINGS INSTANCE
# ==================================================

settings = Settings()


# ==================================================
# SETTINGS DEPENDENCY
# ==================================================

def get_settings() -> Settings:
    return settings
