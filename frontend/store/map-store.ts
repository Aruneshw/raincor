import { create } from "zustand";

export type MapLayerType = "rainfall" | "regime" | "transition" | "uncertainty";
export type ViewModeType = "grid" | "district";

interface MapState {
  selectedGridId: string | null;
  selectedLayer: MapLayerType;
  viewMode: ViewModeType;
  center: [number, number];
  zoom: number;
  isInspectorOpen: boolean;
  isTimeSeriesModalOpen: boolean;
  
  selectGrid: (id: string | null) => void;
  setSelectedLayer: (layer: MapLayerType) => void;
  setViewMode: (mode: ViewModeType) => void;
  setViewport: (center: [number, number], zoom: number) => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setTimeSeriesModalOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedGridId: "G10025", // Default initial grid (Odisha / Puri depression track)
  selectedLayer: "rainfall",
  viewMode: "grid",
  center: [79.2, 22.5],
  zoom: 4.3,
  isInspectorOpen: true,
  isTimeSeriesModalOpen: false,

  selectGrid: (id) => set({ selectedGridId: id, isInspectorOpen: !!id }),
  setSelectedLayer: (selectedLayer) => set({ selectedLayer }),
  setViewMode: (viewMode) => set({ viewMode }),
  setViewport: (center, zoom) => set({ center, zoom }),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setTimeSeriesModalOpen: (isTimeSeriesModalOpen) => set({ isTimeSeriesModalOpen }),
}));
