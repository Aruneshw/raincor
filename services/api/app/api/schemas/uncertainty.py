from typing import List
from pydantic import BaseModel

class ConfidenceDistribution(BaseModel):
    high: int
    medium: int
    low: int

class UncertaintyZone(BaseModel):
    region: str
    avgSpreadMm: float
    entropy: float
    confidenceDistribution: ConfidenceDistribution

class SpreadHistogramBin(BaseModel):
    range: str
    count: int

class UncertaintyResponse(BaseModel):
    timestamp: str
    meanP10: float
    meanP50: float
    meanP90: float
    meanEntropy: float
    highUncertaintyGridsCount: int
    zones: List[UncertaintyZone]
    spreadHistogram: List[SpreadHistogramBin]
