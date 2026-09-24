from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_uncertainty():
    return JSONResponse(status_code=501, content={"message": "Uncertainty model not yet implemented"})

@router.get("/quantiles")
async def get_uncertainty_quantiles():
    return JSONResponse(status_code=501, content={"message": "Uncertainty model not yet implemented"})
