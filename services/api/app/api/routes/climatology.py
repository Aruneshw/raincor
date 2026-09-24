from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/monsoon")
async def get_climatology():
    return JSONResponse(status_code=501, content={"message": "Climatology model not yet implemented"})
