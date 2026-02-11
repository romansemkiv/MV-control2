from datetime import datetime

from sqlalchemy import Text, DateTime, Boolean, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StateMV(Base):
    __tablename__ = "state_mv"

    mv_id: Mapped[int] = mapped_column(primary_key=True)
    layout: Mapped[int | None] = mapped_column(nullable=True)
    font: Mapped[int | None] = mapped_column(nullable=True)
    outer_border: Mapped[int | None] = mapped_column(nullable=True)
    inner_border: Mapped[int | None] = mapped_column(nullable=True)
    output_format: Mapped[int | None] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class StateWindow(Base):
    __tablename__ = "state_windows"

    mv_id: Mapped[int] = mapped_column(primary_key=True)
    window_index: Mapped[int] = mapped_column(primary_key=True)
    pcm_bars: Mapped[int | None] = mapped_column(nullable=True)
    umd_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class StateRouting(Base):
    __tablename__ = "state_routing"

    output: Mapped[int] = mapped_column(primary_key=True)
    input: Mapped[int | None] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class RefreshStatus(Base):
    __tablename__ = "refresh_status"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    is_running: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    started_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
