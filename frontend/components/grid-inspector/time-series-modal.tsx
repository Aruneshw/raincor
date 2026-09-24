"use client";

import React, { useEffect, useState } from "react";
import { X, CloudRain } from "lucide-react";
import { useMapStore } from "@/store/map-store";
import { raincorApi } from "@/services/api/client";
import { GridTimeSeriesResponse } from "@/types/forecast";
import { RainfallChart } from "@/components/charts/rainfall-chart";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayBadge } from "@/components/ui/clay-badge";

export const TimeSeriesModal: React.FC = () => {
  const { selectedGridId, isTimeSeriesModalOpen, setTimeSeriesModalOpen } = useMapStore();
  const [data, setData] = useState<GridTimeSeriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadTimeSeries = React.useCallback(() => {
    if (selectedGridId) {
      setIsLoading(true);
      setHasError(false);
      raincorApi
        .getGridTimeSeries(selectedGridId)
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [selectedGridId]);

  useEffect(() => {
    if (isTimeSeriesModalOpen && selectedGridId) {
      loadTimeSeries();
    }
  }, [isTimeSeriesModalOpen, selectedGridId, loadTimeSeries]);

  if (!isTimeSeriesModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl clay-card bg-white dark:bg-[#111827] p-6 shadow-2xl border border-white/90 dark:border-white/10 transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-light dark:bg-blue-950/60 flex items-center justify-center text-brand-blue dark:text-sky-400 shadow-inner">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-navy dark:text-white">
                  Grid Rainfall Time-Series ({selectedGridId})
                </h3>
                <ClayBadge variant="primary" size="sm">
                  T+72h Forecast
                </ClayBadge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data
                  ? `${data.district}, ${data.state} • Ensemble Spread & Bias Corrected Trajectory`
                  : "Loading grid forecast..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTimeSeriesModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              <span>Loading timeseries data...</span>
            </div>
          ) : hasError ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <span className="text-rose-500 font-semibold">Failed to load grid time-series.</span>
              <button
                type="button"
                onClick={loadTimeSeries}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Retry Request
              </button>
            </div>
          ) : data ? (
            <div>
              <RainfallChart series={data.series} height={280} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/10 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">
                    Peak 6h Rate
                  </span>
                  <span className="text-sm font-bold text-navy dark:text-white">42.5 mm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">
                    72h Accumulation
                  </span>
                  <span className="text-sm font-bold text-brand-blue dark:text-sky-400">
                    148.2 mm
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">
                    P90 Max Ceiling
                  </span>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                    192.0 mm
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">
                    Heavy Rain Risk
                  </span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    High (78%)
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          <span>Source: NCMRWF NCUM + IMD AWS Observations + RAINCOR Bias Correction</span>
          <ClayButton variant="secondary" size="sm" onClick={() => setTimeSeriesModalOpen(false)}>
            Close
          </ClayButton>
        </div>
      </div>
    </div>
  );
};

export default TimeSeriesModal;
