from typing import List, Optional, Literal
from pydantic import BaseModel, Field

RegimeType = Literal[
    "Active Monsoon",
    "Break Monsoon",
    "Monsoon Low / Depression",
    "Orographic",
    "Coastal",
    "Western Disturbance",
    "Others"
]

ConfidenceLevel = Literal["High", "Medium", "Low"]
ForecastLeadTime = Literal["T+6h", "T+12h", "T+24h", "T+48h", "T+72h"]
ForecastDisplayMode = Literal["nwp", "bias_corrected", "anomaly"]

class GridCell(BaseModel):
    id: str
    lat: float
    lon: float
    state: str
    district: str
    elevationM: int
    subdivision: str
    
    nwpRainfallMm: float
    correctedRainfallMm: float
    biasMm: float
    anomalyMm: float
    
    regime: RegimeType
    regimeProbability: float
    
    isTransitioning: bool
    transitionTarget: Optional[RegimeType] = None
    transitionProbability: Optional[float] = None
    nwpRegimeLagHours: Optional[int] = None
    neighbourConsistency: Optional[float] = None
    
    p10Mm: float
    p50Mm: float
    p90Mm: float
    entropy: float
    confidence: ConfidenceLevel

class TimeSeriesPoint(BaseModel):
    time: str
    nwpMm: float
    correctedMm: float
    observedMm: Optional[float] = None
    p10Mm: float
    p90Mm: float

class ForecastResponse(BaseModel):
    timestamp: str
    leadTime: ForecastLeadTime
    displayMode: ForecastDisplayMode
    totalGrids: int
    heavyRainGridsCount: int
    transitionGridsCount: int
    averageRainfallMm: float
    maxRainfallMm: float
    grids: List[GridCell]

class GridTimeSeriesResponse(BaseModel):
    gridId: str
    state: str
    district: str
    series: List[TimeSeriesPoint]
