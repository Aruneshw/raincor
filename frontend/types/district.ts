import { RegimeType } from "@/lib/constants";

export type AlertColor = "Green" | "Yellow" | "Orange" | "Red";

export interface DistrictForecast {
  districtId: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  rainfallMm: number;
  nwpRainfallMm: number;
  alertLevel: AlertColor;
  dominantRegime: RegimeType;
  regimeProbability: number;
  anomalyPct: number;
  p10Mm: number;
  p90Mm: number;
  confidence: "High" | "Medium" | "Low";
}

export interface AlertBreakdown {
  red: number;
  orange: number;
  yellow: number;
  green: number;
}

export interface DistrictResponse {
  timestamp: string;
  totalDistricts: number;
  alertSummary: AlertBreakdown;
  districts: DistrictForecast[];
}
