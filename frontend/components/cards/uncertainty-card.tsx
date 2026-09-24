import React from "react";
import { formatRainfall } from "@/lib/formatting";

interface UncertaintyCardProps {
  p10: number;
  p50: number;
  p90: number;
  entropy?: number;
  confidence?: "High" | "Medium" | "Low";
}

export const UncertaintyCard: React.FC<UncertaintyCardProps> = ({
  p10,
  p50,
  p90,
  entropy,
  confidence = "High",
}) => {
  const maxVal = Math.max(p90 * 1.15, 20);
  const leftPct = Math.min(100, (p10 / maxVal) * 100);
  const medianPct = Math.min(100, (p50 / maxVal) * 100);
  const rightPct = Math.min(100, (p90 / maxVal) * 100);
  const widthPct = Math.max(2, rightPct - leftPct);

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-semibold text-navy">Prediction Interval (P10–P90)</span>
        {confidence && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              confidence === "High"
                ? "bg-emerald-100 text-emerald-800"
                : confidence === "Medium"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {confidence} Confidence
          </span>
        )}
      </div>

      {/* Uncertainty Spread Bar */}
      <div className="relative h-6 bg-slate-200/70 rounded-full my-3 overflow-hidden shadow-inner">
        {/* P10 - P90 spread range */}
        <div
          className="absolute top-0 bottom-0 bg-blue-300/80 rounded-full"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* P50 median indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-brand-blue z-10 -ml-0.5 rounded-full shadow"
          style={{ left: `${medianPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-1.5 rounded-lg bg-white shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">P10 (10th %)</div>
          <div className="text-xs font-bold text-navy">{formatRainfall(p10)}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-blue-50/80 border border-blue-200/60 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-brand-blue">P50 (Median)</div>
          <div className="text-xs font-bold text-brand-blue">{formatRainfall(p50)}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-white shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">P90 (90th %)</div>
          <div className="text-xs font-bold text-navy">{formatRainfall(p90)}</div>
        </div>
      </div>

      {entropy !== undefined && (
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
          <span>Regime Shannon Entropy:</span>
          <span className="font-semibold text-navy">{entropy.toFixed(2)} nats</span>
        </div>
      )}
    </div>
  );
};
