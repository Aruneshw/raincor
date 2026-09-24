from fastapi import APIRouter
from ...services.met_service import met_service
from ..schemas.regime import RegimeResponse

router = APIRouter()

@router.get("", response_model=RegimeResponse)
async def get_regime():
    """
    Returns the distribution of 7 operational monsoon regimes and Markov transition matrix.
    """
    return met_service.get_regime_distribution()

@router.get("/distribution", response_model=RegimeResponse)
async def get_regime_distribution():
    """
    Returns regime distribution across India land grids.
    """
    return met_service.get_regime_distribution()

@router.get("/map")
async def get_regime_map():
    """
    Returns grid-point regime probability classification map data.
    """
    forecast = met_service.get_forecast()
    regime_cells = [
        {
            "id": g.id,
            "lat": g.lat,
            "lon": g.lon,
            "state": g.state,
            "district": g.district,
            "regime": g.regime,
            "regimeProbability": g.regimeProbability,
            "confidence": g.confidence,
        }
        for g in forecast.grids
    ]
    return {
        "timestamp": forecast.timestamp,
        "totalGrids": len(regime_cells),
        "grids": regime_cells
    }
