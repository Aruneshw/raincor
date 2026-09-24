import { RegimeType } from "@/lib/constants";

export interface RegimeDistributionItem {
  regime: RegimeType;
  gridCount: number;
  percentage: number;
  meanRainfallMm: number;
  color: string;
}

export interface RegimeProbabilityMatrix {
  sourceRegime: RegimeType;
  targets: Record<RegimeType, number>;
}

export interface RegimeHistoryPoint {
  date: string;
  regime: RegimeType;
  confidence: number;
  rainfallMm: number;
}

export interface RegimeResponse {
  timestamp: string;
  distribution: RegimeDistributionItem[];
  dominantRegime: RegimeType;
  transitionRatePct: number;
  matrix: RegimeProbabilityMatrix[];
}
