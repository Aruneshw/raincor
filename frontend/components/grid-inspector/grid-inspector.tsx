"use client";

import React from "react";
import { X, BarChart3 } from "lucide-react";
import { useMapStore } from "@/store/map-store";
import { findGridById, getIndiaGrids } from "@/lib/grid-generator";
import { formatRainfall, formatLatLon } from "@/lib/formatting";
import { ClayBadge } from "@/components/ui/clay-badge";
import { ClayButton } from "@/components/ui/clay-button";
import { UncertaintyCard } from "@/components/cards/uncertainty-card";
import { REGIME_COLORS } from "@/lib/constants";

export const GridInspector: React.FC = () => {
  const { selectedGridId, isInspectorOpen, setInspectorOpen, setTimeSeriesModalOpen } =
    useMapStore();

  if (!isInspectorOpen || !selectedGridId) {
    return null;
  }

  const grid = findGridById(selectedGridId) || getIndiaGrids()[0];
  const regimeColor = REGIME_COLORS[grid.regime] || "#2F80D9";

  return (
    <div className="w-full lg:w-96 flex flex-col clay-card p-5 border border-white/90 dark:border-white/10 shadow-clay bg-white dark:bg-[#111827] relative transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-navy dark:text-white tracking-tight">
              {grid.id}
            </span>
            <ClayBadge variant="primary" size="sm">
              0.25° Grid
            </ClayBadge>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {formatLatLon(grid.lat, grid.lon)} • Elev {grid.elevationM}m
          </div>
        </div>

        <button
          type="button"
          onClick={() => setInspectorOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location */}
      <div className="py-3 flex items-center justify-between text-xs border-b border-slate-100 dark:border-white/10">
        <span className="text-slate-500 dark:text-slate-400">Administrative Location:</span>
        <span className="font-semibold text-navy dark:text-white">
          {grid.district}, {grid.state}
        </span>
      </div>

      {/* Current Regime */}
      <div className="py-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500 dark:text-slate-400">Current Regime:</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
            style={{ backgroundColor: regimeColor }}
          >
            {grid.regime}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
          <span>Regime Probability:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {Math.round(grid.regimeProbability * 100)}%
          </span>
        </div>
      </div>

      {/* Rainfall Metrics Comparison */}
      <div className="py-3.5 border-b border-slate-100 dark:border-white/10">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2.5">
          24h Rainfall Post-Processing
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              NWP Raw
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">
              {formatRainfall(grid.nwpRainfallMm)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50">
            <div className="text-[10px] text-brand-blue dark:text-sky-400 font-semibold">
              Corrected
            </div>
            <div className="text-sm font-bold text-brand-blue dark:text-sky-400 mt-0.5">
              {formatRainfall(grid.correctedRainfallMm)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Model Bias
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                grid.biasMm > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : grid.biasMm < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {grid.biasMm > 0 ? `+${grid.biasMm}` : grid.biasMm} mm
            </div>
          </div>
        </div>
      </div>

      {/* Regime Transition Analysis */}
      <div className="py-3 border-b border-slate-100 dark:border-white/10 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-navy dark:text-white">Spatial Transition:</span>
          {grid.isTransitioning ? (
            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-semibold text-[11px]">
              Active Shift
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-medium">Regime Stable</span>
          )}
        </div>

        {grid.isTransitioning && grid.transitionTarget ? (
          <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/50 mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-900 dark:text-purple-300 font-medium">Trajectory:</span>
              <span className="font-bold text-purple-950 dark:text-purple-200">
                {grid.regime} → {grid.transitionTarget}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800 dark:text-purple-300">
              <span>Transition Probability:</span>
              <span className="font-bold">
                {Math.round((grid.transitionProbability || 0) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800 dark:text-purple-300">
              <span>NWP Regime Lag:</span>
              <span className="font-bold">+{grid.nwpRegimeLagHours} hours</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-800 dark:text-purple-300">
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

export default GridInspector;
