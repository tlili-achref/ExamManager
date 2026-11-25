from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    building: Mapped[str] = mapped_column(String(120), nullable=False)
    floor: Mapped[str] = mapped_column(String(60), nullable=False, default="RDC")
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    usage_rate: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
