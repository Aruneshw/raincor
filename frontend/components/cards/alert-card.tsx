import React from "react";
import { AlertTriangle, CloudRain, RefreshCw, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClayBadge } from "@/components/ui/clay-badge";

export type AlertType = "Heavy Rainfall" | "Regime Transition" | "High Uncertainty" | "Orographic Rainfall" | "Model Deviation";

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
      className="p-3.5 rounded-xl bg-white border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
            {getIcon()}
          </div>
          <span className="text-xs font-semibold text-navy">
            {alert.type}
          </span>
        </div>
        <ClayBadge variant={getBadgeVariant()} size="sm">
          {alert.gridId}
        </ClayBadge>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{alert.location}</span>
        <span className="font-semibold text-navy">{alert.detail}</span>
      </div>

      <div className="mt-1 text-[11px] text-slate-400 text-right">
        {alert.timeAgo}
      </div>
    </div>
  );
};
