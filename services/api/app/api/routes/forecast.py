from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_forecast(lead_time: str = "T+24h", display_mode: str = "bias_corrected"):
    return JSONResponse(status_code=501, content={"message": "Forecast model not yet implemented"})

@router.get("/grids/{gridId}/timeseries")
async def get_grid_timeseries(gridId: str):
    return JSONResponse(status_code=501, content={"message": "Timeseries model not yet implemented"})
