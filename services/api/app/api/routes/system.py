from fastapi import APIRouter, Body
from typing import Dict, Any
from ...services.met_service import met_service
from ..schemas.system import DataMonitorResponse, ModelRegistryResponse, OperationalSettings

router = APIRouter()

@router.get("/data-health", response_model=DataMonitorResponse)
async def get_data_health():
    """
    Returns operational ingestion pipeline health across 6 telemetry feeds.
    """
    return met_service.get_data_health()

@router.get("/models", response_model=ModelRegistryResponse)
async def get_models():
    """
    Returns registered operational models (MoE, LightGBM Regime, Quantile Mapping, NCUM).
    """
    return met_service.get_models_registry()

@router.get("/settings", response_model=OperationalSettings)
async def get_settings():
    """
    Returns current operational threshold settings, alert routing, and MoE parameters.
    """
    return met_service.get_settings()

@router.post("/settings", response_model=OperationalSettings)
async def update_settings(payload: Dict[str, Any] = Body(...)):
    """
    Updates operational thresholds, alert rules, and forecast parameters.
    """
    return met_service.update_settings(payload)
