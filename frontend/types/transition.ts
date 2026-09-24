import { RegimeType } from "@/lib/constants";

export interface TransitionHotspot {
  gridId: string;
  state: string;
  district: string;
  lat: number;
  lon: number;
  currentRegime: RegimeType;
  targetRegime: RegimeType;
  probability: number;
  nwpLagHours: number;
  neighbourConsistency: number;
  confidence: "High" | "Medium" | "Low";
  rainfallMm: number;
}

export interface TransitionResponse {
  timestamp: string;
  totalTransitioningGrids: number;
  hotspots: TransitionHotspot[];
  averageLagHours: number;
  dominantTransitions: Array<{
    from: RegimeType;
    to: RegimeType;
    count: number;
    pct: number;
  }>;
}
