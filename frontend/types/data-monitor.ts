export type SourceStatus = "LIVE" | "LAGGING" | "DEGRADED" | "OFFLINE";

export interface DataSourceHealth {
  id: string;
  name: string;
  sourceType: "NWP" | "IMD Observations" | "Satellite" | "Reanalysis" | "Geospatial";
  provider: string;
  status: SourceStatus;
  lastUpdate: string;
  recordCount: string;
  latencySeconds: number;
  coveragePct: number;
  qualityScorePct: number;
  anomalyCount: number;
}

export interface IngestionLogEntry {
  id: string;
  timestamp: string;
  source: string;
  cycle: string;
  recordsIngested: number;
  status: "SUCCESS" | "WARNING" | "FAILED";
  message: string;
}

export interface DataMonitorResponse {
  timestamp: string;
  overallStatus: "OPTIMAL" | "ATTENTION" | "CRITICAL";
  activeSources: number;
  totalDailyRecords: string;
  avgLatencyMin: number;
  sources: DataSourceHealth[];
  recentLogs: IngestionLogEntry[];
}
