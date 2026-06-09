from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(17), index=True, nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
