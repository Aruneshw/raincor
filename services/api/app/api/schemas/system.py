from typing import List, Literal
from pydantic import BaseModel

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
