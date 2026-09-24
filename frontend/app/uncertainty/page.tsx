"use client";

import React, { useEffect, useState } from "react";
import { Eye, HelpCircle, Shield, BarChart2, Layers } from "lucide-react";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { UncertaintyCard } from "@/components/cards/uncertainty-card";
import { useMapStore } from "@/store/map-store";
import { raincorApi } from "@/services/api/client";
import { UncertaintyResponse } from "@/types/uncertainty";
import { formatRainfall } from "@/lib/formatting";

export default function UncertaintyPage() {
  const { isInspectorOpen, setSelectedLayer } = useMapStore();
  const [data, setData] = useState<UncertaintyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically switch map layer to uncertainty
    setSelectedLayer("uncertainty");
    raincorApi
      .getUncertainty()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Uncertainty fetch error:", err);
        setLoading(false);
      });
  }, [setSelectedLayer]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Overview Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Uncertainty Quantification &amp; Ensemble Spread
            </h2>
            <ClayBadge variant="purple">Quantile Regression P10–P90</ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quantifying forecast spread and classification Shannon entropy across Indian subdivisions. Blue/purple scientific confidence surfaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-brand-blue text-xs font-semibold border border-blue-200/60">
            Average P10–P90 Spread: <span className="font-bold">48.2 mm</span>
          </div>
        </div>
      </div>

      {/* Main Uncertainty Map & Inspector */}
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

      {/* Uncertainty Zones & Quantile Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* National Quantile Medians */}
        <ClayCard className="p-5">
          <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>National Domain Quantiles</span>
            <span className="text-[10px] text-slate-400">All India Medians</span>
          </h3>

          <div className="space-y-3">
            <UncertaintyCard
              p10={data ? data.meanP10 : 18.4}
              p50={data ? data.meanP50 : 42.1}
              p90={data ? data.meanP90 : 86.5}
              entropy={data ? data.meanEntropy : 0.42}
              confidence="High"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            P50 represents median expectation; P90 provides operational upper ceiling.
          </p>
        </ClayCard>

        {/* Regional Uncertainty Breakdown */}
        <div className="lg:col-span-2 clay-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Subdivision Uncertainty Characterization</h3>
              <p className="text-xs text-slate-400">Ensemble spread and confidence ratings by meteorological zone</p>
            </div>
            <ClayBadge variant="primary" size="sm">
              5 Key Zones
            </ClayBadge>
          </div>

          <div className="space-y-2.5">
            {data?.zones.map((zone) => (
              <div
                key={zone.region}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-navy">{zone.region}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mean Spread: <strong className="text-slate-700">{zone.avgSpreadMm} mm</strong> | Shannon Entropy:{" "}
                    <strong className="text-slate-700">{zone.entropy}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                    {zone.confidenceDistribution.high}% High
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                    {zone.confidenceDistribution.medium}% Med
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-medium">
                    {zone.confidenceDistribution.low}% Low
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
