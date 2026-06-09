from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional
import re
from app.database import get_db
from app.models.report import Report
from app.models.vehicle import Vehicle, VehicleHistory

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportRequest(BaseModel):
    vin: str

    @field_validator("vin")
    @classmethod
    def validate_vin(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.fullmatch(r"[A-HJ-NPR-Z0-9]{17}", v):
            raise ValueError("Invalid VIN format")
        return v


class ReportOut(BaseModel):
    vin: str
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    total_records: int
    accidents: int
    ownership_changes: int
    service_records: int
    report_id: int

    model_config = {"from_attributes": True}


@router.post("/lookup", response_model=ReportOut, status_code=status.HTTP_200_OK)
def lookup_report(payload: ReportRequest, db: Session = Depends(get_db)):
    report = Report(vin=payload.vin)
    db.add(report)
    db.commit()
    db.refresh(report)

    vehicle = db.query(Vehicle).filter(Vehicle.vin == payload.vin).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="No vehicle found for this VIN")

    records = vehicle.history_records
    return ReportOut(
        vin=vehicle.vin,
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year,
        total_records=len(records),
        accidents=sum(1 for r in records if r.event_type == "accident"),
        ownership_changes=sum(1 for r in records if r.event_type == "ownership"),
        service_records=sum(1 for r in records if r.event_type == "service"),
        report_id=report.id,
    )
