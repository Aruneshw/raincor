import { DistrictResponse, DistrictForecast } from "@/types/district";
import { getIndiaGrids } from "@/lib/grid-generator";

export async function fetchDistrictForecasts(): Promise<DistrictResponse> {
  const grids = getIndiaGrids();
  const districtMap: Record<string, typeof grids> = {};

  for (const g of grids) {
    const key = `${g.state}___${g.district}`;
    if (!districtMap[key]) districtMap[key] = [];
    districtMap[key].push(g);
  }

  let red = 0, orange = 0, yellow = 0, green = 0;
  const districts: DistrictForecast[] = [];

  for (const [key, cells] of Object.entries(districtMap)) {
    const [state, districtName] = key.split("___");
    const avgRain = Number((cells.reduce((acc, c) => acc + c.correctedRainfallMm, 0) / cells.length).toFixed(1));
    const avgNwp = Number((cells.reduce((acc, c) => acc + c.nwpRainfallMm, 0) / cells.length).toFixed(1));
    const avgLat = Number((cells.reduce((acc, c) => acc + c.lat, 0) / cells.length).toFixed(2));
    const avgLon = Number((cells.reduce((acc, c) => acc + c.lon, 0) / cells.length).toFixed(2));
    const avgAnom = Number((cells.reduce((acc, c) => acc + c.anomalyMm, 0) / cells.length).toFixed(1));
    const avgP10 = Number((cells.reduce((acc, c) => acc + c.p10Mm, 0) / cells.length).toFixed(1));
    const avgP90 = Number((cells.reduce((acc, c) => acc + c.p90Mm, 0) / cells.length).toFixed(1));

    let alertLevel: "Red" | "Orange" | "Yellow" | "Green" = "Green";
    if (avgRain >= 115.5) { alertLevel = "Red"; red++; }
    else if (avgRain >= 64.5) { alertLevel = "Orange"; orange++; }
    else if (avgRain >= 15.6) { alertLevel = "Yellow"; yellow++; }
    else { green++; }

    districts.push({
      districtId: `DIST_${state.slice(0, 3).toUpperCase()}_${districtName.replace(/\s+/g, "_").toUpperCase()}`,
      name: districtName,
      state,
      lat: avgLat,
      lon: avgLon,
      rainfallMm: avgRain,
      nwpRainfallMm: avgNwp,
      alertLevel,
      dominantRegime: cells[0].regime,
      regimeProbability: cells[0].regimeProbability,
      anomalyPct: avgAnom,
      p10Mm: avgP10,
      p90Mm: avgP90,
      confidence: avgRain < 40 ? "High" : avgP90 - avgP10 < 60 ? "Medium" : "Low",
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalDistricts: districts.length,
    alertSummary: { red, orange, yellow, green },
    districts,
  };
}
