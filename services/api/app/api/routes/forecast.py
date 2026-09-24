from fastapi import APIRouter, Query, Path
from ...services.met_service import met_service
from ..schemas.forecast import (
    ForecastResponse, GridTimeSeriesResponse, ForecastLeadTime, ForecastDisplayMode,
    ForecastMapResponse
)
from ..schemas.error_mechanism import ErrorMechanismResponse

router = APIRouter()

def normalize_lead_time(lead_time: str) -> ForecastLeadTime:
    cleaned = lead_time.replace(" ", "+").strip()
    if cleaned in ["T+6h", "T+12h", "T+24h", "T+48h", "T+72h"]:
        return cleaned  # type: ignore
    return "T+24h"

def normalize_display_mode(display_mode: str) -> ForecastDisplayMode:
    cleaned = display_mode.strip()
    if cleaned in ["nwp", "bias_corrected", "anomaly"]:
        return cleaned  # type: ignore
    return "bias_corrected"

@router.get("", response_model=ForecastResponse)
async def get_forecast(
    lead_time: str = Query("T+24h", description="Forecast lead time horizon"),
    display_mode: str = Query("bias_corrected", description="Display mode: raw nwp, bias_corrected, or anomaly")
):
    """
    Returns calibrated multi-lead rainfall forecast over Indian domain grids.
    """
    lt = normalize_lead_time(lead_time)
    dm = normalize_display_mode(display_mode)
    return met_service.get_forecast(lead_time=lt, display_mode=dm)

@router.get("/map", response_model=ForecastMapResponse)
async def get_forecast_map(
    lead_time: str = Query("T+24h", description="Forecast lead time horizon"),
    display_mode: str = Query("bias_corrected", description="Display mode: raw nwp, bias_corrected, or anomaly")
):
    """
    Returns GeoJSON FeatureCollection of rainfall forecast for DeckGL / Mapbox rendering.
    """
    lt = normalize_lead_time(lead_time)
    dm = normalize_display_mode(display_mode)
    return met_service.get_forecast_map(lead_time=lt, display_mode=dm)

@router.get("/grids/{gridId}/timeseries", response_model=GridTimeSeriesResponse)
async def get_grid_timeseries(
    gridId: str = Path(..., description="Grid cell ID, e.g. G10025 or G_0_0")
):
    """
    Returns 72h ensemble quantile trajectory and comparison time-series for a selected grid cell.
    """
    return met_service.get_grid_timeseries(gridId)

@router.get("/error-mechanisms", response_model=ErrorMechanismResponse)
async def get_error_mechanisms():
    """
    Returns spatial and physical error mechanism attribution breakdown (Spatial, Timing, Orographic, etc.).
    """
    return met_service.get_error_mechanisms()
