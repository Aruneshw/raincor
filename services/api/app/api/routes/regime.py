from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_regime():
    return JSONResponse(status_code=501, content={"message": "Regime model not yet implemented"})

@router.get("/distribution")
async def get_regime_distribution():
    return JSONResponse(status_code=501, content={"message": "Regime model not yet implemented"})
