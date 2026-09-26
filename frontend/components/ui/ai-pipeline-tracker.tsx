"use client";

import React from "react";
import { Database, Network, GitMerge, Cpu, ShieldCheck, Activity, BarChart3, CloudRain, ChevronRight } from "lucide-react";
import { ClayCard } from "@/components/ui/clay-card";
import { cn } from "@/lib/utils";

const PIPELINE_STEPS = [
  { id: "data", name: "Data Ingestion", icon: Database, desc: "NWP & Obs", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "regime", name: "Regime", icon: CloudRain, desc: "Classification", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "error", name: "Error Diagnosis", icon: Activity, desc: "Residual Profiling", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { id: "moe", name: "Expert Routing", icon: GitMerge, desc: "MoE Gating", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "bias", name: "Bias Correction", icon: Cpu, desc: "AI Calibration", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { id: "uq", name: "Uncertainty", icon: BarChart3, desc: "Quantification", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { id: "verif", name: "Verification", icon: ShieldCheck, desc: "Skill Tracking", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
];

export const AIPipelineTracker = () => {
  return (
    <ClayCard className="p-4 mb-6 relative overflow-hidden">
      {/* Background animated gradient for "live" feel */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-purple-500 to-emerald-500 animate-pulse" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="shrink-0">
          <h2 className="text-sm font-extrabold text-navy dark:text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-brand-blue" />
            ARJUNA Intelligence Engine
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Live AI Processing Pipeline
          </p>
        </div>

        <div className="flex-1 w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="flex items-center justify-between min-w-[700px]">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === PIPELINE_STEPS.length - 1;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1.5 group relative">
                    {/* Active pulse ring */}
                    <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-500 scale-150 animate-ping" />
                    
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white/50 dark:border-white/10 shadow-sm transition-transform group-hover:scale-110", step.bg, step.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-navy dark:text-slate-200 leading-tight">
                        {step.name}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  
                  {!isLast && (
                    <div className="flex-1 px-2 flex items-center justify-center">
                      <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden rounded-full">
                        <div className="absolute top-0 left-0 h-full bg-brand-blue/40 w-full animate-[translateX_2s_ease-in-out_infinite]" 
                             style={{ animation: `translateX 2s infinite ${idx * 0.2}s` }} />
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 -ml-1" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes translateX {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </ClayCard>
  );
};
