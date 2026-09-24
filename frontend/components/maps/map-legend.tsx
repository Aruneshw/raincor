import React from "react";
import { PRECIPITATION_SCALE, REGIMES, REGIME_COLORS } from "@/lib/constants";
import { MapLayerType } from "@/store/map-store";

interface MapLegendProps {
  layer: MapLayerType;
}

export const MapLegend: React.FC<MapLegendProps> = ({ layer }) => {
  if (layer === "regime") {
    return (
      <div className="p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-white/80 shadow-md text-xs">
        <div className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-2">
          Meteorological Regimes
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {REGIMES.map((regime) => (
            <div key={regime} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: REGIME_COLORS[regime] }}
              />
              <span className="text-slate-700 text-[11px] truncate">{regime}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layer === "transition") {
    return (
      <div className="p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-white/80 shadow-md text-xs">
        <div className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-2">
          Transition Probability
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Stable</span>
          <div className="h-3 w-36 rounded-full bg-gradient-to-r from-slate-200 via-amber-300 to-purple-600 shadow-inner" />
          <span className="text-[11px] font-semibold text-purple-700">Transition Hotspot (&gt;70%)</span>
        </div>
      </div>
    );
  }

  if (layer === "uncertainty") {
    return (
      <div className="p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-white/80 shadow-md text-xs">
        <div className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-2">
          Uncertainty Spread (P90 - P10)
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Low (&lt;15mm)</span>
          <div className="h-3 w-36 rounded-full bg-gradient-to-r from-blue-100 via-blue-400 to-indigo-900 shadow-inner" />
          <span className="text-[11px] font-semibold text-indigo-900">High (&gt;80mm)</span>
        </div>
      </div>
    );
  }

  // Rainfall Legend (Default)
  return (
    <div className="p-3 bg-white/95 backdrop-blur-xs rounded-xl border border-white/80 shadow-md text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-navy text-[11px] uppercase tracking-wider">
          Rainfall (24h)
        </span>
        <span className="text-[10px] text-slate-400">IMD Standards</span>
      </div>
      <div className="flex items-center gap-0.5">
        {PRECIPITATION_SCALE.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className="w-7 sm:w-8 h-3.5 first:rounded-l-md last:rounded-r-md border-y border-slate-200/50"
              style={{ backgroundColor: item.color }}
              title={item.label}
            />
            <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1">
              {item.min}
            </span>
          </div>
        ))}
        <span className="text-[10px] text-slate-500 ml-1.5 font-medium">mm</span>
      </div>
    </div>
  );
};
