import React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  change,
  subtitle,
  icon: Icon,
  iconColor = "text-brand-blue",
  badge,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "clay-kpi p-5 relative overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-clay-hover",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-muted">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-brand-blue-light/60 flex items-center justify-center text-brand-blue shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        )}
        {badge && !Icon && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-3xl font-bold tracking-tight text-navy">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-navy-muted">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        {change ? (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                change.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              {change.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
              )}
              {change.value}
            </span>
            {change.label && (
              <span className="text-slate-400 text-[11px]">{change.label}</span>
            )}
          </div>
        ) : subtitle ? (
          <span className="text-slate-400 text-xs font-medium">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};
