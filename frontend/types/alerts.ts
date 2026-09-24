import { AlertType } from "@/components/cards/alert-card";

export type AlertSeverity = "high" | "medium" | "info";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  gridId: string;
  location: string;
  detail: string;
  timeAgo: string;
  severity: AlertSeverity;
  lat?: number;
  lon?: number;
}

export interface AlertFeedResponse {
  timestamp: string;
  activeCount: number;
  criticalCount: number;
  alerts: OperationalAlert[];
}
