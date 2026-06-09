from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle, VehicleHistory, HistoryPart, AccidentDamage
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleWithHistory, HistoryRecordCreate, HistoryRecordOut

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post("/", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    if db.query(Vehicle).filter(Vehicle.vin == payload.vin).first():
        raise HTTPException(status_code=400, detail="VIN already exists")
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/", response_model=list[VehicleOut])
def list_vehicles(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(Vehicle).offset(skip).limit(limit).all()


@router.get("/{vin}", response_model=VehicleWithHistory)
def get_vehicle_by_vin(vin: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("/{vin}/history", response_model=HistoryRecordOut, status_code=status.HTTP_201_CREATED)
def add_history_record(vin: str, payload: HistoryRecordCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = payload.model_dump(exclude={"parts", "accident_damages"})
    record = VehicleHistory(vehicle_id=vehicle.id, **data)
    db.add(record)
    db.flush()
    for p in payload.parts:
        db.add(HistoryPart(history_id=record.id, **p.model_dump()))
    for d in payload.accident_damages:
        db.add(AccidentDamage(history_id=record.id, **d.model_dump()))
    db.commit()
    db.refresh(record)
    return record


@router.get("/{vin}/history", response_model=list[HistoryRecordOut])
def get_vehicle_history(vin: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle.history_records
