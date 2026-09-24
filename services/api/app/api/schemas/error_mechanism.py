from typing import List, Dict, Optional
from pydantic import BaseModel

class MechanismScore(BaseModel):
    mechanism: str
    label: str
    probability: float
    description: str

class GridMechanismItem(BaseModel):
    gridId: str
    lat: float
    lon: float
    state: str
    district: str
    dominantMechanism: str
    dominantProbability: float
    mechanisms: Dict[str, float]

class RegionalMechanismProfile(BaseModel):
    region: str
    dominantMechanism: str
    mechanisms: Dict[str, float]

class ErrorMechanismResponse(BaseModel):
    timestamp: str
    leadTime: str
    dominantMechanismNational: str
    mechanismsSummary: List[MechanismScore]
    regionalProfiles: List[RegionalMechanismProfile]
    hotspotGrids: List[GridMechanismItem]
