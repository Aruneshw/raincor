from typing import List, Literal, Dict, Optional
from pydantic import BaseModel, Field

SourceStatus = Literal["LIVE", "LAGGING", "DEGRADED", "OFFLINE"]
SourceType = Literal["NWP", "IMD Observations", "Satellite", "Reanalysis", "Geospatial"]

class DataSourceHealth(BaseModel):
    id: str
    name: str
    sourceType: SourceType
    provider: str
    status: SourceStatus
    lastUpdate: str
    recordCount: str
    latencySeconds: int
    coveragePct: float
    qualityScorePct: float
    anomalyCount: int

IngestionLogStatus = Literal["SUCCESS", "WARNING", "FAILED"]

class IngestionLogEntry(BaseModel):
    id: str
    timestamp: str
    source: str
    cycle: str
    recordsIngested: int
    status: IngestionLogStatus
    message: str

OverallStatus = Literal["OPTIMAL", "ATTENTION", "CRITICAL"]

class DataMonitorResponse(BaseModel):
    timestamp: str
    overallStatus: OverallStatus
    activeSources: int
    totalDailyRecords: str
    avgLatencyMin: float
    sources: List[DataSourceHealth]
    recentLogs: List[IngestionLogEntry]

# Model Registry
class ModelInfo(BaseModel):
    id: str
    name: str
    version: str
    type: str
    status: Literal["ACTIVE", "STANDBY", "CALIBRATING", "OFFLINE"]
    rmse: float
    csi: float
    latencyMs: float
    description: str

class ModelRegistryResponse(BaseModel):
    timestamp: str
    activePipeline: str
    models: List[ModelInfo]

# Settings & Operational Configuration
class ThresholdSettings(BaseModel):
    heavyThreshold: float = 64.5
    veryHeavyThreshold: float = 115.5
    extremeThreshold: float = 204.5

class ForecastSettings(BaseModel):
    defaultLeadTime: str = "T+24h"
    defaultDisplayMode: str = "bias_corrected"
    spatialResolutionDeg: float = 0.25

class AlertSettings(BaseModel):
    enableSound: bool = True
    telegramDispatch: bool = False
    smsDispatch: bool = False
    highSeverityOnly: bool = True

class ModelSettings(BaseModel):
    activeMoE: bool = True
    gnnAdvectionLayer: bool = True
    quantileRegression: bool = True
    moeWeights: Dict[str, float] = Field(default_factory=lambda: {
        "Active Monsoon": 0.40,
        "Orographic": 0.25,
        "Coastal": 0.15,
        "Depression": 0.20
    })

class OperationalSettings(BaseModel):
    thresholds: ThresholdSettings = Field(default_factory=ThresholdSettings)
    forecast: ForecastSettings = Field(default_factory=ForecastSettings)
    alerts: AlertSettings = Field(default_factory=AlertSettings)
    models: ModelSettings = Field(default_factory=ModelSettings)
    lastUpdated: Optional[str] = None
