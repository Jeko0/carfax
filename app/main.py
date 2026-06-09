from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routes import auth, vehicles, reports


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


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "CarFax API"}
