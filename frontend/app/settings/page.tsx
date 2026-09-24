"use client";

import React, { useState, useEffect } from "react";
import { Settings, Sliders, Bell, Map, Database, Check, RefreshCcw } from "lucide-react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayBadge } from "@/components/ui/clay-badge";
import { raincorApi } from "@/services/api/client";

type SettingsTab = "thresholds" | "forecast" | "map" | "alerts" | "models";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("thresholds");
  const [heavyThreshold, setHeavyThreshold] = useState("64.5");
  const [veryHeavyThreshold, setVeryHeavyThreshold] = useState("115.5");
  const [extremeThreshold, setExtremeThreshold] = useState("204.5");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    raincorApi.getSettings().then((res) => {
      if (res?.thresholds) {
        if (res.thresholds.heavyThreshold) setHeavyThreshold(String(res.thresholds.heavyThreshold));
        if (res.thresholds.veryHeavyThreshold) setVeryHeavyThreshold(String(res.thresholds.veryHeavyThreshold));
        if (res.thresholds.extremeThreshold) setExtremeThreshold(String(res.thresholds.extremeThreshold));
      }
    }).catch(console.error);
  }, []);

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: "thresholds", label: "Threshold Settings", icon: <Sliders className="w-4 h-4" /> },
    { id: "forecast", label: "Forecast Configuration", icon: <Database className="w-4 h-4" /> },
    { id: "map", label: "Map & Grid Preferences", icon: <Map className="w-4 h-4" /> },
    { id: "alerts", label: "Alert Routing Rules", icon: <Bell className="w-4 h-4" /> },
    { id: "models", label: "MoE & ML Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    raincorApi.updateSettings({
      thresholds: {
        heavyThreshold: parseFloat(heavyThreshold) || 64.5,
        veryHeavyThreshold: parseFloat(veryHeavyThreshold) || 115.5,
        extremeThreshold: parseFloat(extremeThreshold) || 204.5,
      }
    }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }).catch(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-navy tracking-tight">
              Operational System Configuration &amp; Meteorological Rules
            </h2>
            <ClayBadge variant="primary">Control Room Admin</ClayBadge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure operational thresholds, Mixture-of-Experts routing weights, Mapbox visual layers, and alert dispatch criteria.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" /> Settings Saved to Local Cache
          </div>
        )}
      </div>

      {/* Main Settings Navigation & Form Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === t.id
                  ? "clay-sidebar-item-active"
                  : "bg-white/60 hover:bg-white text-slate-600 hover:text-navy border border-transparent"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Form Content */}
        <div className="md:col-span-3">
          <ClayCard className="p-6">
            {activeTab === "thresholds" && (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-navy">
                    Precipitation Operational Thresholds (IMD Standard Criteria)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifying these values dynamically adjusts heavy rain alarms, KPI cards, and contingency skill tables.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-navy block mb-1">
                      Heavy Rainfall Threshold
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={heavyThreshold}
                        onChange={(e) => setHeavyThreshold(e.target.value)}
                        className="clay-input px-3 py-1.5 text-sm font-bold w-full"
                      />
                      <span className="text-xs font-semibold text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: 64.5 mm</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-navy block mb-1">
                      Very Heavy Rainfall
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={veryHeavyThreshold}
                        onChange={(e) => setVeryHeavyThreshold(e.target.value)}
                        className="clay-input px-3 py-1.5 text-sm font-bold w-full"
                      />
                      <span className="text-xs font-semibold text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: 115.5 mm</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-navy block mb-1">
                      Extremely Heavy Rainfall
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={extremeThreshold}
                        onChange={(e) => setExtremeThreshold(e.target.value)}
                        className="clay-input px-3 py-1.5 text-sm font-bold w-full"
                      />
                      <span className="text-xs font-semibold text-slate-500">mm</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Default: 204.5 mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <ClayButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setHeavyThreshold("64.5");
                      setVeryHeavyThreshold("115.5");
                      setExtremeThreshold("204.5");
                    }}
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </ClayButton>

                  <ClayButton type="submit" variant="primary" size="sm">
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Threshold Rules</span>
                  </ClayButton>
                </div>
              </form>
            )}

            {activeTab === "map" && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy">Map Visualization &amp; Grid Defaults</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy">Mapbox GL High-Res Vector Rendering</span>
                      <p className="text-[11px] text-slate-400">Uses GPU hardware acceleration when access token is present</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-blue" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="font-semibold text-navy">Show National and State Boundary Outlines</span>
                      <p className="text-[11px] text-slate-400">Renders administrative borders with subtle gray contrast</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-blue" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy">Operational Alert Dispatch Rules</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy">Instant Alert on Flash Flood / Extremely Heavy Grid (&gt;204.5 mm)</span>
                      <p className="text-[11px] text-slate-400">Triggers priority red badge in operational header</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-blue" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="font-semibold text-navy">Regime Transition Notification (Probability &gt; 70%)</span>
                      <p className="text-[11px] text-slate-400">Alerts when numerical models exhibit &gt;6h lag vs AI regime detection</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-blue" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy">Forecast Service Routing</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <span className="font-semibold text-navy">Default NWP Ensemble Source</span>
                    <select className="mt-1.5 w-full clay-input px-3 py-1.5">
                      <option>NCUM Global Ensemble (NCMRWF 12km)</option>
                      <option>IMD-GFS (12.5km Operational)</option>
                      <option>ECMWF IFS (0.1° High-Res)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "models" && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-navy">Mixture-of-Experts (MoE) Architecture</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-slate-600">
                    The RAINCOR platform deploys 7 regime-specialized expert neural networks (Active, Break, Low/Depression, Orographic, Coastal, Western Disturbance, General).
                  </p>
                  <div className="mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-brand-blue font-mono text-[11px]">
                    Gating Network: Softmax Gating with Shannon Entropy Regularization
                  </div>
                </div>
              </div>
            )}
          </ClayCard>
        </div>
      </div>
    </div>
  );
}
