"use client";

import React from "react";
import { X, TrendingUp, Navigation, AlertTriangle, CloudRain, BarChart3 } from "lucide-react";
import { useMapStore } from "@/store/map-store";
import { findGridById, getIndiaGrids } from "@/lib/grid-generator";
import { formatRainfall, formatLatLon } from "@/lib/formatting";
import { ClayBadge } from "@/components/ui/clay-badge";
import { ClayButton } from "@/components/ui/clay-button";
import { UncertaintyCard } from "@/components/cards/uncertainty-card";
import { REGIME_COLORS } from "@/lib/constants";

export const GridInspector: React.FC = () => {
  const { selectedGridId, isInspectorOpen, setInspectorOpen, setTimeSeriesModalOpen } = useMapStore();

  if (!isInspectorOpen || !selectedGridId) {
    return null;
  }

  const grid = findGridById(selectedGridId) || getIndiaGrids()[0];
  const regimeColor = REGIME_COLORS[grid.regime] || "#2F80D9";

  return (
    <div className="w-full lg:w-96 flex flex-col clay-card p-5 border border-white/90 shadow-clay bg-white relative">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-navy tracking-tight">{grid.id}</span>
            <ClayBadge variant="primary" size="sm">
              0.25° Grid
            </ClayBadge>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {formatLatLon(grid.lat, grid.lon)} • Elev {grid.elevationM}m
          </div>
        </div>

        <button
          type="button"
          onClick={() => setInspectorOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location */}
      <div className="py-3 flex items-center justify-between text-xs border-b border-slate-100">
        <span className="text-slate-500">Administrative Location:</span>
        <span className="font-semibold text-navy">
          {grid.district}, {grid.state}
        </span>
      </div>

      {/* Current Regime */}
      <div className="py-3 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Current Regime:</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: regimeColor }}
          >
            {grid.regime}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Regime Probability:</span>
          <span className="font-medium text-slate-700">
            {Math.round(grid.regimeProbability * 100)}%
          </span>
        </div>
      </div>

      {/* Rainfall Metrics Comparison */}
      <div className="py-3.5 border-b border-slate-100">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          24h Rainfall Post-Processing
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">NWP Raw</div>
            <div className="text-sm font-bold text-slate-700 mt-0.5">
              {formatRainfall(grid.nwpRainfallMm)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200">
            <div className="text-[10px] text-brand-blue font-semibold">Corrected</div>
            <div className="text-sm font-bold text-brand-blue mt-0.5">
              {formatRainfall(grid.correctedRainfallMm)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Model Bias</div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                grid.biasMm > 0 ? "text-emerald-600" : grid.biasMm < 0 ? "text-rose-600" : "text-slate-600"
              }`}
            >
              {grid.biasMm > 0 ? `+${grid.biasMm}` : grid.biasMm} mm
            </div>
          </div>
        </div>
      </div>

      {/* Regime Transition Analysis */}
      <div className="py-3 border-b border-slate-100 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-navy">Spatial Transition:</span>
          {grid.isTransitioning ? (
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold text-[11px]">
              Active Shift
            </span>
          ) : (
            <span className="text-slate-400 font-medium">Regime Stable</span>
          )}
        </div>

        {grid.isTransitioning && grid.transitionTarget ? (
          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-900 font-medium">Trajectory:</span>
              <span className="font-bold text-purple-950">
                {grid.regime} → {grid.transitionTarget}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800">
              <span>Transition Probability:</span>
              <span className="font-bold">
                {Math.round((grid.transitionProbability || 0) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800">
              <span>NWP Regime Lag:</span>
              <span className="font-bold">+{grid.nwpRegimeLagHours} hours</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800">
              <span>Neighbour Consistency:</span>
              <span className="font-bold">
                {Math.round((grid.neighbourConsistency || 0) * 100)}%
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Uncertainty Quantification */}
      <div className="py-3">
        <UncertaintyCard
          p10={grid.p10Mm}
          p50={grid.p50Mm}
          p90={grid.p90Mm}
          entropy={grid.entropy}
          confidence={grid.confidence}
        />
      </div>

      {/* Time Series Action Button */}
      <div className="mt-auto pt-3">
        <ClayButton
          variant="primary"
          className="w-full justify-center"
          onClick={() => setTimeSeriesModalOpen(true)}
        >
          <BarChart3 className="w-4 h-4" />
          <span>View 72h Time Series</span>
        </ClayButton>
      </div>
    </div>
  );
};
