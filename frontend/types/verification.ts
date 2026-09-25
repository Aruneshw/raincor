export interface ModelMetricSet {
  modelName: string;
  rmse: number;       // lower is better
  ets: number;        // higher is better (0 to 1)
  csi: number;        // Critical Success Index (0 to 1)
  pod: number;        // Probability of Detection (0 to 1)
  far: number;        // False Alarm Ratio (lower is better, 0 to 1)
  fss: number;        // Fractions Skill Score
  biasRatio: number;  // 1.0 is unbiased
}

export interface ThresholdSkillScore {
  thresholdMm: number;
  thresholdLabel: string;
  nwpCsi: number;
  mlCsi: number;
  moeCsi: number;
  arjunaCsi: number;
}

export interface ReliabilityBin {
  forecastProbability: number; // e.g. 0.1, 0.2 ... 0.9
  observedFrequencyNwp: number;
  observedFrequencyArjuna: number;
  sampleCount: number;
}

export interface VerificationResponse {
  timestamp: string;
  season: string;
  models: ModelMetricSet[];
  thresholdSkills: ThresholdSkillScore[];
  reliabilityCurve: ReliabilityBin[];
  leadTimeEvolution: Array<{
    leadTime: string;
    nwpRmse: number;
    arjunaRmse: number;
    csiGainPct: number;
  }>;
}
