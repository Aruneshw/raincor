from fastapi import APIRouter, Path, HTTPException
from ...services.met_service import met_service
from ..schemas.district import DistrictResponse, DistrictDetailResponse

router = APIRouter()

@router.get("", response_model=DistrictResponse)
async def get_district():
    """
    Returns aggregated district-level forecasts and IMD alert status for all Indian districts.
    """
    return met_service.get_district_forecasts()

@router.get("/forecast", response_model=DistrictResponse)
async def get_district_forecast():
    """
    Returns district forecast summary with color alert codes (Red/Orange/Yellow/Green).
    """
    return met_service.get_district_forecasts()

@router.get("/{district_id}", response_model=DistrictDetailResponse)
async def get_district_detail(district_id: str = Path(..., description="District ID e.g. DIST_ASS_KAMRUP")):
    """
    Returns detailed district rainfall, constituent grid cells, and timeseries.
    """
    districts_resp = met_service.get_district_forecasts()
    matching = [d for d in districts_resp.districts if d.districtId.lower() == district_id.lower() or d.name.lower() in district_id.lower()]
    if not matching:
        matching = [districts_resp.districts[0]]
    
    district = matching[0]
    # Find constituent grid cells
    grids = [g for g in met_service._raw_grids if g["state"].lower() == district.state.lower() and g["district"].lower() == district.name.lower()]
    grid_ids = [g["id"] for g in grids] if grids else [met_service._raw_grids[0]["id"]]
    
    # Timeseries for primary grid
    ts = met_service.get_grid_timeseries(grid_ids[0])
    
    return DistrictDetailResponse(
        district=district,
        gridCount=len(grids) if grids else 1,
        gridIds=grid_ids,
        timeSeries=[p.model_dump() for p in ts.series]
    )
