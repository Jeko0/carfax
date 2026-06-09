from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
import re


class VehicleCreate(BaseModel):
    vin: str
    make: str
    model: str
    year: int
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
    is_verified: Optional[bool] = False
    report_score: Optional[float] = None
    score_verdict: Optional[str] = None
    score_technical: Optional[float] = None
    score_service_history: Optional[float] = None
    score_accidents: Optional[float] = None
    score_owners: Optional[float] = None
    score_tech_inspection: Optional[float] = None

    @field_validator("vin")
    @classmethod
    def validate_vin(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.fullmatch(r"[A-HJ-NPR-Z0-9]{17}", v):
            raise ValueError("VIN must be 17 alphanumeric characters (excluding I, O, Q)")
        return v


class VehicleOut(BaseModel):
    id: int
    vin: str
    make: str
    model: str
    year: int
    trim: Optional[str]
    color: Optional[str]
    engine: Optional[str]
    transmission: Optional[str]
    fuel_type: Optional[str]
    emission_standard: Optional[str]
    fuel_consumption: Optional[float]
    drive_type: Optional[str]
    mileage: Optional[int]
    price: Optional[float]
    owner_count: Optional[int]
    is_verified: bool
    report_score: Optional[float]
    score_verdict: Optional[str]
    score_technical: Optional[float]
    score_service_history: Optional[float]
    score_accidents: Optional[float]
    score_owners: Optional[float]
    score_tech_inspection: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryPartCreate(BaseModel):
    part_name: str
    action: str   # replaced | checked | repaired
    note: Optional[str] = None


class HistoryPartOut(BaseModel):
    id: int
    history_id: int
    part_name: str
    action: str
    note: Optional[str]

    model_config = {"from_attributes": True}


class AccidentDamageCreate(BaseModel):
    part_name: str
    severity: str  # none | cosmetic | minor | moderate | major


class AccidentDamageOut(BaseModel):
    id: int
    history_id: int
    part_name: str
    severity: str

    model_config = {"from_attributes": True}


class HistoryRecordCreate(BaseModel):
    event_type: str
    event_date: datetime
    title: Optional[str] = None
    description: Optional[str] = None
    odometer: Optional[int] = None
    mileage_confirmed: Optional[bool] = False
    location: Optional[str] = None
    source: Optional[str] = None
    source_reference: Optional[str] = None
    tech_inspection_passed: Optional[bool] = None
    next_inspection_date: Optional[datetime] = None
    damage_severity: Optional[str] = None
    parts: list[HistoryPartCreate] = []
    accident_damages: list[AccidentDamageCreate] = []


class HistoryRecordOut(BaseModel):
    id: int
    vehicle_id: int
    event_type: str
    event_date: datetime
    title: Optional[str]
    description: Optional[str]
    odometer: Optional[int]
    mileage_confirmed: bool
    location: Optional[str]
    source: Optional[str]
    source_reference: Optional[str]
    tech_inspection_passed: Optional[bool]
    next_inspection_date: Optional[datetime]
    damage_severity: Optional[str]
    parts: list[HistoryPartOut] = []
    accident_damages: list[AccidentDamageOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class VehicleWithHistory(VehicleOut):
    history_records: list[HistoryRecordOut] = []
