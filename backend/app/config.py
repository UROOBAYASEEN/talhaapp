from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "autowizor"

    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200   # 30 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 90        # 90 days

    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    SAFEPAY_SANDBOX: bool = True
    SAFEPAY_API_KEY: str = ""
    SAFEPAY_PUBLIC_KEY: str = ""
    SAFEPAY_WEBHOOK_SECRET: str = ""
    BACKEND_BASE_URL: str = "http://10.240.56.15:8000"

    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
