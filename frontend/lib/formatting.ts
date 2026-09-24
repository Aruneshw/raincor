export function formatRainfall(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.0 mm";
  return `${val.toFixed(1)} mm`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0%";
  return `${(val * 100).toFixed(0)}%`;
}

export function formatMetricScore(val: number | null | undefined, precision: number = 2): string {
  if (val === null || val === undefined || isNaN(val)) return "--";
  return val.toFixed(precision);
}

export function formatGridId(id: string | number): string {
  if (typeof id === "number") {
    return `G${id.toString().padStart(5, "0")}`;
  }
  return id.startsWith("G") ? id : `G${id}`;
}

export function formatLatLon(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

export function getRainfallColor(rainfallMm: number): string {
  if (rainfallMm < 1) return "#E8EEF5";
  if (rainfallMm < 5) return "#D0E8FA";
  if (rainfallMm < 10) return "#A3D2F7";
  if (rainfallMm < 25) return "#5DAAE8";
  if (rainfallMm < 50) return "#2F80D9";
  if (rainfallMm < 100) return "#1D64B5";
  if (rainfallMm < 200) return "#F2A93B";
  if (rainfallMm < 300) return "#E05252";
  return "#8B1E8F";
}
