from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routes import auth, vehicles, reports, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="CarFax API",
    description="Vehicle history and report lookup service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(reports.router)
app.include_router(admin.router)


_PRICING_PLANS = [
    {
        "id": "single",
        "name": "ერთჯერადი",
        "price": "₾9.99",
        "features": "1 VIN ანგარიში · PDF ჩამოტვირთვა",
        "popular": False,
    },
    {
        "id": "triple",
        "name": "3 ანგარიში",
        "price": "₾24.99",
        "features": "3 VIN ანგარიში · TOPSIS შედარება",
        "popular": True,
    },
]


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "CarFax API"}


@app.get("/pricing-plans", tags=["config"])
def get_pricing_plans():
    return _PRICING_PLANS
