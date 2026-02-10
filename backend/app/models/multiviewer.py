from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Multiviewer(Base):
    __tablename__ = "multiviewers"

    id: Mapped[int] = mapped_column(primary_key=True)
    nexx_index: Mapped[int] = mapped_column(unique=True)
    label: Mapped[str] = mapped_column(String(100), default="")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class UserAccessMV(Base):
    __tablename__ = "user_access_mvs"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    mv_id: Mapped[int] = mapped_column(primary_key=True)
