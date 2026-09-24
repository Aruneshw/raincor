export interface MonthlyClimatology {
  month: string;
  historicalNormalMm: number; // 30-year IMD average (1991-2020)
  currentSeasonMm: number;
  anomalyMm: number;
  departurePct: number;
}

export interface SubdivisionClimatology {
  subdivision: string;
  normalMm: number;
  actualMm: number;
  category: "Large Excess" | "Excess" | "Normal" | "Deficient" | "Large Deficient";
}

export interface ClimatologyResponse {
  season: string;
  allIndiaMonsoonNormalMm: number;
  allIndiaActualCumulativeMm: number;
  cumulativeDeparturePct: number;
  monthly: MonthlyClimatology[];
  subdivisions: SubdivisionClimatology[];
}

export async function fetchClimatologyData(): Promise<ClimatologyResponse> {
  return {
    season: "Monsoon 2026 (JJAS)",
    allIndiaMonsoonNormalMm: 868.6,
    allIndiaActualCumulativeMm: 924.2,
    cumulativeDeparturePct: +6.4,
    monthly: [
      { month: "June", historicalNormalMm: 165.3, currentSeasonMm: 158.4, anomalyMm: -6.9, departurePct: -4.2 },
      { month: "July", historicalNormalMm: 280.5, currentSeasonMm: 312.2, anomalyMm: +31.7, departurePct: +11.3 },
      { month: "August", historicalNormalMm: 254.9, currentSeasonMm: 278.6, anomalyMm: +23.7, departurePct: +9.3 },
      { month: "September (Active)", historicalNormalMm: 167.9, currentSeasonMm: 175.0, anomalyMm: +7.1, departurePct: +4.2 },
    ],
    subdivisions: [
      { subdivision: "Konkan & Goa", normalMm: 2914.3, actualMm: 3240.5, category: "Excess" },
      { subdivision: "Coastal Karnataka", normalMm: 3083.8, actualMm: 3310.2, category: "Excess" },
      { subdivision: "Kerala & Mahe", normalMm: 2049.2, actualMm: 1980.4, category: "Normal" },
      { subdivision: "Odisha", normalMm: 1149.9, actualMm: 1285.0, category: "Excess" },
      { subdivision: "Assam & Meghalaya", normalMm: 1792.8, actualMm: 1690.1, category: "Normal" },
      { subdivision: "Gangetic West Bengal", normalMm: 1138.4, actualMm: 1045.2, category: "Normal" },
      { subdivision: "West Madhya Pradesh", normalMm: 876.1, actualMm: 960.8, category: "Excess" },
      { subdivision: "West Rajasthan", normalMm: 263.2, actualMm: 315.6, category: "Excess" },
      { subdivision: "East Uttar Pradesh", normalMm: 817.2, actualMm: 712.5, category: "Deficient" },
      { subdivision: "Bihar", normalMm: 1021.0, actualMm: 889.3, category: "Deficient" },
    ],
  };
}
