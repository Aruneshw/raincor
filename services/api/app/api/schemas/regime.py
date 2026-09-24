from typing import List, Dict
from pydantic import BaseModel
from .forecast import RegimeType

class RegimeDistributionItem(BaseModel):
    regime: RegimeType
    gridCount: int
    percentage: float
    meanRainfallMm: float
    color: str

class RegimeProbabilityMatrix(BaseModel):
    sourceRegime: RegimeType
    targets: Dict[RegimeType, float]

class RegimeResponse(BaseModel):
    timestamp: str
    distribution: List[RegimeDistributionItem]
    dominantRegime: RegimeType
    transitionRatePct: float
    matrix: List[RegimeProbabilityMatrix]
