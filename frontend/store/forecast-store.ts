import { create } from "zustand";
import { ForecastLeadTime, ForecastDisplayMode } from "@/types/forecast";

interface ForecastState {
  leadTime: ForecastLeadTime;
  displayMode: ForecastDisplayMode;
  rainfallThreshold: number; // in mm
  comparisonModel: "nwp" | "ml" | "moe" | "arjuna";

  setLeadTime: (leadTime: ForecastLeadTime) => void;
  setDisplayMode: (displayMode: ForecastDisplayMode) => void;
  setRainfallThreshold: (rainfallThreshold: number) => void;
  setComparisonModel: (model: "nwp" | "ml" | "moe" | "arjuna") => void;
}

export const useForecastStore = create<ForecastState>((set) => ({
  leadTime: "T+24h",
  displayMode: "bias_corrected",
  rainfallThreshold: 64.5,
  comparisonModel: "arjuna",

  setLeadTime: (leadTime) => set({ leadTime }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setRainfallThreshold: (rainfallThreshold) => set({ rainfallThreshold }),
  setComparisonModel: (comparisonModel) => set({ comparisonModel }),
}));
