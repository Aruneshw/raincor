from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/data-health")
async def get_data_health():
    return JSONResponse(status_code=501, content={"message": "System monitor not yet implemented"})
