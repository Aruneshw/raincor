"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, BarChart2, TrendingUp, Compass, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { useMapStore } from "@/store/map-store";
import { raincorApi } from "@/services/api/client";
import { ClimatologyResponse } from "@/services/mock/climatology-service";

export default function ClimatologyPage() {
  const { isInspectorOpen } = useMapStore();
  const [data, setData] = useState<ClimatologyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    raincorApi.getClimatology().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              India Monsoon Climatology &amp; Long-Term Normals
            </h2>
            <ClayBadge variant="primary">30-Year IMD Normal (1991–2020)</ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking All-India Monsoon Rainfall (AIMR) against long-period normals (LPN). Subdivision-level departures and monsoon progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            Cumulative Monsoon Departure: <span className="font-bold">+6.4% (Normal)</span>
          </div>
        </div>
      </div>

      {/* Main Climatology Map & Inspector */}
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

      {/* Monthly Monsoon Progress & Subdivision Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Rainfall Progression */}
        <ClayCard className="p-5">
          <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Monthly Monsoon Progression</span>
            <span className="text-[10px] text-slate-400">JJAS 2026</span>
          </h3>

          <div className="space-y-2.5">
            {data?.monthly.map((m) => (
              <div key={m.month} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between font-semibold text-navy mb-1">
                  <span>{m.month}</span>
                  <span
                    className={`flex items-center text-[11px] ${
                      m.departurePct >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {m.departurePct >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />
                    )}
                    {m.departurePct > 0 ? `+${m.departurePct}` : m.departurePct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Actual: <strong>{m.currentSeasonMm} mm</strong></span>
                  <span>Normal: <strong>{m.historicalNormalMm} mm</strong></span>
                </div>
              </div>
            ))}
          </div>
        </ClayCard>

        {/* Subdivision Departure Table */}
        <div className="lg:col-span-2 clay-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Meteorological Subdivision Rainfall Departures</h3>
              <p className="text-xs text-slate-400">Cumulative seasonal performance against IMD benchmark categories</p>
            </div>
            <ClayBadge variant="primary" size="sm">
              36 Subdivisions
            </ClayBadge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Subdivision</th>
                  <th className="pb-2 font-semibold">Normal (mm)</th>
                  <th className="pb-2 font-semibold">Actual (mm)</th>
                  <th className="pb-2 font-semibold">Departure %</th>
                  <th className="pb-2 font-semibold">IMD Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.subdivisions.map((s) => {
                  const dep = Number((((s.actualMm - s.normalMm) / s.normalMm) * 100).toFixed(1));
                  return (
                    <tr key={s.subdivision} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-navy">{s.subdivision}</td>
                      <td className="py-2.5 text-slate-600">{s.normalMm.toFixed(1)}</td>
                      <td className="py-2.5 font-bold text-navy">{s.actualMm.toFixed(1)}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-semibold ${
                            dep >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {dep > 0 ? `+${dep}` : dep}%
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            s.category === "Excess"
                              ? "bg-blue-100 text-blue-800"
                              : s.category === "Normal"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.category}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
