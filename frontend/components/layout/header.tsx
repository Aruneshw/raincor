"use client";

import React from "react";
import { Calendar, Moon, Sun } from "lucide-react";
import { useFilterStore } from "@/store/filter-store";
import { useForecastStore } from "@/store/forecast-store";
import { useThemeStore } from "@/store/theme-store";
import { ForecastLeadTime } from "@/types/forecast";

export const Header: React.FC = () => {
  const { selectedSeason, setSelectedSeason } = useFilterStore();
  const { leadTime, setLeadTime } = useForecastStore();
  const { theme, toggleTheme } = useThemeStore();

  const leadTimes: ForecastLeadTime[] = ["T+6h", "T+12h", "T+24h", "T+48h", "T+72h"];

  return (
    <header className="w-full bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Title & Operational Subtitle */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-navy dark:text-white tracking-tight">
          India Rainfall Monitoring &amp; Forecasting System
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          NWP + AI + Regime Intelligence + Adaptive Bias Correction (NCMRWF / IMD Grid Domain)
        </p>
      </div>

      {/* Operational Controls, Filters & Theme Toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Season Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-navy dark:text-white shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer dark:text-white"
          >
            <option value="Monsoon 2026" className="dark:bg-slate-800 dark:text-white">
              Monsoon 2026 (JJAS)
            </option>
            <option value="Pre-Monsoon 2026" className="dark:bg-slate-800 dark:text-white">
              Pre-Monsoon 2026
            </option>
            <option value="Post-Monsoon 2025" className="dark:bg-slate-800 dark:text-white">
              Post-Monsoon 2025
            </option>
          </select>
        </div>

        {/* Lead Time Toggle Group */}
        <div className="flex items-center bg-[#EEF4FA] dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10">
          <span className="text-[11px] text-slate-400 dark:text-slate-400 px-2 font-medium hidden sm:inline">
            Lead:
          </span>
          {leadTimes.map((lt) => (
            <button
              key={lt}
              type="button"
              onClick={() => setLeadTime(lt)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                leadTime === lt
                  ? "bg-brand-blue text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              {lt}
            </button>
          ))}
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-90 duration-200" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
