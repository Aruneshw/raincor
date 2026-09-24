from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .logger import logger

class RainMindException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RainMindException)
    async def rainmind_exception_handler(request: Request, exc: RainMindException):
        logger.warning(f"Handled Error: {exc.message} (Status: {exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "status_code": exc.status_code},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Server Error on {request.url}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "status_code": 500},
        )
