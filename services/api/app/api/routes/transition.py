from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/monitor")
async def get_transition_monitor():
    return JSONResponse(status_code=501, content={"message": "Transition model not yet implemented"})
