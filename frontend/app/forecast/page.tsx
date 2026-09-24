"use client";

import React, { useEffect, useState } from "react";
import { CloudRain, Sliders, Layers, Sparkles, AlertCircle, ArrowDownUp } from "lucide-react";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { RainfallChart } from "@/components/charts/rainfall-chart";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { useMapStore } from "@/store/map-store";
import { useForecastStore } from "@/store/forecast-store";
import { raincorApi } from "@/services/api/client";
import { ForecastResponse, ForecastLeadTime, ForecastDisplayMode } from "@/types/forecast";
import { IMD_THRESHOLDS } from "@/lib/constants";

export default function ForecastPage() {
  const { isInspectorOpen } = useMapStore();
  const { leadTime, setLeadTime, displayMode, setDisplayMode } = useForecastStore();

  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    raincorApi.getForecast(leadTime, displayMode).then((res) => {
      setForecast(res);
      setLoading(false);
    });
  }, [leadTime, displayMode]);

  const leadTimes: ForecastLeadTime[] = ["T+6h", "T+12h", "T+24h", "T+48h", "T+72h"];
  const modes: Array<{ id: ForecastDisplayMode; label: string; desc: string }> = [
    { id: "bias_corrected", label: "RAINCOR Bias Corrected", desc: "Regime-aware AI corrected precipitation" },
    { id: "nwp", label: "Raw NWP (NCUM / GFS)", desc: "Unadjusted numerical model rainfall forecast" },
    { id: "anomaly", label: "Precipitation Anomaly", desc: "Departure from 30-year IMD Normal" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Operational Control Ribbon */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Precipitation Forecast &amp; Adaptive Bias Correction
            </h2>
            <ClayBadge variant="primary">MoES AI Pipeline</ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic regime post-processing over 17,415 India grid points. Comparing numerical weather prediction with calibrated AI predictions.
          </p>
        </div>

        {/* Display Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setDisplayMode(m.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                displayMode === m.id
                  ? "clay-button-primary text-white"
                  : "clay-button-secondary text-navy hover:border-blue-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Forecast Map Area */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        <div className="flex-1 w-full min-w-0">
          <IndiaMap />
        </div>

        {isInspectorOpen && (
          <div className="w-full lg:w-auto shrink-0 animate-in slide-in-from-right duration-200">
            <GridInspector />
          </div>
        )}
      </div>

      {/* Threshold Exceedance & Lead Time Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <ClayCard className="p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Moderate Rain (&gt;15.6mm)
          </span>
          <div className="text-2xl font-bold text-navy">3,480 Grids</div>
          <p className="text-xs text-slate-500 mt-1">20.0% India Land Domain</p>
        </ClayCard>

        <ClayCard className="p-4 border-l-4 border-l-amber-400">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
            Heavy Rain (&gt;64.5mm)
          </span>
          <div className="text-2xl font-bold text-navy">1,238 Grids</div>
          <p className="text-xs text-slate-500 mt-1">Konkan, Odisha &amp; Assam track</p>
        </ClayCard>

        <ClayCard className="p-4 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
            Very Heavy (&gt;115.5mm)
          </span>
          <div className="text-2xl font-bold text-navy">392 Grids</div>
          <p className="text-xs text-slate-500 mt-1">Meghalaya &amp; Western Ghats</p>
        </ClayCard>

        <ClayCard className="p-4 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
            Extremely Heavy (&gt;204.5mm)
          </span>
          <div className="text-2xl font-bold text-navy">64 Grids</div>
          <p className="text-xs text-slate-500 mt-1">High flash flood risk</p>
        </ClayCard>
      </div>
    </div>
  );
}
