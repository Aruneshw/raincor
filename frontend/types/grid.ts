import { RegimeType } from "@/lib/constants";

export interface GridCell {
  id: string; // e.g., "G10234"
  lat: number;
  lon: number;
  state: string;
  district: string;
  elevationM: number;
  subdivision: string;
  
  // Meteorological Values
  nwpRainfallMm: number;
  correctedRainfallMm: number;
  biasMm: number;
  anomalyMm: number;
  
  // Regime
  regime: RegimeType;
  regimeProbability: number;
  
  // Transition
  isTransitioning: boolean;
  transitionTarget?: RegimeType;
  transitionProbability?: number;
  nwpRegimeLagHours?: number;
  neighbourConsistency?: number; // 0.0 - 1.0
  
  // Uncertainty
  p10Mm: number;
  p50Mm: number;
  p90Mm: number;
  entropy: number; // 0.0 - 1.0
  confidence: "High" | "Medium" | "Low";
}

export interface GridCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: {
      type: "Polygon" | "Point";
      coordinates: any;
    };
    properties: GridCell;
  }>;
}
