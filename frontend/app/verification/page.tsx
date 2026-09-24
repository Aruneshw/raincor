"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Award, TrendingUp, BarChart3, ShieldCheck, ArrowUpRight } from "lucide-react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { SkillBarChart } from "@/components/charts/skill-bar-chart";
import { ReliabilityPlot } from "@/components/charts/reliability-plot";
import { raincorApi } from "@/services/api/client";
import { VerificationResponse, ModelMetricSet } from "@/types/verification";

export default function VerificationPage() {
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<keyof Pick<ModelMetricSet, "csi" | "ets" | "pod" | "far" | "rmse" | "fss">>("csi");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    raincorApi.getVerification().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const metrics: Array<{ id: typeof selectedMetric; label: string }> = [
    { id: "csi", label: "Critical Success Index (CSI)" },
    { id: "ets", label: "Equitable Threat Score (ETS)" },
    { id: "rmse", label: "RMSE Error (mm)" },
    { id: "pod", label: "Probability of Detection (POD)" },
    { id: "far", label: "False Alarm Ratio (FAR)" },
    { id: "fss", label: "Fractions Skill Score (FSS)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Operational Meteorological Verification &amp; Skill Benchmarks
            </h2>
            <ClayBadge variant="success" dot>
              Rigorous IMD Verification
            </ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard contingency scores (CSI, ETS, POD, FAR, FSS, RMSE) comparing Raw NWP against AI baseline, Mixture-of-Experts (MoE), and RAINCOR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ClayBadge variant="primary" size="md">
            Monsoon 2026 Active Season
          </ClayBadge>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="clay-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Comprehensive Model Skill Matrix</h3>
            <p className="text-xs text-slate-400">All India grid-point contingency analysis (Lead Time T+24h)</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
            RAINCOR ranks #1 across all metrics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2.5 font-semibold">Model Pipeline</th>
                <th className="pb-2.5 font-semibold">CSI (Threat) ↑</th>
                <th className="pb-2.5 font-semibold">ETS ↑</th>
                <th className="pb-2.5 font-semibold">POD (Hit Rate) ↑</th>
                <th className="pb-2.5 font-semibold">FAR (False Alarm) ↓</th>
                <th className="pb-2.5 font-semibold">FSS ↑</th>
                <th className="pb-2.5 font-semibold">RMSE Error ↓</th>
                <th className="pb-2.5 font-semibold">Bias Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.models.map((m, idx) => {
                const isRaincor = m.modelName.includes("RAINCOR");
                return (
                  <tr
                    key={m.modelName}
                    className={isRaincor ? "bg-blue-50/50 font-semibold" : "hover:bg-slate-50"}
                  >
                    <td className="py-3 text-navy flex items-center gap-2">
                      {isRaincor && <Award className="w-4 h-4 text-brand-blue" />}
                      <span>{m.modelName}</span>
                    </td>
                    <td className="py-3 font-bold text-navy">{m.csi.toFixed(2)}</td>
                    <td className="py-3 text-slate-700">{m.ets.toFixed(2)}</td>
                    <td className="py-3 text-slate-700 font-semibold">{(m.pod * 100).toFixed(1)}%</td>
                    <td className="py-3 text-slate-700">{(m.far * 100).toFixed(1)}%</td>
                    <td className="py-3 text-slate-700">{m.fss.toFixed(2)}</td>
                    <td className="py-3 font-bold text-slate-900">{m.rmse.toFixed(1)} mm</td>
                    <td className="py-3 text-slate-700">{m.biasRatio.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metric Selector & Comparative Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-navy">Comparative Skill Scores</h3>
              <div className="flex flex-wrap gap-1">
                {metrics.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m.id)}
                    className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-all ${
                      selectedMetric === m.id
                        ? "bg-brand-blue text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {data ? (
              <SkillBarChart models={data.models} metric={selectedMetric} height={220} />
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            )}
          </div>
        </ClayCard>

        {/* Reliability Diagram (Probability Calibration) */}
        <ClayCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy">Reliability Diagram (Calibration)</h3>
                <p className="text-[11px] text-slate-400">Forecast probability vs observed relative frequency</p>
              </div>
              <ClayBadge variant="primary" size="sm">
                45° Ideal Line
              </ClayBadge>
            </div>

            {data ? (
              <ReliabilityPlot bins={data.reliabilityCurve} height={220} />
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                Loading plot...
              </div>
            )}
          </div>
        </ClayCard>
      </div>

      {/* Rainfall Threshold Performance */}
      <div className="clay-card p-5">
        <h3 className="text-sm font-bold text-navy mb-3 pb-2 border-b border-slate-100">
          Critical Success Index (CSI) across IMD Operational Rainfall Thresholds
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {data?.thresholdSkills.map((t) => (
            <div key={t.thresholdMm} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-navy block mb-2">{t.thresholdLabel}</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Raw NWP CSI:</span>
                  <span className="font-semibold text-slate-600">{t.nwpCsi.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ML Baseline:</span>
                  <span className="font-semibold text-slate-600">{t.mlCsi.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mixture-of-Experts:</span>
                  <span className="font-semibold text-slate-600">{t.moeCsi.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-brand-blue">RAINCOR Skill:</span>
                  <span className="font-extrabold text-brand-blue text-sm">{t.raincorCsi.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
