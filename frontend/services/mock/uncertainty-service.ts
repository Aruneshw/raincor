import { UncertaintyResponse } from "@/types/uncertainty";
import { getIndiaGrids } from "@/lib/grid-generator";

export async function fetchUncertaintyData(): Promise<UncertaintyResponse> {
  const grids = getIndiaGrids();
  const total = grids.length;

  const sumP10 = grids.reduce((acc, g) => acc + g.p10Mm, 0);
  const sumP50 = grids.reduce((acc, g) => acc + g.p50Mm, 0);
  const sumP90 = grids.reduce((acc, g) => acc + g.p90Mm, 0);
  const sumEntropy = grids.reduce((acc, g) => acc + g.entropy, 0);
  const highUncertaintyCount = grids.filter((g) => g.confidence === "Low").length;

  return {
    timestamp: new Date().toISOString(),
    meanP10: Number((sumP10 / total).toFixed(1)),
    meanP50: Number((sumP50 / total).toFixed(1)),
    meanP90: Number((sumP90 / total).toFixed(1)),
    meanEntropy: Number((sumEntropy / total).toFixed(2)),
    highUncertaintyGridsCount: highUncertaintyCount,
    zones: [
      {
        region: "Western Ghats (Orographic)",
        avgSpreadMm: 68.4,
        entropy: 0.38,
        confidenceDistribution: { high: 58, medium: 32, low: 10 },
      },
      {
        region: "Odisha / Bengal Depression Track",
        avgSpreadMm: 74.2,
        entropy: 0.52,
        confidenceDistribution: { high: 45, medium: 38, low: 17 },
      },
      {
        region: "Central India (Monsoon Trough)",
        avgSpreadMm: 34.6,
        entropy: 0.28,
        confidenceDistribution: { high: 72, medium: 22, low: 6 },
      },
      {
        region: "Northwest India (Transition Zone)",
        avgSpreadMm: 22.1,
        entropy: 0.64,
        confidenceDistribution: { high: 30, medium: 42, low: 28 },
      },
      {
        region: "Northeast India (Topographic)",
        avgSpreadMm: 85.0,
        entropy: 0.44,
        confidenceDistribution: { high: 50, medium: 35, low: 15 },
      },
    ],
    spreadHistogram: [
      { range: "0–10 mm", count: 184 },
      { range: "10–25 mm", count: 320 },
      { range: "25–50 mm", count: 480 },
      { range: "50–100 mm", count: 290 },
      { range: "100+ mm", count: 110 },
    ],
  };
}
