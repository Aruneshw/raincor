from typing import List
from pydantic import BaseModel

class ModelMetricSet(BaseModel):
    modelName: str
    rmse: float
    ets: float
    csi: float
    pod: float
    far: float
    fss: float
    biasRatio: float

class ThresholdSkillScore(BaseModel):
    thresholdMm: float
    thresholdLabel: str
    nwpCsi: float
    mlCsi: float
    moeCsi: float
    raincorCsi: float

class ReliabilityBin(BaseModel):
    forecastProbability: float
    observedFrequencyNwp: float
    observedFrequencyRaincor: float
    sampleCount: int

class LeadTimeEvolutionPoint(BaseModel):
    leadTime: str
    nwpRmse: float
    raincorRmse: float
    csiGainPct: float

class VerificationResponse(BaseModel):
    timestamp: str
    season: str
    models: List[ModelMetricSet]
    thresholdSkills: List[ThresholdSkillScore]
    reliabilityCurve: List[ReliabilityBin]
    leadTimeEvolution: List[LeadTimeEvolutionPoint]
