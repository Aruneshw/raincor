import { ForecastResponse, ForecastLeadTime, ForecastDisplayMode, GridTimeSeriesResponse, TimeSeriesPoint } from "@/types/forecast";
import { getIndiaGrids, findGridById } from "@/lib/grid-generator";

export async function fetchForecastData(
  leadTime: ForecastLeadTime = "T+24h",
  displayMode: ForecastDisplayMode = "bias_corrected"
): Promise<ForecastResponse> {
  const grids = getIndiaGrids();
  
  // Apply lead time modifier
  let leadMultiplier = 1.0;
  if (leadTime === "T+6h") leadMultiplier = 0.35;
  if (leadTime === "T+12h") leadMultiplier = 0.65;
  if (leadTime === "T+24h") leadMultiplier = 1.0;
  if (leadTime === "T+48h") leadMultiplier = 1.85;
  if (leadTime === "T+72h") leadMultiplier = 2.4;

  const modifiedGrids = grids.map((grid) => {
    const raw = Number((grid.nwpRainfallMm * leadMultiplier).toFixed(1));
    const bias = Number((grid.biasMm * Math.sqrt(leadMultiplier)).toFixed(1));
    const corrected = Math.max(0, Number((raw + bias).toFixed(1)));
    const anomaly = Number((corrected - (grid.correctedRainfallMm * 0.8)).toFixed(1));

    return {
      ...grid,
      nwpRainfallMm: raw,
      correctedRainfallMm: corrected,
      biasMm: bias,
      anomalyMm: anomaly,
      p10Mm: Math.max(0, Number((corrected * 0.65).toFixed(1))),
      p50Mm: corrected,
      p90Mm: Number((corrected * 1.55).toFixed(1)),
    };
  });

  const heavyRainGridsCount = modifiedGrids.filter((g) => g.correctedRainfallMm >= 64.5).length;
  const transitionGridsCount = modifiedGrids.filter((g) => g.isTransitioning).length;
  const totalRainfall = modifiedGrids.reduce((acc, g) => acc + g.correctedRainfallMm, 0);
  const maxRainfall = Math.max(...modifiedGrids.map((g) => g.correctedRainfallMm));

  return {
    timestamp: new Date().toISOString(),
    leadTime,
    displayMode,
    totalGrids: modifiedGrids.length,
    heavyRainGridsCount,
    transitionGridsCount,
    averageRainfallMm: Number((totalRainfall / modifiedGrids.length).toFixed(1)),
    maxRainfallMm: maxRainfall,
    grids: modifiedGrids,
  };
}

export async function fetchGridTimeSeries(gridId: string): Promise<GridTimeSeriesResponse> {
  const grid = findGridById(gridId) || getIndiaGrids()[0];
  const baseMm = grid.correctedRainfallMm;

  const series: TimeSeriesPoint[] = [
    { time: "00:00", nwpMm: baseMm * 0.6, correctedMm: baseMm * 0.85, observedMm: baseMm * 0.88, p10Mm: baseMm * 0.6, p90Mm: baseMm * 1.1 },
    { time: "06:00", nwpMm: baseMm * 0.75, correctedMm: baseMm * 0.95, observedMm: baseMm * 0.98, p10Mm: baseMm * 0.7, p90Mm: baseMm * 1.25 },
    { time: "12:00", nwpMm: baseMm * 0.85, correctedMm: baseMm * 1.15, observedMm: baseMm * 1.12, p10Mm: baseMm * 0.8, p90Mm: baseMm * 1.5 },
    { time: "18:00", nwpMm: baseMm * 0.95, correctedMm: baseMm * 1.3, observedMm: baseMm * 1.25, p10Mm: baseMm * 0.95, p90Mm: baseMm * 1.7 },
    { time: "24:00", nwpMm: baseMm * 0.8, correctedMm: baseMm * 1.05, observedMm: undefined, p10Mm: baseMm * 0.75, p90Mm: baseMm * 1.45 },
    { time: "36:00", nwpMm: baseMm * 0.7, correctedMm: baseMm * 0.9, observedMm: undefined, p10Mm: baseMm * 0.6, p90Mm: baseMm * 1.3 },
    { time: "48:00", nwpMm: baseMm * 0.55, correctedMm: baseMm * 0.75, observedMm: undefined, p10Mm: baseMm * 0.45, p90Mm: baseMm * 1.15 },
    { time: "72:00", nwpMm: baseMm * 0.4, correctedMm: baseMm * 0.6, observedMm: undefined, p10Mm: baseMm * 0.35, p90Mm: baseMm * 0.95 },
  ];

  return {
    gridId: grid.id,
    state: grid.state,
    district: grid.district,
    series: series.map((s) => ({
      time: s.time,
      nwpMm: Number(s.nwpMm.toFixed(1)),
      correctedMm: Number(s.correctedMm.toFixed(1)),
      observedMm: s.observedMm !== undefined ? Number(s.observedMm.toFixed(1)) : undefined,
      p10Mm: Number(s.p10Mm.toFixed(1)),
      p90Mm: Number(s.p90Mm.toFixed(1)),
    })),
  };
}
