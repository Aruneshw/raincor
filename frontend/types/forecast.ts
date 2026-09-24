import { GridCell } from "./grid";

export type ForecastLeadTime = "T+6h" | "T+12h" | "T+24h" | "T+48h" | "T+72h";

export type ForecastDisplayMode = "nwp" | "bias_corrected" | "anomaly";

export interface TimeSeriesPoint {
  time: string;
  nwpMm: number;
  correctedMm: number;
  observedMm?: number;
  p10Mm: number;
  p90Mm: number;
}

export interface ExceedanceProbabilities {
  light15: number;      // > 15 mm
  heavy64: number;      // > 64.5 mm
  veryHeavy115: number; // > 115.5 mm
  extreme204: number;   // > 204.5 mm
}

export interface ForecastResponse {
  timestamp: string;
  leadTime: ForecastLeadTime;
  displayMode: ForecastDisplayMode;
  totalGrids: number;
  heavyRainGridsCount: number;
  transitionGridsCount: number;
  averageRainfallMm: number;
  maxRainfallMm: number;
  grids: GridCell[];
}

export interface GridTimeSeriesResponse {
  gridId: string;
  state: string;
  district: string;
  series: TimeSeriesPoint[];
}
