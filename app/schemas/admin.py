from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    trim: Optional[str] = None
    color: Optional[str] = None
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    emission_standard: Optional[str] = None
    fuel_consumption: Optional[float] = None
    drive_type: Optional[str] = None
    mileage: Optional[int] = None
    price: Optional[float] = None
    owner_count: Optional[int] = None
    is_verified: Optional[bool] = None
    report_score: Optional[float] = None
    score_verdict: Optional[str] = None
    score_technical: Optional[float] = None
    score_service_history: Optional[float] = None
    score_accidents: Optional[float] = None
    score_owners: Optional[float] = None
    score_tech_inspection: Optional[float] = None


class HistoryRecordUpdate(BaseModel):
    event_type: Optional[str] = None
    event_date: Optional[datetime] = None
    title: Optional[str] = None
    description: Optional[str] = None
    odometer: Optional[int] = None
    mileage_confirmed: Optional[bool] = None
    location: Optional[str] = None
    source: Optional[str] = None
    source_reference: Optional[str] = None
    tech_inspection_passed: Optional[bool] = None
    next_inspection_date: Optional[datetime] = None
    damage_severity: Optional[str] = None


class HistoryPartUpdate(BaseModel):
    part_name: Optional[str] = None
    action: Optional[str] = None
    note: Optional[str] = None


class AccidentDamageUpdate(BaseModel):
    part_name: Optional[str] = None
    severity: Optional[str] = None


class UserAdminOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class ReportAdminOut(BaseModel):
    id: int
    vin: str
    requested_by: Optional[int]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
