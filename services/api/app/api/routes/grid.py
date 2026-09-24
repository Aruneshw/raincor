from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("")
async def get_grid():
    return JSONResponse(status_code=501, content={"message": "Grid model not yet implemented"})
