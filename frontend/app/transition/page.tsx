"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock, Users, ArrowRight, Compass, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { useMapStore } from "@/store/map-store";
import { raincorApi } from "@/services/api/client";
import { TransitionResponse, TransitionHotspot } from "@/types/transition";
import { formatLatLon } from "@/lib/formatting";

export default function TransitionPage() {
  const { isInspectorOpen, setSelectedLayer, selectGrid } = useMapStore();
  const [data, setData] = useState<TransitionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically switch map layer to transition
    setSelectedLayer("transition");
    raincorApi
      .getTransitions()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Transition fetch error:", err);
        setLoading(false);
      });
  }, [setSelectedLayer]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Spatial Transition Intelligence Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Spatial Transition Monitor &amp; NWP Lag Detection
            </h2>
            <ClayBadge variant="purple" dot>
              417 Grids Shifting
            </ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking rapid meteorological regime boundaries across India. Numerical models often exhibit +6h to +12h lag in identifying depressions and coastal transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
            Average NWP Regime Lag: <span className="font-bold">+6.8 Hours</span>
          </div>
        </div>
      </div>

      {/* Main Transition Map & Inspector */}
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

      {/* Detailed Transition Hotspots & Neighbor Influence Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Transition Hotspots List */}
        <div className="lg:col-span-2 clay-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Priority Transition Hotspots</h3>
              <p className="text-xs text-slate-400">Click any hotspot grid to inspect in detail</p>
            </div>
            <ClayBadge variant="primary" size="sm">
              Live Spatial Queue
            </ClayBadge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Grid ID</th>
                  <th className="pb-2 font-semibold">Region</th>
                  <th className="pb-2 font-semibold">Regime Transition</th>
                  <th className="pb-2 font-semibold">Probability</th>
                  <th className="pb-2 font-semibold">NWP Lag</th>
                  <th className="pb-2 font-semibold">Neighbour Cons.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.hotspots.slice(0, 7).map((hotspot) => (
                  <tr
                    key={hotspot.gridId}
                    onClick={() => selectGrid(hotspot.gridId)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-brand-blue">{hotspot.gridId}</td>
                    <td className="py-2.5 text-navy font-medium">
                      {hotspot.district}, {hotspot.state}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                        {hotspot.currentRegime} → {hotspot.targetRegime}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-navy">
                      {(hotspot.probability * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 font-semibold text-rose-600">
                      +{hotspot.nwpLagHours}h
                    </td>
                    <td className="py-2.5 font-medium text-slate-700">
                      {(hotspot.neighbourConsistency * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transition Trajectory Diagram */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Transition Trajectory</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </h3>

            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  1. Current State
                </span>
                <div className="text-sm font-bold text-navy">Active Monsoon Trough</div>
                <div className="text-xs text-slate-500 mt-0.5">Widespread synoptic convergence</div>
              </div>

              <div className="flex justify-center text-purple-600">
                <ArrowRight className="w-5 h-5 rotate-90" />
              </div>

              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block mb-1">
                    2. Transition State (AI Detected)
                  </span>
                  <ClayBadge variant="purple" size="sm">
                    Lag: +6h
                  </ClayBadge>
                </div>
                <div className="text-sm font-bold text-purple-950">Vortex Tightening</div>
                <div className="text-xs text-purple-800 mt-0.5">
                  High neighbour consistency (0.81)
                </div>
              </div>

              <div className="flex justify-center text-purple-600">
                <ArrowRight className="w-5 h-5 rotate-90" />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-brand-blue block mb-1">
                  3. Predicted Regime
                </span>
                <div className="text-sm font-bold text-brand-blue">Monsoon Low / Depression</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Rainfall surge expectation (+25-50mm)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            NWP model update occurs every 6h; AI regime tracking updates hourly.
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
