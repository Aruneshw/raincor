import { AlertFeedResponse, OperationalAlert } from "@/types/alerts";
import { getIndiaGrids } from "@/lib/grid-generator";

export async function fetchAlertsFeed(extremeOnly = false): Promise<AlertFeedResponse> {
  const grids = getIndiaGrids();
  const alerts: OperationalAlert[] = [];

  const heavy = grids.filter((g) => g.correctedRainfallMm >= 64.5).slice(0, 5);
  heavy.forEach((g, i) => {
    alerts.push({
      id: `alt_h_${i + 1}`,
      type: "Heavy Rainfall",
      gridId: g.id,
      location: `${g.state} / ${g.district}`,
      detail: `${g.correctedRainfallMm} mm / 24h (${g.regime})`,
      timeAgo: `${8 + i * 4}m ago`,
      severity: g.correctedRainfallMm >= 115.5 ? "high" : "medium",
      lat: g.lat,
      lon: g.lon,
    });
  });

  if (!extremeOnly) {
    const transitioning = grids.filter((g) => g.isTransitioning && g.transitionTarget).slice(0, 3);
    transitioning.forEach((g, i) => {
      alerts.push({
        id: `alt_t_${i + 1}`,
        type: "Regime Transition",
        gridId: g.id,
        location: `${g.state} / ${g.district}`,
        detail: `${g.regime} → ${g.transitionTarget} (Prob: ${Math.round((g.transitionProbability || 0.72) * 100)}%)`,
        timeAgo: `${14 + i * 6}m ago`,
        severity: "medium",
        lat: g.lat,
        lon: g.lon,
      });
    });

    const uncertain = grids.filter((g) => g.confidence === "Low").slice(0, 2);
    uncertain.forEach((g, i) => {
      alerts.push({
        id: `alt_u_${i + 1}`,
        type: "High Uncertainty",
        gridId: g.id,
        location: `${g.state} / ${g.district}`,
        detail: `P10–P90: ${g.p10Mm}–${g.p90Mm} mm (Entropy: ${g.entropy})`,
        timeAgo: `${22 + i * 8}m ago`,
        severity: "high",
        lat: g.lat,
        lon: g.lon,
      });
    });
  }

  const criticalCount = alerts.filter((a) => a.severity === "high").length;
  return {
    timestamp: new Date().toISOString(),
    activeCount: alerts.length,
    criticalCount,
    alerts,
  };
}
