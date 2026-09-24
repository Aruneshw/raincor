from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.exceptions import setup_exception_handlers
from .api.routes import (
    forecast,
    regime,
    transition,
    uncertainty,
    verification,
    climatology,
    system,
    grid,
    district,
    alerts
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for RainMind - AI-powered regime-aware rainfall forecast post-processing system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
setup_exception_handlers(app)

# API V1 Routes
app.include_router(forecast.router, prefix=f"{settings.API_V1_STR}/forecast", tags=["Forecast"])
app.include_router(regime.router, prefix=f"{settings.API_V1_STR}/regime", tags=["Regime"])
app.include_router(transition.router, prefix=f"{settings.API_V1_STR}/transition", tags=["Transition"])
app.include_router(uncertainty.router, prefix=f"{settings.API_V1_STR}/uncertainty", tags=["Uncertainty"])
app.include_router(verification.router, prefix=f"{settings.API_V1_STR}/verification", tags=["Verification"])
app.include_router(climatology.router, prefix=f"{settings.API_V1_STR}/climatology", tags=["Climatology"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System & Data Health"])
app.include_router(grid.router, prefix=f"{settings.API_V1_STR}/grid", tags=["Grid"])
app.include_router(district.router, prefix=f"{settings.API_V1_STR}/district", tags=["District"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}

@app.get(f"{settings.API_V1_STR}/version", tags=["Health"])
def version():
    return {"version": app.version, "project": settings.PROJECT_NAME}
