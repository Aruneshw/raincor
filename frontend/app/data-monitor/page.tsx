"use client";

import React, { useEffect, useState } from "react";
import { Database, Radio, CheckCircle, AlertTriangle, Clock, RefreshCw, Server, ArrowDownToLine } from "lucide-react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayBadge } from "@/components/ui/clay-badge";
import { ClayButton } from "@/components/ui/clay-button";
import { arjunaApi } from "@/services/api/client";
import { DataMonitorResponse } from "@/types/data-monitor";

export default function DataMonitorPage() {
  const [data, setData] = useState<DataMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    arjunaApi
      .getDataMonitor()
      .then((res) => {
        setData(res);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Data monitor fetch error:", err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Operational Data Feed Monitor &amp; Ingestion Pipelines
            </h2>
            <ClayBadge variant="success" dot>
              6 Feeds Active
            </ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and quality control across NWP model outputs, IMD AWS ground observations, INSAT satellite estimates, and reanalysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ClayButton variant="secondary" size="sm" onClick={loadData} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Health Check</span>
          </ClayButton>
        </div>
      </div>

      {/* Top Feed Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.sources.map((src) => (
          <div key={src.id} className="clay-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {src.sourceType}
                  </span>
                  <h3 className="text-sm font-bold text-navy">{src.name}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    src.status === "LIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  ● {src.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mb-3">
                Provider: <span className="font-semibold text-slate-700">{src.provider}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Record Count</span>
                  <span className="font-bold text-navy">{src.recordCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Coverage</span>
                  <span className="font-bold text-brand-blue">{src.coveragePct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="font-semibold text-slate-700">{src.latencySeconds}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Quality Score</span>
                  <span className="font-bold text-emerald-700">{src.qualityScorePct}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {src.lastUpdate}
              </span>
              <span>Anomalies: {src.anomalyCount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ingestion Audit Trail Table */}
      <div className="clay-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-navy">Recent Ingestion Cycles &amp; Audit Logs</h3>
            <p className="text-xs text-slate-400">Automated regridding, QC filter, and regime-routing triggers</p>
          </div>
          <ClayBadge variant="primary" size="sm">
            Live Stream
          </ClayBadge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2.5 font-semibold">Timestamp (IST)</th>
                <th className="pb-2.5 font-semibold">Source Stream</th>
                <th className="pb-2.5 font-semibold">Cycle / Run</th>
                <th className="pb-2.5 font-semibold">Records Processed</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 font-semibold">Pipeline Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 text-slate-600 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-2.5 font-bold text-navy">{log.source}</td>
                  <td className="py-2.5 text-slate-600 font-medium">{log.cycle}</td>
                  <td className="py-2.5 font-mono text-slate-800">{log.recordsIngested.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600 font-medium">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
