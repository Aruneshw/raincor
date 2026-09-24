/**
 * India state boundaries GeoJSON source URL.
 * Using the publicly available simplified India states GeoJSON from datameet.
 */
export const INDIA_STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

export const INDIA_DISTRICTS_GEOJSON_URL = 
  "https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson";

/**
 * IMD Rainfall Color Ramp - Sequential (for absolute rainfall in mm/24h)
 * Based on IMD's official color scale used in operational forecast maps.
 */
export const IMD_RAINFALL_COLORS: [number, [number, number, number, number]][] = [
  [0,   [230, 240, 250, 0]],       // Transparent for no rain
  [1,   [200, 230, 245, 120]],     // Very light blue
  [5,   [140, 200, 235, 160]],     // Light blue
  [10,  [80, 170, 225, 180]],      // Blue
  [25,  [30, 130, 210, 200]],      // Medium blue
  [50,  [20, 90, 180, 220]],       // Dark blue
  [65,  [255, 200, 0, 220]],       // Yellow (IMD Heavy)
  [115, [255, 120, 0, 230]],       // Orange (IMD Very Heavy)
  [205, [220, 30, 30, 240]],       // Red (IMD Extremely Heavy)
  [300, [140, 20, 140, 255]],      // Purple (Exceptional)
];

/**
 * IMD Diverging Color Ramp - for anomalies (% change from baseline)
 * Deep red → light pink → white → light blue → deep blue
 */
export const IMD_DIVERGING_COLORS: [number, string][] = [
  [-30, "#8B1A1A"],  // > -30%
  [-20, "#C0392B"],  // -30 to -20%
  [-10, "#E67E22"],  // -20 to -10%
  [0,   "#FADBD8"],  // -10 to 0%
  [10,  "#D5E8F0"],  // 0 to 10%
  [20,  "#7FB3D8"],  // 10 to 20%
  [30,  "#2471A3"],  // 20 to 30%
];

/**
 * Get interpolated RGBA color for a given rainfall value.
 */
export function getIMDColor(rainfallMm: number): [number, number, number, number] {
  if (rainfallMm <= 0) return [230, 240, 250, 0];

  for (let i = IMD_RAINFALL_COLORS.length - 1; i >= 0; i--) {
    if (rainfallMm >= IMD_RAINFALL_COLORS[i][0]) {
      if (i === IMD_RAINFALL_COLORS.length - 1) return IMD_RAINFALL_COLORS[i][1];
      // Interpolate between this and next
      const [lowThresh, lowColor] = IMD_RAINFALL_COLORS[i];
      const [highThresh, highColor] = IMD_RAINFALL_COLORS[i + 1];
      const t = (rainfallMm - lowThresh) / (highThresh - lowThresh);
      return [
        Math.round(lowColor[0] + (highColor[0] - lowColor[0]) * t),
        Math.round(lowColor[1] + (highColor[1] - lowColor[1]) * t),
        Math.round(lowColor[2] + (highColor[2] - lowColor[2]) * t),
        Math.round(lowColor[3] + (highColor[3] - lowColor[3]) * t),
      ];
    }
  }
  return [230, 240, 250, 0];
}

/**
 * Get diverging RGBA color for anomaly value.
 */
export function getAnomalyColor(anomalyPct: number): [number, number, number, number] {
  const hex = anomalyPct <= -30 ? "#8B1A1A"
    : anomalyPct <= -20 ? "#C0392B"
    : anomalyPct <= -10 ? "#E67E22"
    : anomalyPct <= 0 ? "#FADBD8"
    : anomalyPct <= 10 ? "#D5E8F0"
    : anomalyPct <= 20 ? "#7FB3D8"
    : anomalyPct <= 30 ? "#2471A3"
    : "#1A3C5E";

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b, 210];
}
