export const APP_NAME = "ARJUNA";
export const APP_TAGLINE = "Monsoon Intelligence for India";
export const APP_SUBTITLE = "India Rainfall Monitoring & Forecasting System (NWP + AI + Regime Intelligence + Adaptive Bias Correction)";

export const REGIMES = [
  "Active Monsoon",
  "Break Monsoon",
  "Monsoon Low / Depression",
  "Orographic",
  "Coastal",
  "Western Disturbance",
  "Others",
] as const;

export type RegimeType = typeof REGIMES[number];

export const REGIME_COLORS: Record<RegimeType, string> = {
  "Active Monsoon": "#2F80D9",        // Primary deep sky blue
  "Break Monsoon": "#A0B2C6",         // Subdued gray-blue
  "Monsoon Low / Depression": "#7566D8", // Purple
  "Orographic": "#22A06B",            // Forest emerald green
  "Coastal": "#0284C7",               // Marine cyan blue
  "Western Disturbance": "#F2A93B",   // Amber orange
  "Others": "#64748B",                // Slate gray
};

export const IMD_THRESHOLDS = {
  TRACE: 0.1,
  LIGHT: 2.5,
  MODERATE: 15.6,
  HEAVY: 64.5,
  VERY_HEAVY: 115.6,
  EXTREMELY_HEAVY: 204.5,
} as const;

export const PRECIPITATION_SCALE = [
  { min: 0, max: 1, label: "0 mm", color: "#E8EEF5", text: "#64748B" },
  { min: 1, max: 5, label: "1-5 mm", color: "#D0E8FA", text: "#0B2A4A" },
  { min: 5, max: 10, label: "5-10 mm", color: "#A3D2F7", text: "#0B2A4A" },
  { min: 10, max: 25, label: "10-25 mm", color: "#5DAAE8", text: "#FFFFFF" },
  { min: 25, max: 50, label: "25-50 mm", color: "#2F80D9", text: "#FFFFFF" },
  { min: 50, max: 100, label: "50-100 mm", color: "#1D64B5", text: "#FFFFFF" },
  { min: 100, max: 200, label: "100-200 mm", color: "#F2A93B", text: "#0B2A4A" },
  { min: 200, max: 300, label: "200-300 mm", color: "#E05252", text: "#FFFFFF" },
  { min: 300, max: 9999, label: "300+ mm", color: "#8B1E8F", text: "#FFFFFF" },
];

export const INDIA_MAP_CONFIG = {
  CENTER: [79.2, 22.5] as [number, number], // [lon, lat]
  DEFAULT_ZOOM: 4.3,
  MIN_ZOOM: 3.5,
  MAX_ZOOM: 11,
  BOUNDS: [
    [65.0, 5.0], // southwest [lon, lat]
    [98.5, 38.5], // northeast [lon, lat]
  ] as [[number, number], [number, number]],
};

export const INDIAN_REGIONS = [
  "All India",
  "Northwest India",
  "Central India",
  "South Peninsula",
  "East & Northeast India",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar",
  "Lakshadweep",
  "Jammu and Kashmir",
  "Ladakh",
] as const;
