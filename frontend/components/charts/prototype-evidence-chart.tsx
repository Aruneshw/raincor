"use client";

import React from "react";
import "@/components/charts/chart-setup";
import { Line } from "react-chartjs-2";

/**
 * Prototype Evidence Chart
 * ─────────────────────────
 * Replicates the reference "Rainfall Forecast Comparison (Sample Grid)" graph
 * with three curves: Observed (IMD), NWP Forecast, and Arjuna (Corrected).
 * Annotated with efficiency percentages at each lead-time step.
 */

// ── Sample grid data matching the reference image pattern ──────────────────
const LEAD_TIMES = ["6h", "12h", "16h", "24h", "30h", "36h", "42h", "48h", "54h", "60h", "66h", "72h"];

const OBSERVED_IMD  = [8.2, 14.5, 22.8, 58.4, 96.4, 74.2, 42.6, 28.1, 18.4, 12.6, 9.8, 7.2];
const NWP_FORECAST  = [12.4, 24.8, 38.6, 82.4, 68.2, 52.1, 38.4, 32.6, 26.8, 22.4, 18.6, 14.2];
const ARJUNA_CORR   = [9.1, 16.2, 24.6, 62.8, 92.1, 70.8, 40.2, 26.4, 17.2, 11.8, 9.2, 7.8];

// Efficiency: how much closer Arjuna is to observed vs NWP (as %)
function calcEfficiency(obs: number, nwp: number, corr: number): number {
  const nwpErr = Math.abs(nwp - obs);
  const corrErr = Math.abs(corr - obs);
  if (nwpErr === 0) return 0;
  return Math.round(((nwpErr - corrErr) / nwpErr) * 100);
}

const EFFICIENCY = OBSERVED_IMD.map((obs, i) => calcEfficiency(obs, NWP_FORECAST[i], ARJUNA_CORR[i]));

// Overall average efficiency
const AVG_EFFICIENCY = Math.round(EFFICIENCY.reduce((a, b) => a + b, 0) / EFFICIENCY.length);

interface PrototypeEvidenceChartProps {
  height?: number;
}

export const PrototypeEvidenceChart: React.FC<PrototypeEvidenceChartProps> = ({
  height = 320,
}) => {
  const data = {
    labels: LEAD_TIMES,
    datasets: [
      {
        label: "Observed (IMD)",
        data: OBSERVED_IMD,
        borderColor: "#DC2626",
        backgroundColor: "#DC2626",
        borderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointStyle: "circle" as const,
        tension: 0.35,
        order: 1,
      },
      {
        label: "NWP Forecast",
        data: NWP_FORECAST,
        borderColor: "#2563EB",
        backgroundColor: "#2563EB",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointStyle: "triangle" as const,
        tension: 0.35,
        fill: false,
        order: 2,
      },
      {
        label: "Arjuna (Corrected)",
        data: ARJUNA_CORR,
        borderColor: "#16A34A",
        backgroundColor: "rgba(22, 163, 74, 0.08)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: "rectRounded" as const,
        tension: 0.35,
        fill: false,
        order: 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "center" as const,
        labels: {
          boxWidth: 14,
          boxHeight: 14,
          usePointStyle: true,
          font: { size: 11.5, weight: "600" },
          color: "#334155",
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#F8FAFC",
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 1,
        titleFont: { size: 12, weight: "700" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          afterBody: (context: any) => {
            const idx = context[0].dataIndex;
            const eff = EFFICIENCY[idx];
            return `\n🎯 Arjuna Efficiency: ${eff}% closer to observed`;
          },
          label: (context: any) => `${context.dataset.label}: ${context.raw.toFixed(1)} mm`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Forecast Lead Time (hours)",
          color: "#64748B",
          font: { size: 12, weight: "600" },
          padding: { top: 8 },
        },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#64748B" },
      },
      y: {
        title: {
          display: true,
          text: "Rainfall (mm)",
          color: "#64748B",
          font: { size: 12, weight: "600" },
        },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#64748B" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-navy tracking-tight">
            PROTOTYPE EVIDENCE
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rainfall Forecast Comparison (Sample Grid)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Avg. Efficiency: {AVG_EFFICIENCY}%
          </span>
          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-semibold text-blue-700">
            Sample Result (from our prototype)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }} className="w-full">
        <Line data={data} options={options} />
      </div>

      {/* Efficiency % breakdown cards */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Per-Lead-Time Efficiency (Arjuna vs Raw NWP error reduction)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_TIMES.map((lt, i) => {
            const eff = EFFICIENCY[i];
            const color =
              eff >= 70 ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
              eff >= 40 ? "bg-blue-50 text-blue-700 border-blue-200" :
              eff >= 20 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-600 border-slate-200";
            return (
              <span
                key={lt}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${color}`}
              >
                T+{lt}: {eff}%
              </span>
            );
          })}
        </div>

        {/* Summary note */}
        <p className="mt-3 text-xs text-slate-500 italic leading-relaxed">
          <strong className="text-emerald-700 not-italic">Arjuna</strong> follows observed rainfall
          more closely than raw NWP forecasts, with an average error reduction of{" "}
          <strong className="text-emerald-700 not-italic">{AVG_EFFICIENCY}%</strong> across all lead
          times.
        </p>
      </div>
    </div>
  );
};

export default PrototypeEvidenceChart;
