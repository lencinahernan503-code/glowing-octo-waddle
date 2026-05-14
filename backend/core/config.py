from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./tienda_ropa.db"
    SECRET_KEY: str = "cambia-esto-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    GOOGLE_CLIENT_ID: str = ""

    MERCADOPAGO_ACCESS_TOKEN: str = ""

    # Email / SMTP
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@tiendaropa.com"
    MAIL_FROM_NAME: str = "TiendaRopa"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    EMAILS_ENABLED: bool = False  # Poner True cuando configures las credenciales SMTP

    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000"  # separar con coma para múltiples

    # Subida de imágenes (local por defecto, S3 en producción)
    UPLOAD_DIR: str = "uploads"
    MAX_IMAGE_SIZE_MB: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
