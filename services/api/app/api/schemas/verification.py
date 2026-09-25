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
    arjunaCsi: float

class ReliabilityBin(BaseModel):
    forecastProbability: float
    observedFrequencyNwp: float
    observedFrequencyArjuna: float
    sampleCount: int

class LeadTimeEvolutionPoint(BaseModel):
    leadTime: str
    nwpRmse: float
    arjunaRmse: float
    csiGainPct: float

class VerificationResponse(BaseModel):
    timestamp: str
    season: str
    models: List[ModelMetricSet]
    thresholdSkills: List[ThresholdSkillScore]
    reliabilityCurve: List[ReliabilityBin]
    leadTimeEvolution: List[LeadTimeEvolutionPoint]
