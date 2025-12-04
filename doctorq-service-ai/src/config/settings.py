from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Centralised application settings powered by Pydantic."""

    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="DoctorQ API", alias="APP_NAME")
    app_description: str = Field(
        default="API SaaS para gestão de clínicas DoctorQ com IA.",
        alias="APP_DESCRIPTION",
    )
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    debug: bool = Field(default=False, alias="DEBUG")

    # CORS
    cors_origins: List[str] = Field(
        default_factory=lambda: ["*"], alias="CORS_ORIGINS"
    )
    url_permitida: Optional[str] = Field(default=None, alias="URL_PERMITIDA")

    # Database
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    database_host: str = Field(default="127.0.0.1", alias="DATABASE_HOST")
    database_port: int = Field(default=5432, alias="DATABASE_PORT")
    database_name: str = Field(default="doctorq", alias="DATABASE_NAME")
    database_username: str = Field(default="postgres", alias="DATABASE_USERNAME")
    database_password: str = Field(default="postgres", alias="DATABASE_PASSWORD")

    # Cache / Redis
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")

    # Stripe Configuration
    stripe_secret_key: Optional[str] = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_publishable_key: Optional[str] = Field(
        default=None, alias="STRIPE_PUBLISHABLE_KEY"
    )
    stripe_webhook_secret: Optional[str] = Field(
        default=None, alias="STRIPE_WEBHOOK_SECRET"
    )
    stripe_mode: str = Field(default="test", alias="STRIPE_MODE")

    # MercadoPago Configuration
    mercadopago_access_token: Optional[str] = Field(
        default=None, alias="MERCADOPAGO_ACCESS_TOKEN"
    )
    mercadopago_public_key: Optional[str] = Field(
        default=None, alias="MERCADOPAGO_PUBLIC_KEY"
    )
    mercadopago_webhook_secret: Optional[str] = Field(
        default=None, alias="MERCADOPAGO_WEBHOOK_SECRET"
    )
    mercadopago_mode: str = Field(default="sandbox", alias="MERCADOPAGO_MODE")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value):
        if value is None or value == "":
            return ["*"]
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, (list, tuple)):
            return list(value)
        return ["*"]

    @computed_field
    @property
    def allowed_cors_origins(self) -> List[str]:
        """Determine the effective CORS origins."""
        if self.url_permitida:
            return [self.url_permitida]
        return self.cors_origins or ["*"]

    def build_database_url(self) -> str:
        """Build the database URL, preferring explicit DATABASE_URL when present."""
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.database_username}:"
            f"{self.database_password}@{self.database_host}:"
            f"{self.database_port}/{self.database_name}"
        )


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """Return a cached instance of application settings."""
    return AppSettings()
