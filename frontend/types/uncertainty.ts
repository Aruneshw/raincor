export interface UncertaintyZone {
  region: string;
  avgSpreadMm: number;
  entropy: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface UncertaintyResponse {
  timestamp: string;
  meanP10: number;
  meanP50: number;
  meanP90: number;
  meanEntropy: number;
  highUncertaintyGridsCount: number;
  zones: UncertaintyZone[];
  spreadHistogram: Array<{
    range: string;
    count: number;
  }>;
}
