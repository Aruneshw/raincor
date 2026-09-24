from fastapi import APIRouter, Path, HTTPException
from ...services.met_service import met_service
from ..schemas.forecast import GridCell

router = APIRouter()

@router.get("")
async def get_grid_metadata():
    """
    Returns spatial grid metadata for the 0.25 degree India domain.
    """
    total = len(met_service._raw_grids)
    return {
        "domain": "India Subcontinent",
        "resolution_deg": 0.25,
        "n_lat": 135,
        "n_lon": 129,
        "lat_bounds": [6.5, 37.5],
        "lon_bounds": [68.0, 97.5],
        "total_active_grids": total,
    }

@router.get("/{grid_id}", response_model=GridCell)
async def get_grid_cell(
    grid_id: str = Path(..., description="Grid identifier, e.g. G10025")
):
    """
    Returns complete meteorological, regime, and uncertainty status for an individual grid cell.
    """
    raw = met_service._grid_lookup.get(grid_id.lower())
    if not raw:
        raise HTTPException(status_code=404, detail=f"Grid cell '{grid_id}' not found in active domain")
    
    return GridCell(
        id=raw["id"],
        lat=raw["lat"],
        lon=raw["lon"],
        state=raw["state"],
        district=raw["district"],
        elevationM=raw["elevationM"],
        subdivision=raw["subdivision"],
        nwpRainfallMm=raw["nwpRainfallMm"],
        correctedRainfallMm=raw["correctedRainfallMm"],
        biasMm=raw["biasMm"],
        anomalyMm=raw["anomalyMm"],
        regime=raw["regime"],
        regimeProbability=raw["regimeProbability"],
        isTransitioning=raw["isTransitioning"],
        transitionTarget=raw["transitionTarget"],
        transitionProbability=raw["transitionProbability"],
        nwpRegimeLagHours=raw["nwpRegimeLagHours"],
        neighbourConsistency=raw["neighbourConsistency"],
        p10Mm=raw["p10Mm"],
        p50Mm=raw["p50Mm"],
        p90Mm=raw["p90Mm"],
        entropy=raw["entropy"],
        confidence=raw["confidence"],
    )
