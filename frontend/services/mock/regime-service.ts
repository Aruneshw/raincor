import { RegimeResponse, RegimeDistributionItem, RegimeProbabilityMatrix } from "@/types/regime";
import { REGIMES, REGIME_COLORS, RegimeType } from "@/lib/constants";
import { getIndiaGrids } from "@/lib/grid-generator";

export async function fetchRegimeData(): Promise<RegimeResponse> {
  const grids = getIndiaGrids();
  const total = grids.length;

  const counts: Record<RegimeType, { count: number; rainfallSum: number }> = {
    "Active Monsoon": { count: 0, rainfallSum: 0 },
    "Break Monsoon": { count: 0, rainfallSum: 0 },
    "Monsoon Low / Depression": { count: 0, rainfallSum: 0 },
    "Orographic": { count: 0, rainfallSum: 0 },
    "Coastal": { count: 0, rainfallSum: 0 },
    "Western Disturbance": { count: 0, rainfallSum: 0 },
    "Others": { count: 0, rainfallSum: 0 },
  };

  for (const g of grids) {
    counts[g.regime].count++;
    counts[g.regime].rainfallSum += g.correctedRainfallMm;
  }

  const distribution: RegimeDistributionItem[] = REGIMES.map((r) => {
    const data = counts[r];
    return {
      regime: r,
      gridCount: data.count,
      percentage: Number(((data.count / total) * 100).toFixed(1)),
      meanRainfallMm: data.count > 0 ? Number((data.rainfallSum / data.count).toFixed(1)) : 0,
      color: REGIME_COLORS[r],
    };
  });

  const matrix: RegimeProbabilityMatrix[] = REGIMES.map((source) => {
    const targets: Record<RegimeType, number> = {
      "Active Monsoon": 0.05,
      "Break Monsoon": 0.05,
      "Monsoon Low / Depression": 0.05,
      "Orographic": 0.05,
      "Coastal": 0.05,
      "Western Disturbance": 0.05,
      "Others": 0.05,
    };

    if (source === "Active Monsoon") {
      targets["Active Monsoon"] = 0.68;
      targets["Break Monsoon"] = 0.12;
      targets["Monsoon Low / Depression"] = 0.15;
    } else if (source === "Monsoon Low / Depression") {
      targets["Monsoon Low / Depression"] = 0.55;
      targets["Active Monsoon"] = 0.28;
      targets["Coastal"] = 0.12;
    } else if (source === "Break Monsoon") {
      targets["Break Monsoon"] = 0.72;
      targets["Active Monsoon"] = 0.22;
    } else if (source === "Orographic") {
      targets["Orographic"] = 0.82;
      targets["Coastal"] = 0.12;
    } else {
      targets[source] = 0.75;
    }

    return {
      sourceRegime: source,
      targets,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    distribution,
    dominantRegime: "Active Monsoon",
    transitionRatePct: 24.6,
    matrix,
  };
}
