import React from "react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  id: T;
  label: string;
  badge?: string | number;
}

export interface ClayTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function ClayTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: ClayTabsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex p-1 bg-[#EEF4FA] dark:bg-slate-800/90 rounded-xl border border-white/80 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(11,42,74,0.05)]",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg font-medium transition-all duration-150",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs sm:text-sm",
              isActive
                ? "bg-white dark:bg-slate-700 text-navy dark:text-white font-semibold shadow-sm"
                : "text-navy-muted dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5"
            )}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  isActive
                    ? "bg-brand-blue text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
