import React from "react";
import { AlertTriangle, CloudRain, RefreshCw, Compass } from "lucide-react";
import { ClayBadge } from "@/components/ui/clay-badge";

export type AlertType =
  | "Heavy Rainfall"
  | "Regime Transition"
  | "High Uncertainty"
  | "Orographic Rainfall"
  | "Model Deviation";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  gridId: string;
  location: string;
  detail: string;
  timeAgo: string;
  severity: "high" | "medium" | "info";
}

interface AlertCardProps {
  alert: OperationalAlert;
  onSelectGrid?: (gridId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onSelectGrid }) => {
  const getIcon = () => {
    switch (alert.type) {
      case "Heavy Rainfall":
        return <CloudRain className="w-4 h-4 text-weather-danger" />;
      case "Regime Transition":
        return <RefreshCw className="w-4 h-4 text-weather-purple" />;
      case "High Uncertainty":
        return <AlertTriangle className="w-4 h-4 text-weather-warning" />;
      case "Orographic Rainfall":
        return <Compass className="w-4 h-4 text-weather-success" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-brand-blue" />;
    }
  };

  const getBadgeVariant = () => {
    switch (alert.severity) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <div
      onClick={() => onSelectGrid?.(alert.gridId)}
      className="p-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-cyan-500/30 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 group-hover:bg-blue-50 dark:group-hover:bg-cyan-500/10 transition-colors">
            {getIcon()}
          </div>
          <span className="text-xs font-semibold text-navy dark:text-white">
            {alert.type}
          </span>
        </div>
        <ClayBadge variant={getBadgeVariant()} size="sm">
          {alert.severity.toUpperCase()}
        </ClayBadge>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
        {alert.location}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-navy dark:text-slate-200 font-mono text-[11px]">
          {alert.gridId} • {alert.detail}
        </span>
        <span className="text-slate-400 dark:text-slate-500 text-[10px]">{alert.timeAgo}</span>
      </div>
    </div>
  );
};

export default AlertCard;
