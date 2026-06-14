import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle, VehicleHistory, HistoryPart, AccidentDamage
from app.schemas.vehicle import (
    VehicleCreate, VehicleOut, VehicleWithHistory, HistoryRecordCreate, HistoryRecordOut,
    CompareRequest, CompareResponse, CarRawData, CarRankEntry, TopsisWeights,
)

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


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    vehicle_count = db.query(Vehicle).count()
    record_count = db.query(VehicleHistory).count()
    return {"vehicle_count": vehicle_count, "record_count": record_count}


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


# ── TOPSIS helpers ────────────────────────────────────────────────────────────

def _norm_col(values: list[float]) -> list[float]:
    denom = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / denom for v in values]


def _topsis(criteria: list[dict], raw_weights: list[float]) -> list[float]:
    """
    criteria: list of {"scores": [float, ...], "higher_is_better": bool}
    Returns a TOPSIS closeness score per alternative (same order as scores).
    """
    total_w = sum(raw_weights) or 1.0
    weights = [w / total_w for w in raw_weights]

    normed = [_norm_col(c["scores"]) for c in criteria]
    weighted = [[v * weights[ci] for v in col] for ci, col in enumerate(normed)]

    ideal = [
        max(col) if criteria[ci]["higher_is_better"] else min(col)
        for ci, col in enumerate(weighted)
    ]
    nadir = [
        min(col) if criteria[ci]["higher_is_better"] else max(col)
        for ci, col in enumerate(weighted)
    ]

    n_alts = len(criteria[0]["scores"])
    scores = []
    for i in range(n_alts):
        d_plus  = math.sqrt(sum((weighted[ci][i] - ideal[ci]) ** 2 for ci in range(len(criteria))))
        d_minus = math.sqrt(sum((weighted[ci][i] - nadir[ci]) ** 2 for ci in range(len(criteria))))
        denom = d_plus + d_minus
        scores.append(d_minus / denom if denom else 0.0)
    return scores


# ── Compare endpoint ──────────────────────────────────────────────────────────

@router.post("/compare", response_model=CompareResponse)
def compare_vehicles(payload: CompareRequest, db: Session = Depends(get_db)):
    vins = payload.vins
    vehicles = db.query(Vehicle).filter(Vehicle.vin.in_(vins)).all()

    missing = set(vins) - {v.vin for v in vehicles}
    if missing:
        raise HTTPException(status_code=404, detail=f"VINs not found: {', '.join(missing)}")

    # preserve the requested order
    v_map = {v.vin: v for v in vehicles}
    vehicles = [v_map[vin] for vin in vins]

    # collect per-vehicle stats from history
    raw_data: list[CarRawData] = []
    for v in vehicles:
        history = v.history_records
        service_count  = sum(1 for h in history if h.event_type == "service")
        accident_count = sum(1 for h in history if h.event_type == "accident")
        tech_total     = sum(1 for h in history if h.event_type == "tech_inspection")
        tech_pass      = sum(1 for h in history if h.event_type == "tech_inspection" and h.tech_inspection_passed)

        raw_data.append(CarRawData(
            vin=v.vin,
            model_label=f"{v.make} {v.model} {v.trim or ''} · {v.year}".strip(),
            year=v.year,
            fuel_type=v.fuel_type,
            emission_standard=v.emission_standard,
            fuel_consumption=v.fuel_consumption,
            drive_type=v.drive_type,
            mileage=v.mileage or 0,
            owner_count=v.owner_count or 0,
            service_count=service_count,
            accident_count=accident_count,
            tech_pass=tech_pass,
            tech_total=tech_total,
        ))

    w = payload.weights
    criteria = [
        {"scores": [float(r.service_count)  for r in raw_data], "higher_is_better": True},
        {"scores": [float(r.accident_count) for r in raw_data], "higher_is_better": False},
        {"scores": [float(r.owner_count)    for r in raw_data], "higher_is_better": False},
        {"scores": [float(r.mileage)        for r in raw_data], "higher_is_better": False},
        {"scores": [float(r.tech_pass)      for r in raw_data], "higher_is_better": True},
    ]
    raw_weights = [w.service_history, w.accidents, w.owners, w.mileage, w.tech_inspection]

    scores = _topsis(criteria, raw_weights)

    ranked = sorted(
        zip(scores, raw_data),
        key=lambda x: x[0],
        reverse=True,
    )

    ranking = [
        CarRankEntry(rank=i + 1, topsis_score=round(score, 4), car=car)
        for i, (score, car) in enumerate(ranked)
    ]

    return CompareResponse(weights_used=w, ranking=ranking)
