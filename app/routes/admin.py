from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleHistory, HistoryPart, AccidentDamage
from app.models.report import Report
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleWithHistory, HistoryRecordCreate, HistoryRecordOut
from app.schemas.vehicle import HistoryPartOut, AccidentDamageOut
from app.schemas.admin import (
    VehicleUpdate, HistoryRecordUpdate, HistoryPartUpdate, AccidentDamageUpdate,
    UserAdminOut, UserAdminUpdate, ReportAdminOut,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ── Vehicles ──────────────────────────────────────────────────────────────────

@router.get("/vehicles", response_model=list[VehicleOut])
def admin_list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query(None, description="Filter by VIN, make, or model (case-insensitive)"),
    db: Session = Depends(get_db),
):
    q = db.query(Vehicle)
    if search:
        s = f"%{search.lower()}%"
        q = q.filter(
            Vehicle.vin.ilike(s) | Vehicle.make.ilike(s) | Vehicle.model.ilike(s)
        )
    return q.order_by(Vehicle.id.desc()).offset(skip).limit(limit).all()


@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def admin_create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    if db.query(Vehicle).filter(Vehicle.vin == payload.vin).first():
        raise HTTPException(status_code=400, detail="VIN already exists")
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/vehicles/{vin}", response_model=VehicleWithHistory)
def admin_get_vehicle(vin: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/vehicles/{vin}", response_model=VehicleOut)
def admin_update_vehicle(vin: str, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/vehicles/{vin}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_vehicle(vin: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin.upper()).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()


# ── Vehicle history records ───────────────────────────────────────────────────

@router.post("/vehicles/{vin}/history", response_model=HistoryRecordOut, status_code=status.HTTP_201_CREATED)
def admin_add_history(vin: str, payload: HistoryRecordCreate, db: Session = Depends(get_db)):
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


@router.patch("/history/{record_id}", response_model=HistoryRecordOut)
def admin_update_history(record_id: int, payload: HistoryRecordUpdate, db: Session = Depends(get_db)):
    record = db.get(VehicleHistory, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="History record not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/history/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_history(record_id: int, db: Session = Depends(get_db)):
    record = db.get(VehicleHistory, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="History record not found")
    db.delete(record)
    db.commit()


# ── History parts ─────────────────────────────────────────────────────────────

@router.patch("/history/parts/{part_id}", response_model=HistoryPartOut)
def admin_update_part(part_id: int, payload: HistoryPartUpdate, db: Session = Depends(get_db)):
    part = db.get(HistoryPart, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(part, field, value)
    db.commit()
    db.refresh(part)
    return part


@router.delete("/history/parts/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_part(part_id: int, db: Session = Depends(get_db)):
    part = db.get(HistoryPart, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    db.delete(part)
    db.commit()


# ── Accident damages ──────────────────────────────────────────────────────────

@router.patch("/history/damages/{damage_id}", response_model=AccidentDamageOut)
def admin_update_damage(damage_id: int, payload: AccidentDamageUpdate, db: Session = Depends(get_db)):
    damage = db.get(AccidentDamage, damage_id)
    if not damage:
        raise HTTPException(status_code=404, detail="Damage record not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(damage, field, value)
    db.commit()
    db.refresh(damage)
    return damage


@router.delete("/history/damages/{damage_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_damage(damage_id: int, db: Session = Depends(get_db)):
    damage = db.get(AccidentDamage, damage_id)
    if not damage:
        raise HTTPException(status_code=404, detail="Damage record not found")
    db.delete(damage)
    db.commit()


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserAdminOut])
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.id).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserAdminOut)
def admin_get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def admin_update_user(user_id: int, payload: UserAdminUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports", response_model=list[ReportAdminOut])
def admin_list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    vin: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Report)
    if vin:
        q = q.filter(Report.vin == vin.upper())
    return q.order_by(Report.id.desc()).offset(skip).limit(limit).all()


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
