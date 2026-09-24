import { GridCell } from "@/types/grid";
import { RegimeType } from "./constants";

/**
 * Approximate India landmask — returns true if a lat/lon point falls roughly
 * within the Indian subcontinent. This avoids rendering grids over the ocean.
 */
function isInsideIndia(lat: number, lon: number): boolean {
  // Basic bounding box
  if (lat < 6.5 || lat > 37.5 || lon < 68.0 || lon > 97.5) return false;

  // Arabian Sea exclusion (west coast ocean)
  if (lon < 72.0 && lat < 20.0) return false;
  if (lon < 69.0 && lat < 24.0) return false;

  // Bay of Bengal exclusion (east coast ocean)
  if (lon > 88.0 && lat < 15.0) return false;
  if (lon > 90.0 && lat < 22.0) return false;

  // Southern tip / Indian Ocean
  if (lat < 8.5 && lon > 78.5) return false;
  if (lat < 10.0 && lon < 74.5) return false;

  // Northeast — skip Myanmar side
  if (lon > 95.0 && lat < 27.0) return false;
  if (lon > 93.5 && lat < 22.0) return false;

  // Northern Pakistan/Afghanistan side
  if (lon < 70.5 && lat > 30.0) return false;
  if (lon < 72.0 && lat > 34.0) return false;
  
  // Thar Desert boundary shape (west Rajasthan tapers)
  if (lon < 70.0 && lat > 25.0 && lat < 28.0) return false;
  
  return true;
}

/**
 * Generates the full operational India 0.25° grid domain.
 */
export function generateIndiaGridDataset(step = 0.25): GridCell[] {
  const cells: GridCell[] = [];
  let gridCounter = 10001;

  const latMin = 7.0, latMax = 37.0;
  const lonMin = 68.0, lonMax = 97.0;

  const latSteps = Math.round((latMax - latMin) / step);
  const lonSteps = Math.round((lonMax - lonMin) / step);

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lonSteps; j++) {
      const lat = Number((latMin + i * step).toFixed(2));
      const lon = Number((lonMin + j * step).toFixed(2));

      if (!isInsideIndia(lat, lon)) continue;

      // Spatial pseudorandom
      const seed1 = Math.sin(lat * 3.14 + lon * 2.71) * 43758.5453;
      const seed2 = Math.cos(lat * 12.98 + lon * 78.23) * 12345.6789;
      const rand1 = seed1 - Math.floor(seed1);
      const rand2 = seed2 - Math.floor(seed2);

      // Create sweeping storm systems
      const stormSystem = Math.sin((lat - 20) * 0.5) * Math.cos((lon - 80) * 0.5);

      let baseRegime: RegimeType = "Active Monsoon";
      let baseRainfall = 0;

      // Regional characteristics
      if (lat > 10 && lat < 16 && lon > 72 && lon < 76) {
        baseRegime = "Coastal";
        baseRainfall = 80 + rand1 * 120;
      } else if (lat > 10 && lat < 20 && lon > 72 && lon < 75) {
        baseRegime = "Orographic";
        baseRainfall = 100 + rand1 * 160;
      } else if (lat > 28) {
        baseRegime = "Western Disturbance";
        baseRainfall = 10 + rand2 * 45;
      } else if (lon > 88 && lat > 22) {
        baseRegime = "Orographic";
        baseRainfall = 100 + rand1 * 150;
      } else if (lat > 18 && lat < 26 && lon > 80 && lon < 88) {
        baseRegime = stormSystem > 0.3 ? "Monsoon Low / Depression" : "Active Monsoon";
        baseRainfall = 40 + stormSystem * 100 + rand2 * 40;
      } else if (stormSystem > 0.5) {
        baseRegime = "Monsoon Low / Depression";
        baseRainfall = 60 + stormSystem * 120 + rand2 * 40;
      } else if (rand1 > 0.75 && lat > 20 && lat < 30) {
        baseRegime = "Break Monsoon";
        baseRainfall = rand2 * 8;
      } else {
        baseRegime = "Active Monsoon";
        baseRainfall = 15 + rand1 * 50;
      }

      const rawRainfall = Math.max(0, baseRainfall * (0.8 + rand2 * 0.4));

      let bias = 0;
      if (rawRainfall > 80) bias = Math.round(15 + rand1 * 30);
      else if (rawRainfall > 20) bias = Math.round((rand2 - 0.5) * 15);
      else bias = Math.round(-2 + rand1 * 3);

      const correctedRainfall = Math.max(0, Number((rawRainfall + bias).toFixed(1)));
      const anomaly = Number((correctedRainfall - baseRainfall * 0.8).toFixed(1));

      const isTransitioning = rand1 > 0.85;
      let transitionTarget: RegimeType | undefined;
      let transitionProbability: number | undefined;
      if (isTransitioning) {
        transitionTarget = "Active Monsoon";
        transitionProbability = Number((0.65 + rand2 * 0.3).toFixed(2));
      }

      const spreadFactor = 0.2 + rand1 * 0.3;
      const p50 = correctedRainfall;
      const p10 = Math.max(0, Number((p50 * (1 - spreadFactor)).toFixed(1)));
      const p90 = Number((p50 * (1 + spreadFactor * 1.5)).toFixed(1));

      const entropy = Number((0.2 + (isTransitioning ? 0.4 : 0.1) + rand2 * 0.3).toFixed(2));
      const confidence: "High" | "Medium" | "Low" =
        entropy < 0.4 ? "High" : entropy < 0.7 ? "Medium" : "Low";

      // Assign realistic state/district based on lat/lon bands
      let state = "India";
      let district = "Grid";
      if (lat > 30) { state = "Himachal Pradesh"; district = "Shimla"; }
      else if (lat > 28 && lon < 77) { state = "Rajasthan"; district = "Jaipur"; }
      else if (lat > 28) { state = "Uttar Pradesh"; district = "Lucknow"; }
      else if (lat > 25 && lon > 88) { state = "Assam"; district = "Guwahati"; }
      else if (lat > 22 && lon > 85) { state = "Jharkhand"; district = "Ranchi"; }
      else if (lat > 22 && lon < 75) { state = "Gujarat"; district = "Surat"; }
      else if (lat > 20 && lon > 80) { state = "Chhattisgarh"; district = "Raipur"; }
      else if (lat > 18 && lon < 75) { state = "Maharashtra"; district = "Pune"; }
      else if (lat > 15 && lon > 78) { state = "Andhra Pradesh"; district = "Hyderabad"; }
      else if (lat > 12 && lon < 76) { state = "Kerala"; district = "Kochi"; }
      else if (lat > 10) { state = "Tamil Nadu"; district = "Chennai"; }
      else if (lat > 8) { state = "Kerala"; district = "Thiruvananthapuram"; }

      cells.push({
        id: `G${gridCounter++}`,
        lat,
        lon,
        state,
        district,
        subdivision: "Domain",
        elevationM: Math.round(50 + rand1 * 1000),
        nwpRainfallMm: Number(rawRainfall.toFixed(1)),
        correctedRainfallMm: correctedRainfall,
        biasMm: bias,
        anomalyMm: anomaly,
        regime: baseRegime,
        regimeProbability: Number((0.70 + rand2 * 0.25).toFixed(2)),
        isTransitioning,
        transitionTarget,
        transitionProbability,
        nwpRegimeLagHours: isTransitioning ? (rand1 > 0.5 ? 6 : 12) : 0,
        neighbourConsistency: Number((0.75 + rand2 * 0.2).toFixed(2)),
        p10Mm: p10,
        p50Mm: p50,
        p90Mm: p90,
        entropy,
        confidence,
      });
    }
  }

  return cells;
}

// Cached singleton
let cachedGrids: GridCell[] | null = null;

export function getIndiaGrids(): GridCell[] {
  if (!cachedGrids) {
    cachedGrids = generateIndiaGridDataset(0.25);
  }
  return cachedGrids;
}

export function findGridById(id: string): GridCell | undefined {
  const grids = getIndiaGrids();
  return grids.find((g) => g.id.toLowerCase() === id.toLowerCase());
}
