from typing import List, Literal, Optional, Dict
from pydantic import BaseModel
from .forecast import RegimeType, ConfidenceLevel

AlertColor = Literal["Green", "Yellow", "Orange", "Red"]

class DistrictForecast(BaseModel):
    districtId: str
    name: str
    state: str
    lat: float
    lon: float
    rainfallMm: float
    nwpRainfallMm: float
    alertLevel: AlertColor
    dominantRegime: RegimeType
    regimeProbability: float
    anomalyPct: float
    p10Mm: float
    p90Mm: float
    confidence: ConfidenceLevel

class AlertBreakdown(BaseModel):
    red: int
    orange: int
    yellow: int
    green: int

class DistrictResponse(BaseModel):
    timestamp: str
    totalDistricts: int
    alertSummary: AlertBreakdown
    districts: List[DistrictForecast]

class DistrictDetailResponse(BaseModel):
    district: DistrictForecast
    gridCount: int
    gridIds: List[str]
    timeSeries: List[Dict]
