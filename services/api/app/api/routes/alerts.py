from fastapi import APIRouter, Query
from ...services.met_service import met_service
from ..schemas.alerts import AlertFeedResponse

router = APIRouter()

@router.get("", response_model=AlertFeedResponse)
async def get_alerts():
    """
    Returns prioritized operational alerts (Heavy Rain, Rapid Transition, High Uncertainty).
    """
    return met_service.get_alerts(extreme_only=False)

@router.get("/extreme", response_model=AlertFeedResponse)
async def get_extreme_alerts():
    """
    Returns high-severity meteorological alerts exceeding critical IMD thresholds.
    """
    return met_service.get_alerts(extreme_only=True)
