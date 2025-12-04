"""
Configurações da aplicação - Universidade da Beleza
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações gerais da aplicação"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="allow")

    # Application
    APP_NAME: str = "DoctorQ Universidade da Beleza"
    APP_VERSION: str = "1.2.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8081

    # Database
    DATABASE_HOST: str = "10.11.2.81"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "doctorq_univ"
    DATABASE_USERNAME: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@10.11.2.81:5432/doctorq_univ"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 1
    REDIS_URL: str = "redis://localhost:6379/1"

    # Security
    SECRET_KEY: str = "your-secret-key-min-32-chars"
    JWT_SECRET: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    API_KEY: str = "univ_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

    # LLM Providers
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""

    # Langfuse
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,https://doctorq.app"
    URL_PERMITIDA: str = "http://localhost:3000"

    # File Storage
    UPLOAD_DIR: str = "/tmp/uploads_univ"
    MAX_UPLOAD_SIZE_MB: int = 500
    S3_BUCKET_NAME: str = "doctorq-univ"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "us-east-1"

    # Video Streaming
    MUX_TOKEN_ID: str = ""
    MUX_TOKEN_SECRET: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_API_TOKEN: str = ""

    # Blockchain
    WEB3_PROVIDER_URL: str = "https://polygon-rpc.com"
    WEB3_CHAIN_ID: int = 137
    CONTRACT_ADDRESS_CERTIFICATE: str = ""
    CONTRACT_ADDRESS_TOKEN: str = ""
    PRIVATE_KEY_WALLET: str = ""

    # Metaverso
    COLYSEUS_SERVER_URL: str = "ws://localhost:2567"
    METAVERSO_ENABLED: bool = False

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply@doctorq.app"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@doctorq.app"

    # Logging
    LOG_LEVEL: str = "INFO"
    DISABLE_SWAGGER: bool = False

    # Integração com DoctorQ Main API
    DOCTORQ_API_URL: str = "http://localhost:8080"
    DOCTORQ_API_KEY: str = "vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX"

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna lista de origens CORS"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
