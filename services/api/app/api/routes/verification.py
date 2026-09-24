from fastapi import APIRouter
from ...services.met_service import met_service
from ..schemas.verification import VerificationResponse

router = APIRouter()

@router.get("", response_model=VerificationResponse)
async def get_verification():
    """
    Returns standard meteorological contingency scores (CSI, ETS, POD, FAR, FSS, RMSE).
    """
    return met_service.get_verification()

@router.get("/metrics", response_model=VerificationResponse)
async def get_verification_metrics():
    """
    Returns verification skill benchmarks comparing Raw NWP against AI models and RAINCOR.
    """
    return met_service.get_verification()
