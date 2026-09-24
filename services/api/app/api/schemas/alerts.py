from typing import List, Literal, Optional
from pydantic import BaseModel

AlertSeverity = Literal["high", "medium", "low"]
AlertType = Literal[
    "Heavy Rainfall",
    "Regime Transition",
    "High Uncertainty",
    "Flash Flood Risk",
    "Rapid Moisture Advection"
]

class OperationalAlert(BaseModel):
    id: str
    type: str
    gridId: str
    location: str
    detail: str
    timeAgo: str
    severity: AlertSeverity
    lat: Optional[float] = None
    lon: Optional[float] = None

class AlertFeedResponse(BaseModel):
    timestamp: str
    activeCount: int
    criticalCount: int
    alerts: List[OperationalAlert]
