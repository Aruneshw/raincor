"use client";

import React, { useState } from "react";
import { Database, CloudRain, Activity, GitMerge, Cpu, BarChart3, ShieldCheck, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatRainfall, formatLatLon } from "@/lib/formatting";
import { UncertaintyCard } from "@/components/cards/uncertainty-card";

interface AIDecisionPipelineProps {
  grid: any;
}

export const AIDecisionPipeline: React.FC<AIDecisionPipelineProps> = ({ grid }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(4); // Expand Expert Routing by default or 0 for Input

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  const steps = [
    {
      id: 0,
      title: "Input Data Fusion",
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      content: (
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Primary Source</span>
            <span className="font-semibold text-navy dark:text-white">NCUM & IMD-GFS</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Location</span>
            <span className="font-semibold text-navy dark:text-white">{formatLatLon(grid.lat, grid.lon)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Elevation</span>
            <span className="font-semibold text-navy dark:text-white">{grid.elevationM}m</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Reanalysis</span>
            <span className="font-semibold text-navy dark:text-white">ERA5 Active</span>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Regime Intelligence",
      icon: CloudRain,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      content: (
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400">Current Classification</span>
            <span className="font-bold text-navy dark:text-white">{grid.regime}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400">Regime Probability</span>
            <span className="font-bold text-navy dark:text-white">{Math.round(grid.regimeProbability * 100)}%</span>
          </div>
          {grid.isTransitioning && (
            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
              <span className="text-purple-700 dark:text-purple-400">Transition Target</span>
              <span className="font-bold text-purple-800 dark:text-purple-300">→ {grid.transitionTarget} ({Math.round(grid.transitionProbability * 100)}%)</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400">Neighbour Consistency</span>
            <span className="font-bold text-navy dark:text-white">{Math.round((grid.neighbourConsistency || 0.8) * 100)}%</span>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Error Mechanism",
      icon: Activity,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      content: (
        <div className="bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 text-[11px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-rose-700 dark:text-rose-400 font-medium">Detected Bias Signature</span>
            <span className="font-bold text-rose-800 dark:text-rose-300">
              {grid.biasMm < 0 ? "Systematic Overestimation" : grid.biasMm > 0 ? "Convective Underestimation" : "Neutral Spatial Profile"}
            </span>
          </div>
          <p className="text-rose-600/80 dark:text-rose-400/80 leading-tight">
            Historical residual profiling for this grid indicates raw NWP {grid.biasMm < 0 ? "over-predicts" : "under-predicts"} intensity during {grid.regime} regimes.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Expert Routing",
      icon: GitMerge,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      content: (
        <div className="space-y-3 text-[11px]">
          <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">Softmax Gating Weights</div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 text-xs font-semibold text-navy dark:text-white">EMOS</div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[65%]" />
              </div>
              <div className="w-8 text-right font-medium text-slate-500">65%</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 text-xs font-semibold text-navy dark:text-white">QM</div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[20%]" />
              </div>
              <div className="w-8 text-right font-medium text-slate-500">20%</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 text-xs font-semibold text-navy dark:text-white">ML</div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[15%]" />
              </div>
              <div className="w-8 text-right font-medium text-slate-500">15%</div>
            </div>
          </div>

          <div className="mt-2 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Prototype Logic Active:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
               {grid.regime === "Orographic" ? "Topography Expert" : grid.regime === "Active" ? "Active Monsoon EMOS" : "General Gating Network"}
            </span>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Adaptive Bias Correction",
      icon: Cpu,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      content: (
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-center">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase mb-1">Raw NWP</div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatRainfall(grid.nwpRainfallMm)}</div>
          </div>
          <div className="flex flex-col items-center px-2">
            <div className={`text-xs font-extrabold ${grid.biasMm > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {grid.biasMm > 0 ? `+${grid.biasMm}` : grid.biasMm} mm
            </div>
            <div className="h-px w-12 bg-slate-300 dark:bg-slate-600 my-1 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-slate-300 dark:border-slate-600 transform rotate-45" />
            </div>
            <div className="text-[9px] text-slate-400">Correction</div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">ARJUNA</div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatRainfall(grid.correctedRainfallMm)}</div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Uncertainty Quantification",
      icon: BarChart3,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      content: (
        <UncertaintyCard
          p10={grid.p10Mm}
          p50={grid.p50Mm}
          p90={grid.p90Mm}
          entropy={grid.entropy}
          confidence={grid.confidence}
        />
      )
    },
    {
      id: 6,
      title: "Verification & Learning",
      icon: ShieldCheck,
      color: "text-teal-500",
      bg: "bg-teal-50 dark:bg-teal-900/20",
      content: (
        <div className="space-y-3 text-[11px]">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Forecast matching with IMD gauge network</span>
            <span className="animate-pulse text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Live
            </span>
          </div>
          
          {/* Visual learning flow */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-2 rounded-lg overflow-x-auto text-[9px] font-semibold text-navy dark:text-slate-300">
            <div className="text-center px-1">Forecast<br/>T=0</div>
            <div className="text-slate-400">→</div>
            <div className="text-center px-1 text-teal-600 dark:text-teal-400">Obs.<br/>T+24</div>
            <div className="text-slate-400">→</div>
            <div className="text-center px-1 text-rose-600 dark:text-rose-400">Error<br/>Calc</div>
            <div className="text-slate-400">→</div>
            <div className="text-center px-1 text-amber-600 dark:text-amber-400">Memory<br/>Update</div>
            <div className="text-slate-400">→</div>
            <div className="text-center px-1 text-brand-blue">Next<br/>Cycle</div>
          </div>
          
          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center">
            Residuals automatically update local grid correction weights.
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-2 mt-4 border-t border-slate-100 dark:border-white/10 pt-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        AI Decision Pipeline (Deep Dive)
      </div>
      
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => {
          const Icon = step.icon;
          const isExpanded = expandedStep === step.id;
          
          return (
            <div key={step.id} className="rounded-xl overflow-hidden bg-white dark:bg-[#111827] border border-slate-100 dark:border-white/10 transition-colors">
              <button
                onClick={() => toggleStep(step.id)}
                className={`w-full flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-white/5' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${step.bg} ${step.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-navy dark:text-slate-200">{step.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="p-3 pt-1 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-[#111827]">
                  {step.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
