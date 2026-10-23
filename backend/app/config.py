from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    app_port: int = 8000
    database_url: str = "sqlite:///./bank_regulatory.db"
    storage_backend: str = "local"
    storage_root: str = "../storage"
    qwen_base_url: str | None = None
    qwen_api_key: str | None = None
    deepseek_base_url: str | None = None
    deepseek_api_key: str | None = None
    glm_base_url: str | None = None
    glm_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def storage_path(self) -> Path:
        path = Path(self.storage_root)
        return path if path.is_absolute() else Path(__file__).resolve().parents[2] / path


@lru_cache
def get_settings() -> Settings:
    return Settings()
