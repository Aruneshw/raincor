from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_verification():
    return JSONResponse(status_code=501, content={"message": "Verification model not yet implemented"})

@router.get("/metrics")
async def get_verification_metrics():
    return JSONResponse(status_code=501, content={"message": "Verification metrics not yet implemented"})
