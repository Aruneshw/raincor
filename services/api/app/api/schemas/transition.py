from typing import List
from pydantic import BaseModel, Field, ConfigDict
from .forecast import RegimeType, ConfidenceLevel

class TransitionHotspot(BaseModel):
    gridId: str
    state: str
    district: str
    lat: float
    lon: float
    currentRegime: RegimeType
    targetRegime: RegimeType
    probability: float
    nwpLagHours: int
    neighbourConsistency: float
    confidence: ConfidenceLevel
    rainfallMm: float

class DominantTransition(BaseModel):
    from_: RegimeType = Field(alias="from")
    to: RegimeType
    count: int
    pct: float
    
    model_config = ConfigDict(populate_by_name=True)

class TransitionResponse(BaseModel):
    timestamp: str
    totalTransitioningGrids: int
    hotspots: List[TransitionHotspot]
    averageLagHours: float
    dominantTransitions: List[DominantTransition]
