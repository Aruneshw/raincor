"use client";

import React, { useEffect, useState } from "react";
import { CloudRain, AlertTriangle, Activity, BarChart2, ShieldCheck, ArrowRight, RefreshCw, Zap } from "lucide-react";
import { KpiCard } from "@/components/cards/kpi-card";
import { AlertCard, OperationalAlert } from "@/components/cards/alert-card";
import { IndiaMap } from "@/components/maps/india-map";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { RainfallChart } from "@/components/charts/rainfall-chart";
import { RegimeDistChart } from "@/components/charts/regime-dist-chart";
import { arjunaApi } from "@/services/api/client";
import { ForecastResponse } from "@/types/forecast";
import { RegimeResponse } from "@/types/regime";
import { useMapStore } from "@/store/map-store";
import { useForecastStore } from "@/store/forecast-store";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import Link from "next/link";

const OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: "alt_1",
    type: "Heavy Rainfall",
    gridId: "G07123",
    location: "Assam / Kamrup",
    detail: "96.4 mm / 24h (Orographic)",
    timeAgo: "8m ago",
    severity: "high",
  },
  {
    id: "alt_2",
    type: "Regime Transition",
    gridId: "G10234",
    location: "Odisha / Puri",
    detail: "Active → Depression (Prob: 73%)",
    timeAgo: "14m ago",
    severity: "medium",
  },
  {
    id: "alt_3",
    type: "High Uncertainty",
    gridId: "G04567",
    location: "West Bengal / 24 Parganas",
    detail: "P10–P90: 18–142 mm (Entropy: 0.81)",
    timeAgo: "22m ago",
    severity: "high",
  },
];

export default function DashboardPage() {
  const { leadTime, displayMode } = useForecastStore();
  const { selectGrid, isInspectorOpen } = useMapStore();

  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [regimes, setRegimes] = useState<RegimeResponse | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlert[]>(OPERATIONAL_ALERTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      arjunaApi.getForecast(leadTime, displayMode),
      arjunaApi.getRegimeDistribution(),
      arjunaApi.getAlerts(),
    ])
      .then(([fRes, rRes, aRes]) => {
        setForecast(fRes);
        setRegimes(rRes);
        if (aRes?.alerts && aRes.alerts.length > 0) {
          setAlerts(aRes.alerts.slice(0, 5) as OperationalAlert[]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError("Failed to fetch latest forecast telemetry.");
        setLoading(false);
      });
  }, [leadTime, displayMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">Offline Fallback Active</span>
        </div>
      )}

      {/* Top 4 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Rainfall (24h)"
          value={forecast ? forecast.averageRainfallMm.toFixed(1) : "124.6"}
          unit="mm"
          change={{ value: "+18.2%", isPositive: true, label: "vs 30y Normal" }}
          icon={CloudRain}
          iconColor="text-brand-blue"
        />

        <KpiCard
          title="Heavy Rain Grids"
          value={forecast ? forecast.heavyRainGridsCount.toLocaleString() : "1,238"}
          unit="cells"
          change={{ value: "+8.4%", isPositive: true, label: "exceeding 64.5 mm" }}
          icon={AlertTriangle}
          iconColor="text-weather-warning"
        />

        <KpiCard
          title="Transitioning Grids"
          value={forecast ? forecast.transitionGridsCount.toLocaleString() : "417"}
          unit="cells"
          change={{ value: "24.6%", isPositive: true, label: "active regime shift" }}
          icon={Activity}
          iconColor="text-weather-purple"
        />

        <KpiCard
          title="Model Skill (CSI @ 64mm)"
          value="0.62"
          change={{ value: "+0.14", isPositive: true, label: "gain over raw NWP" }}
          icon={ShieldCheck}
          iconColor="text-weather-success"
        />
      </div>

      {/* Main Operational Geospatial Centerpiece */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* Main India Map */}
        <div className="flex-1 w-full min-w-0">
          <IndiaMap />
        </div>

        {/* Selected Grid Inspector (Collapsible / Dynamic) */}
        {isInspectorOpen && (
          <div className="w-full lg:w-auto shrink-0 animate-in slide-in-from-right duration-200">
            <GridInspector />
          </div>
        )}
      </div>

      {/* Supporting Operational Sections: Realtime Alerts & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-Time Operational Alerts */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-navy">Priority Operational Alerts</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {alerts.length} Active
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onSelectGrid={(id) => selectGrid(id)} />
              ))}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 text-right">
            <Link
              href="/transition"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1"
            >
              Open Transition Monitor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ClayCard>

        {/* Active Regime Distribution */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-navy">Regime Distribution (India)</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">17,415 Grids</span>
            </div>

            <div className="mt-3">
              {regimes ? (
                <RegimeDistChart distribution={regimes.distribution} height={190} />
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  Loading regimes...
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link
              href="/regime"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1"
            >
              Explore Markov Transitions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ClayCard>

        {/* Verification & Skill Benchmark Mini-Summary */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-navy">Skill Benchmark (vs NWP)</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                +22% Accuracy
              </span>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">RMSE Error Reduction</span>
                <span className="font-bold text-emerald-700">-43.9% (26.4 → 14.8 mm)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Heavy Rain POD (Hit Rate)</span>
                <span className="font-bold text-brand-blue">84.0% (vs 68.0% NWP)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">False Alarm Ratio (FAR)</span>
                <span className="font-bold text-navy">0.28 (vs 0.46 NWP)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Equitable Threat Score</span>
                <span className="font-bold text-purple-700">0.54 (+50% gain)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link
              href="/verification"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1"
            >
              Full Meteorological Verification <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
