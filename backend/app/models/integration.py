from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    protocol: Mapped[str] = mapped_column(String(20))
    host: Mapped[str] = mapped_column(String(255))
    port: Mapped[int | None] = mapped_column(nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    jwt_credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_inputs: Mapped[int | None] = mapped_column(nullable=True)
    max_outputs: Mapped[int | None] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
