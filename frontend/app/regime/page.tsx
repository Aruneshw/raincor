"use client";

import React, { useEffect, useState } from "react";
import { Wind, Activity, ArrowRight, Layers, HelpCircle, BarChart3 } from "lucide-react";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { RegimeDistChart } from "@/components/charts/regime-dist-chart";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { useMapStore } from "@/store/map-store";
import { raincorApi } from "@/services/api/client";
import { RegimeResponse } from "@/types/regime";
import { REGIMES, REGIME_COLORS } from "@/lib/constants";

export default function RegimePage() {
  const { isInspectorOpen, setSelectedLayer } = useMapStore();
  const [data, setData] = useState<RegimeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically switch map layer to regime
    setSelectedLayer("regime");
    raincorApi
      .getRegimeDistribution()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Regime fetch error:", err);
        setLoading(false);
      });
  }, [setSelectedLayer]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Meteorological Regime Classification &amp; Dynamics
            </h2>
            <ClayBadge variant="purple">AI Classifier Active</ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic categorization into 7 operational monsoon regimes. Individual bias correction models are dynamically routed based on local regime weights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200/60">
            Regime Transition Rate: <span className="font-bold">24.6% Grids/day</span>
          </div>
        </div>
      </div>

      {/* Main Regime Map & Inspector */}
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

      {/* Regime Statistics & Markov Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Regime Breakdown List */}
        <ClayCard className="p-5">
          <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Regime Coverage</span>
            <span className="text-xs text-slate-400 font-normal">17,415 Grids</span>
          </h3>

          <div className="space-y-2.5">
            {data?.distribution.map((item) => (
              <div key={item.regime} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-navy">{item.regime}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-navy">{item.percentage}%</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({item.gridCount} grids)</span>
                </div>
              </div>
            ))}
          </div>
        </ClayCard>

        {/* Doughnut Distribution Chart */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100">
              Distribution Visualizer
            </h3>
            {data ? (
              <RegimeDistChart distribution={data.distribution} height={220} />
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Active Monsoon &amp; Low/Depression systems represent &gt;50% of land precipitation.
          </p>
        </ClayCard>

        {/* 72-Hour Markov Transition Matrix Preview */}
        <ClayCard className="p-5">
          <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Transition Matrix (Next 72h)</span>
            <ClayBadge variant="primary" size="sm">Markovian</ClayBadge>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60">
              <div className="font-semibold text-brand-blue mb-1">Active Monsoon → Depression</div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Probability: <strong>68% persistence</strong> | 15% shift</span>
                <span className="text-emerald-700 font-semibold">High Stability</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60">
              <div className="font-semibold text-purple-700 mb-1">Monsoon Low → Coastal</div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Probability: 28% Active | 12% Coastal</span>
                <span className="text-purple-700 font-semibold">Decaying Track</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-700 mb-1">Break Monsoon → Active</div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Probability: 22% revival in 72h</span>
                <span className="text-slate-500 font-semibold">Revival Phase</span>
              </div>
            </div>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
