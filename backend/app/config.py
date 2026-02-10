from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://mvcontrol:mvcontrol@db:5432/mvcontrol"
    secret_key: str = "change-me-in-production"
    session_expire_hours: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
