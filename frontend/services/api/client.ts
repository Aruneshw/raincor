import { ForecastResponse, ForecastLeadTime, ForecastDisplayMode, GridTimeSeriesResponse } from "@/types/forecast";
import { RegimeResponse } from "@/types/regime";
import { TransitionResponse } from "@/types/transition";
import { UncertaintyResponse } from "@/types/uncertainty";
import { VerificationResponse } from "@/types/verification";
import { ClimatologyResponse } from "@/services/mock/climatology-service";
import { DataMonitorResponse } from "@/types/data-monitor";

// Mock Service Implementations
import { fetchForecastData, fetchGridTimeSeries } from "@/services/mock/forecast-service";
import { fetchRegimeData } from "@/services/mock/regime-service";
import { fetchTransitionData } from "@/services/mock/transition-service";
import { fetchUncertaintyData } from "@/services/mock/uncertainty-service";
import { fetchVerificationData } from "@/services/mock/verification-service";
import { fetchClimatologyData } from "@/services/mock/climatology-service";
import { fetchDataMonitorStatus } from "@/services/mock/data-monitor-service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const USE_MOCK = !API_BASE_URL;

/**
 * Universal Raincor API Client
 * Seamlessly routes to FastAPI backend when configured, or to typed local mock services.
 */
export const raincorApi = {
  // Forecast Services
  getForecast: async (leadTime: ForecastLeadTime = "T+24h", displayMode: ForecastDisplayMode = "bias_corrected"): Promise<ForecastResponse> => {
    if (USE_MOCK) return fetchForecastData(leadTime, displayMode);
    const res = await fetch(`${API_BASE_URL}/api/v1/forecast?lead_time=${leadTime}&display_mode=${displayMode}`);
    if (!res.ok) throw new Error("Failed to fetch forecast from NWP/AI service");
    return res.json();
  },

  getGridTimeSeries: async (gridId: string): Promise<GridTimeSeriesResponse> => {
    if (USE_MOCK) return fetchGridTimeSeries(gridId);
    const res = await fetch(`${API_BASE_URL}/api/v1/forecast/grids/${gridId}/timeseries`);
    if (!res.ok) throw new Error(`Failed to fetch timeseries for grid ${gridId}`);
    return res.json();
  },

  // Regime Classification Services
  getRegimeDistribution: async (): Promise<RegimeResponse> => {
    if (USE_MOCK) return fetchRegimeData();
    const res = await fetch(`${API_BASE_URL}/api/v1/regime/distribution`);
    if (!res.ok) throw new Error("Failed to fetch regime distribution");
    return res.json();
  },

  // Spatial Transition Services
  getTransitions: async (): Promise<TransitionResponse> => {
    if (USE_MOCK) return fetchTransitionData();
    const res = await fetch(`${API_BASE_URL}/api/v1/transition/monitor`);
    if (!res.ok) throw new Error("Failed to fetch spatial transition monitor data");
    return res.json();
  },

  // Uncertainty Services
  getUncertainty: async (): Promise<UncertaintyResponse> => {
    if (USE_MOCK) return fetchUncertaintyData();
    const res = await fetch(`${API_BASE_URL}/api/v1/uncertainty/quantiles`);
    if (!res.ok) throw new Error("Failed to fetch uncertainty quantification");
    return res.json();
  },

  // Verification Services
  getVerification: async (): Promise<VerificationResponse> => {
    if (USE_MOCK) return fetchVerificationData();
    const res = await fetch(`${API_BASE_URL}/api/v1/verification/metrics`);
    if (!res.ok) throw new Error("Failed to fetch model verification data");
    return res.json();
  },

  // Climatology Services
  getClimatology: async (): Promise<ClimatologyResponse> => {
    if (USE_MOCK) return fetchClimatologyData();
    const res = await fetch(`${API_BASE_URL}/api/v1/climatology/monsoon`);
    if (!res.ok) throw new Error("Failed to fetch monsoon climatology");
    return res.json();
  },

  // Data Pipeline & Ingestion Health
  getDataMonitor: async (): Promise<DataMonitorResponse> => {
    if (USE_MOCK) return fetchDataMonitorStatus();
    const res = await fetch(`${API_BASE_URL}/api/v1/system/data-health`);
    if (!res.ok) throw new Error("Failed to fetch data monitor status");
    return res.json();
  },
};
