from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Checkeko API"
    app_env: str = "development"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173"
    )
    fact_check_api_key: str | None = None
    database_path: str = "checkeko.db"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
