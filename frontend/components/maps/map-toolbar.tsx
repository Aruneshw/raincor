"use client";

import React from "react";
import { Layers, CloudRain, Wind, Activity, Eye, Compass, Maximize2 } from "lucide-react";
import { useMapStore, MapLayerType, ViewModeType } from "@/store/map-store";
import { useForecastStore } from "@/store/forecast-store";
import { ForecastDisplayMode } from "@/types/forecast";
import { INDIAN_REGIONS } from "@/lib/constants";
import { useFilterStore } from "@/store/filter-store";

export const MapToolbar: React.FC = () => {
  const { selectedLayer, setSelectedLayer, viewMode, setViewMode } = useMapStore();
  const { displayMode, setDisplayMode } = useForecastStore();
  const { selectedRegion, setSelectedRegion } = useFilterStore();

  const layers: Array<{ id: MapLayerType; label: string; icon: React.ReactNode }> = [
    { id: "rainfall", label: "Precipitation", icon: <CloudRain className="w-3.5 h-3.5" /> },
    { id: "regime", label: "Regime", icon: <Wind className="w-3.5 h-3.5" /> },
    { id: "transition", label: "Transition", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "uncertainty", label: "Uncertainty", icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const modes: Array<{ id: ForecastDisplayMode; label: string }> = [
    { id: "nwp", label: "Raw NWP" },
    { id: "bias_corrected", label: "Bias Corrected" },
    { id: "anomaly", label: "Anomaly" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-clay">
      {/* Model Mode Selector */}
      <div className="flex items-center gap-1.5 bg-[#EEF4FA] p-1 rounded-xl">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setDisplayMode(mode.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              displayMode === mode.id
                ? "bg-white text-navy shadow-sm"
                : "text-slate-600 hover:text-navy hover:bg-white/40"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Layer Selector */}
      <div className="flex items-center gap-1 bg-[#EEF4FA] p-1 rounded-xl">
        {layers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => setSelectedLayer(layer.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedLayer === layer.id
                ? "bg-brand-blue text-white shadow-sm"
                : "text-slate-600 hover:text-navy hover:bg-white/40"
            }`}
          >
            {layer.icon}
            <span>{layer.label}</span>
          </button>
        ))}
      </div>

      {/* Region & View Mode Filters */}
      <div className="flex items-center gap-2">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="text-xs bg-white border border-slate-200 text-navy font-medium rounded-xl px-2.5 py-1.5 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
        >
          {INDIAN_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
              viewMode === "grid" ? "bg-white text-navy font-semibold shadow-xs" : "text-slate-500"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("district")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
              viewMode === "district" ? "bg-white text-navy font-semibold shadow-xs" : "text-slate-500"
            }`}
          >
            District
          </button>
        </div>
      </div>
    </div>
  );
};
