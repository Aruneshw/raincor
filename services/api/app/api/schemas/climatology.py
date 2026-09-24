from typing import List, Literal
from pydantic import BaseModel

ClimatologyCategory = Literal["Large Excess", "Excess", "Normal", "Deficient", "Large Deficient"]

class MonthlyClimatology(BaseModel):
    month: str
    historicalNormalMm: float
    currentSeasonMm: float
    anomalyMm: float
    departurePct: float

class SubdivisionClimatology(BaseModel):
    subdivision: str
    normalMm: float
    actualMm: float
    category: ClimatologyCategory

class ClimatologyResponse(BaseModel):
    season: str
    allIndiaMonsoonNormalMm: float
    allIndiaActualCumulativeMm: float
    cumulativeDeparturePct: float
    monthly: List[MonthlyClimatology]
    subdivisions: List[SubdivisionClimatology]
