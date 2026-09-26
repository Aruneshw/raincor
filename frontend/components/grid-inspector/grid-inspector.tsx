"use client";

import React from "react";
import { X, BarChart3 } from "lucide-react";
import { useMapStore } from "@/store/map-store";
import { findGridById, getIndiaGrids } from "@/lib/grid-generator";
import { formatLatLon } from "@/lib/formatting";
import { ClayBadge } from "@/components/ui/clay-badge";
import { ClayButton } from "@/components/ui/clay-button";
import { REGIME_COLORS } from "@/lib/constants";
import { AIDecisionPipeline } from "@/components/ui/ai-decision-pipeline";

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

      {/* AI Decision Pipeline - Replaces static sections with interactive deep dive */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        <AIDecisionPipeline grid={grid} />
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
