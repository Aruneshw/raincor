from fastapi import APIRouter
from ...services.met_service import met_service
from ..schemas.climatology import ClimatologyResponse

router = APIRouter()

@router.get("", response_model=ClimatologyResponse)
async def get_climatology():
    """
    Returns 30-year IMD monsoon climatology and subdivision-level departures.
    """
    return met_service.get_climatology()

@router.get("/monsoon", response_model=ClimatologyResponse)
async def get_monsoon_climatology():
    """
    Returns operational All-India Monsoon Rainfall (AIMR) and monthly progression.
    """
    return met_service.get_climatology()
