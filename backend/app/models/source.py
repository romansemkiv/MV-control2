from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    quartz_input: Mapped[int] = mapped_column(unique=True)
    label: Mapped[str] = mapped_column(String(100), default="")


class UserAccessSource(Base):
    __tablename__ = "user_access_sources"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(primary_key=True)
