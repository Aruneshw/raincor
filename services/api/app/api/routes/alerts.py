from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_alerts():
    return JSONResponse(status_code=501, content={"message": "Alerts model not yet implemented"})
