import { VerificationResponse, ModelMetricSet, ThresholdSkillScore, ReliabilityBin } from "@/types/verification";

export async function fetchVerificationData(): Promise<VerificationResponse> {
  const models: ModelMetricSet[] = [
    {
      modelName: "ARJUNA (Regime-Aware)",
      rmse: 14.8,
      ets: 0.54,
      csi: 0.62,
      pod: 0.84,
      far: 0.28,
      fss: 0.88,
      biasRatio: 1.04,
    },
    {
      modelName: "MoE (Mixture of Experts)",
      rmse: 17.2,
      ets: 0.49,
      csi: 0.57,
      pod: 0.80,
      far: 0.33,
      fss: 0.83,
      biasRatio: 1.08,
    },
    {
      modelName: "ML Baseline (LightGBM/CNN)",
      rmse: 19.5,
      ets: 0.43,
      csi: 0.51,
      pod: 0.76,
      far: 0.37,
      fss: 0.77,
      biasRatio: 1.12,
    },
    {
      modelName: "Raw NWP (NCUM / GFS)",
      rmse: 26.4,
      ets: 0.36,
      csi: 0.44,
      pod: 0.68,
      far: 0.46,
      fss: 0.69,
      biasRatio: 0.82,
    },
  ];

  const thresholdSkills: ThresholdSkillScore[] = [
    { thresholdMm: 15.6, thresholdLabel: "Moderate (≥15.6 mm)", nwpCsi: 0.58, mlCsi: 0.66, moeCsi: 0.71, arjunaCsi: 0.76 },
    { thresholdMm: 64.5, thresholdLabel: "Heavy (≥64.5 mm)", nwpCsi: 0.44, mlCsi: 0.51, moeCsi: 0.57, arjunaCsi: 0.62 },
    { thresholdMm: 115.5, thresholdLabel: "Very Heavy (≥115.5 mm)", nwpCsi: 0.28, mlCsi: 0.36, moeCsi: 0.43, arjunaCsi: 0.50 },
    { thresholdMm: 204.5, thresholdLabel: "Extremely Heavy (≥204.5 mm)", nwpCsi: 0.16, mlCsi: 0.24, moeCsi: 0.31, arjunaCsi: 0.41 },
  ];

  const reliabilityCurve: ReliabilityBin[] = [
    { forecastProbability: 0.1, observedFrequencyNwp: 0.18, observedFrequencyArjuna: 0.11, sampleCount: 1420 },
    { forecastProbability: 0.2, observedFrequencyNwp: 0.31, observedFrequencyArjuna: 0.22, sampleCount: 1250 },
    { forecastProbability: 0.3, observedFrequencyNwp: 0.44, observedFrequencyArjuna: 0.32, sampleCount: 980 },
    { forecastProbability: 0.4, observedFrequencyNwp: 0.52, observedFrequencyArjuna: 0.41, sampleCount: 810 },
    { forecastProbability: 0.5, observedFrequencyNwp: 0.61, observedFrequencyArjuna: 0.51, sampleCount: 750 },
    { forecastProbability: 0.6, observedFrequencyNwp: 0.73, observedFrequencyArjuna: 0.62, sampleCount: 620 },
    { forecastProbability: 0.7, observedFrequencyNwp: 0.82, observedFrequencyArjuna: 0.71, sampleCount: 540 },
    { forecastProbability: 0.8, observedFrequencyNwp: 0.89, observedFrequencyArjuna: 0.81, sampleCount: 410 },
    { forecastProbability: 0.9, observedFrequencyNwp: 0.94, observedFrequencyArjuna: 0.91, sampleCount: 290 },
  ];

  return {
    timestamp: new Date().toISOString(),
    season: "Monsoon 2026",
    models,
    thresholdSkills,
    reliabilityCurve,
    leadTimeEvolution: [
      { leadTime: "T+6h", nwpRmse: 18.2, arjunaRmse: 9.8, csiGainPct: 24.2 },
      { leadTime: "T+12h", nwpRmse: 21.4, arjunaRmse: 11.9, csiGainPct: 22.8 },
      { leadTime: "T+24h", nwpRmse: 26.4, arjunaRmse: 14.8, csiGainPct: 20.5 },
      { leadTime: "T+48h", nwpRmse: 34.1, arjunaRmse: 21.2, csiGainPct: 17.9 },
      { leadTime: "T+72h", nwpRmse: 43.6, arjunaRmse: 29.5, csiGainPct: 14.8 },
    ],
  };
}
