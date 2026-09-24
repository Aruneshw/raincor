import { create } from "zustand";

interface FilterState {
  selectedSeason: string;
  selectedRegion: string;
  selectedState: string | null;

  setSelectedSeason: (season: string) => void;
  setSelectedRegion: (region: string) => void;
  setSelectedState: (state: string | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedSeason: "Monsoon 2026",
  selectedRegion: "All India",
  selectedState: null,

  setSelectedSeason: (selectedSeason) => set({ selectedSeason }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  setSelectedState: (selectedState) => set({ selectedState }),
}));
