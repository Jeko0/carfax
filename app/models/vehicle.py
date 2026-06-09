from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(17), unique=True, index=True, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    trim = Column(String)
    color = Column(String)
    engine = Column(String)
    transmission = Column(String)
    fuel_type = Column(String)
    emission_standard = Column(String)        # Euro 6, Euro 5, 0 g/km (EV), etc.
    fuel_consumption = Column(Float)          # L/100km; NULL for EVs
    drive_type = Column(String)               # FWD, RWD, AWD
    mileage = Column(Integer)
    price = Column(Float)

    owner_count = Column(Integer, default=0)  # registered owners in Georgia
    is_verified = Column(Boolean, default=False)

    # Overall TOPSIS/composite score (0–100)
    report_score = Column(Float)
    score_verdict = Column(String)            # e.g. "კარგი მდგომარეობა"

    # Sub-scores used for comparison page bars (0–100)
    score_technical = Column(Float)
    score_service_history = Column(Float)
    score_accidents = Column(Float)
    score_owners = Column(Float)
    score_tech_inspection = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    history_records = relationship("VehicleHistory", back_populates="vehicle", cascade="all, delete-orphan")


class VehicleHistory(Base):
    __tablename__ = "vehicle_history"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    # service | accident | tech_inspection | ownership
    event_type = Column(String, nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    title = Column(String)                    # short headline shown on the timeline card
    description = Column(Text)
    odometer = Column(Integer)
    mileage_confirmed = Column(Boolean, default=False)  # odometer officially verified
    location = Column(String)
    source = Column(String)                   # service centre / authority name
    source_reference = Column(String)         # incident / inspection reference number

    # tech_inspection events
    tech_inspection_passed = Column(Boolean)  # NULL for non-inspection events
    next_inspection_date = Column(DateTime(timezone=True))

    # accident events
    damage_severity = Column(String)          # minor | medium | significant | critical

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="history_records")
    parts = relationship("HistoryPart", back_populates="history_record", cascade="all, delete-orphan")
    accident_damages = relationship("AccidentDamage", back_populates="history_record", cascade="all, delete-orphan")


class HistoryPart(Base):
    """Parts replaced, checked, or repaired in a service or accident event."""
    __tablename__ = "history_parts"

    id = Column(Integer, primary_key=True, index=True)
    history_id = Column(Integer, ForeignKey("vehicle_history.id"), nullable=False)
    part_name = Column(String, nullable=False)
    # replaced | checked | repaired
    action = Column(String, nullable=False)
    note = Column(String)

    history_record = relationship("VehicleHistory", back_populates="parts")


class AccidentDamage(Base):
    """Per-part damage detail for accident history events."""
    __tablename__ = "accident_damages"

    id = Column(Integer, primary_key=True, index=True)
    history_id = Column(Integer, ForeignKey("vehicle_history.id"), nullable=False)
    part_name = Column(String, nullable=False)
    # none | cosmetic | minor | moderate | major
    severity = Column(String, nullable=False)

    history_record = relationship("VehicleHistory", back_populates="accident_damages")
