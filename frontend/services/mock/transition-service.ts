import { TransitionResponse, TransitionHotspot } from "@/types/transition";
import { getIndiaGrids } from "@/lib/grid-generator";

export async function fetchTransitionData(): Promise<TransitionResponse> {
  const grids = getIndiaGrids();
  const transitioningGrids = grids.filter((g) => g.isTransitioning && g.transitionTarget);

  const hotspots: TransitionHotspot[] = transitioningGrids.slice(0, 15).map((g) => ({
    gridId: g.id,
    state: g.state,
    district: g.district,
    lat: g.lat,
    lon: g.lon,
    currentRegime: g.regime,
    targetRegime: g.transitionTarget!,
    probability: g.transitionProbability || 0.72,
    nwpLagHours: g.nwpRegimeLagHours || 6,
    neighbourConsistency: g.neighbourConsistency || 0.81,
    confidence: g.confidence,
    rainfallMm: g.correctedRainfallMm,
  }));

  return {
    timestamp: new Date().toISOString(),
    totalTransitioningGrids: transitioningGrids.length,
    hotspots,
    averageLagHours: 6.8,
    dominantTransitions: [
      { from: "Active Monsoon", to: "Monsoon Low / Depression", count: 184, pct: 44.1 },
      { from: "Monsoon Low / Depression", to: "Coastal", count: 128, pct: 30.7 },
      { from: "Break Monsoon", to: "Active Monsoon", count: 65, pct: 15.6 },
      { from: "Active Monsoon", to: "Break Monsoon", count: 40, pct: 9.6 },
    ],
  };
}
