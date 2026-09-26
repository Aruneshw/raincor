"use client";

import React, { useMemo } from "react";
import "@/components/charts/chart-setup";
import { Line } from "react-chartjs-2";
import { Database, AlertCircle, ArrowRight, ShieldCheck, RefreshCcw } from "lucide-react";

// ── Sample prototype data ──────────────────────────────────────────────
const LEAD_TIMES = ["6h", "12h", "16h", "24h", "30h", "36h", "42h", "48h", "54h", "60h", "66h", "72h"];
const OBSERVED_IMD  = [8.2, 14.5, 22.8, 58.4, 96.4, 74.2, 42.6, 28.1, 18.4, 12.6, 9.8, 7.2];
const NWP_FORECAST  = [12.4, 24.8, 38.6, 82.4, 68.2, 52.1, 38.4, 32.6, 26.8, 22.4, 18.6, 14.2];
const ARJUNA_CORR   = [9.1, 16.2, 24.6, 62.8, 92.1, 70.8, 40.2, 26.4, 17.2, 11.8, 9.2, 7.8];

// ── Helper to calculate basic metrics from prototype arrays ────────────
function calculateMetrics(observed: number[], predicted: number[]) {
  if (observed.length === 0) return { rmse: "N/A", bias: "N/A", r2: "N/A" };
  
  let sse = 0;
  let biasSum = 0;
  let sst = 0;
  const meanObs = observed.reduce((a, b) => a + b, 0) / observed.length;

  for (let i = 0; i < observed.length; i++) {
    const error = predicted[i] - observed[i];
    sse += error * error;
    biasSum += error;
    sst += Math.pow(observed[i] - meanObs, 2);
  }

  const rmse = Math.sqrt(sse / observed.length);
  const bias = biasSum / observed.length;
  const r2 = sst === 0 ? 0 : 1 - (sse / sst);

  return {
    rmse: rmse.toFixed(2),
    bias: bias.toFixed(2),
    r2: r2.toFixed(2),
  };
}

export const PrototypeEvidenceChart: React.FC<{ height?: number }> = ({ height = 280 }) => {
  const nwpMetrics = calculateMetrics(OBSERVED_IMD, NWP_FORECAST);
  const arjunaMetrics = calculateMetrics(OBSERVED_IMD, ARJUNA_CORR);

  // Line Chart Configuration (Skill by Lead Time)
  const data = {
    labels: LEAD_TIMES,
    datasets: [
      {
        label: "Observed (IMD)",
        data: OBSERVED_IMD,
        borderColor: "#10B981", // Emerald
        backgroundColor: "#10B981",
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
      },
      {
        label: "Raw NWP",
        data: NWP_FORECAST,
        borderColor: "#64748B", // Slate
        backgroundColor: "#64748B",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.35,
      },
      {
        label: "ARJUNA Corrected",
        data: ARJUNA_CORR,
        borderColor: "#3B82F6", // Blue
        backgroundColor: "#3B82F6",
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.35,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 10 }, color: "#94A3B8", boxWidth: 10, usePointStyle: true },
      },
      tooltip: { backgroundColor: "#0F172A", titleFont: { size: 11 }, bodyFont: { size: 11 } },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { font: { size: 10 }, color: "#64748B" } },
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { font: { size: 10 }, color: "#64748B" } },
    },
  };

  return (
    <div className="w-full flex flex-col gap-6 p-1">
      {/* ── Metadata & Period Info ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-navy dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Model Benchmark & Verification
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Rigorous validation metrics based on available prototype testing arrays.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold">
          <div className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
            Training: <span className="text-slate-400 font-normal ml-1">N/A (Demo)</span>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
            Validation: <span className="text-slate-400 font-normal ml-1">N/A (Demo)</span>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
            Test Samples: <span className="text-blue-500 ml-1">12 (Prototype Arrays)</span>
          </div>
        </div>
      </div>

      {/* ── Model Benchmark Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="pb-2 font-semibold">Metric</th>
              <th className="pb-2 font-semibold">Raw NWP</th>
              <th className="pb-2 font-semibold">Global ML</th>
              <th className="pb-2 font-semibold">Regime ML</th>
              <th className="pb-2 font-semibold text-brand-blue">ARJUNA</th>
            </tr>
          </thead>
          <tbody className="text-navy dark:text-slate-200 divide-y divide-white/5 font-medium">
            <tr>
              <td className="py-2 text-slate-500">RMSE (mm) ↓</td>
              <td className="py-2">{nwpMetrics.rmse}</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-emerald-500 font-bold">{arjunaMetrics.rmse}</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-500">Bias (mm) ↓</td>
              <td className="py-2">{nwpMetrics.bias}</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-emerald-500 font-bold">{arjunaMetrics.bias}</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-500">R² ↑</td>
              <td className="py-2">{nwpMetrics.r2}</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-slate-600">N/A</td>
              <td className="py-2 text-emerald-500 font-bold">{arjunaMetrics.r2}</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-500">CSI / POD / FAR</td>
              <td className="py-2 text-slate-600 italic text-[10px]" colSpan={4}>Not available in prototype</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Skill by Lead Time Chart ── */}
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
            Skill by Lead Time
          </div>
          <div style={{ height }} className="w-full">
            <Line data={data} options={options} />
          </div>
        </div>

        {/* ── Forecast vs Observation & Verification State ── */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 flex-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
              Forecast vs Observation
            </div>
            <div className="flex flex-col gap-3 text-xs font-semibold">
              <div className="flex items-center justify-between bg-white dark:bg-[#111827] p-2.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="text-slate-500">Raw NWP</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <span className="text-rose-500">Bias Error</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <span className="text-brand-blue">ARJUNA Correction</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <span className="text-emerald-500 flex items-center gap-1"><Database className="w-3 h-3"/> Observation</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 flex-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              Verification State
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] flex items-center gap-1">
                <RefreshCcw className="w-2.5 h-2.5 animate-spin-slow" /> Active
              </span>
            </div>
            
            {/* Compact Vertical Flow */}
            <div className="flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 gap-1.5 pt-2">
              <div className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">Forecast</div>
              <ArrowRight className="w-3 h-3 rotate-90 text-slate-300 dark:text-slate-600" />
              <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">Observation</div>
              <ArrowRight className="w-3 h-3 rotate-90 text-slate-300 dark:text-slate-600" />
              <div className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20">Error Field</div>
              <ArrowRight className="w-3 h-3 rotate-90 text-slate-300 dark:text-slate-600" />
              <div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">Metric</div>
              <ArrowRight className="w-3 h-3 rotate-90 text-slate-300 dark:text-slate-600" />
              <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">Bias Memory Update</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrototypeEvidenceChart;
