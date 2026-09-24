import { ForecastResponse, ForecastLeadTime, ForecastDisplayMode, GridTimeSeriesResponse } from "@/types/forecast";
import { RegimeResponse } from "@/types/regime";
import { TransitionResponse } from "@/types/transition";
import { UncertaintyResponse } from "@/types/uncertainty";
import { VerificationResponse } from "@/types/verification";
import { ClimatologyResponse } from "@/services/mock/climatology-service";
import { DataMonitorResponse } from "@/types/data-monitor";
import { DistrictResponse } from "@/types/district";
import { AlertFeedResponse } from "@/types/alerts";

// Mock Service Implementations (Fallback when backend offline or in local mock mode)
import { fetchForecastData, fetchGridTimeSeries } from "@/services/mock/forecast-service";
import { fetchRegimeData } from "@/services/mock/regime-service";
import { fetchTransitionData } from "@/services/mock/transition-service";
import { fetchUncertaintyData } from "@/services/mock/uncertainty-service";
import { fetchVerificationData } from "@/services/mock/verification-service";
import { fetchClimatologyData } from "@/services/mock/climatology-service";
import { fetchDataMonitorStatus } from "@/services/mock/data-monitor-service";
import { fetchDistrictForecasts } from "@/services/mock/district-service";
import { fetchAlertsFeed } from "@/services/mock/alerts-service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const USE_MOCK = !API_BASE_URL;

async function apiFetch<T>(endpoint: string, fallbackFn: () => Promise<T>, options?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    return fallbackFn();
  }
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RainMind API] Request to ${endpoint} failed, falling back to local service:`, err);
    return fallbackFn();
  }
}

/**
 * Universal Raincor API Client
 * Seamlessly routes to FastAPI backend when configured, with graceful fallback.
 */
export const raincorApi = {
  // Forecast Services
  getForecast: async (
    leadTime: ForecastLeadTime = "T+24h",
    displayMode: ForecastDisplayMode = "bias_corrected"
  ): Promise<ForecastResponse> => {
    return apiFetch(
      `/api/v1/forecast?lead_time=${encodeURIComponent(leadTime)}&display_mode=${encodeURIComponent(displayMode)}`,
      () => fetchForecastData(leadTime, displayMode)
    );
  },

  getForecastMap: async (
    leadTime: ForecastLeadTime = "T+24h",
    displayMode: ForecastDisplayMode = "bias_corrected"
  ): Promise<any> => {
    return apiFetch(
      `/api/v1/forecast/map?lead_time=${encodeURIComponent(leadTime)}&display_mode=${encodeURIComponent(displayMode)}`,
      async () => {
        const forecast = await fetchForecastData(leadTime, displayMode);
        return {
          type: "FeatureCollection",
          features: forecast.grids.map((g) => ({
            type: "Feature",
            id: g.id,
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [g.lon - 0.125, g.lat - 0.125],
                  [g.lon + 0.125, g.lat - 0.125],
                  [g.lon + 0.125, g.lat + 0.125],
                  [g.lon - 0.125, g.lat + 0.125],
                  [g.lon - 0.125, g.lat - 0.125],
                ],
              ],
            },
            properties: g,
          })),
        };
      }
    );
  },

  getGridTimeSeries: async (gridId: string): Promise<GridTimeSeriesResponse> => {
    return apiFetch(
      `/api/v1/forecast/grids/${encodeURIComponent(gridId)}/timeseries`,
      () => fetchGridTimeSeries(gridId)
    );
  },

  getErrorMechanisms: async (): Promise<any> => {
    return apiFetch(
      "/api/v1/forecast/error-mechanisms",
      async () => ({
        timestamp: new Date().toISOString(),
        dominantMechanismNational: "OROGRAPHIC",
        mechanismsSummary: [
          { mechanism: "SPATIAL_DISPLACEMENT", label: "Spatial Displacement", probability: 0.38 },
          { mechanism: "TEMPORAL_TIMING", label: "Temporal Timing Lag", probability: 0.34 },
          { mechanism: "INTENSITY", label: "Intensity Bias", probability: 0.29 },
          { mechanism: "OROGRAPHIC", label: "Orographic Enhancement", probability: 0.48 },
          { mechanism: "COASTAL", label: "Coastal Convergence", probability: 0.42 },
          { mechanism: "CONVECTIVE", label: "Convective Initiation", probability: 0.31 },
          { mechanism: "MOISTURE_TRANSPORT", label: "Moisture Advection", probability: 0.26 },
          { mechanism: "PHYSICS_RESIDUAL", label: "Physics Residual", probability: 0.18 },
        ],
      })
    );
  },

  // Regime Classification Services
  getRegimeDistribution: async (): Promise<RegimeResponse> => {
    return apiFetch("/api/v1/regime/distribution", () => fetchRegimeData());
  },

  // Spatial Transition Services
  getTransitions: async (): Promise<TransitionResponse> => {
    return apiFetch("/api/v1/transition/monitor", () => fetchTransitionData());
  },

  // Uncertainty Services
  getUncertainty: async (): Promise<UncertaintyResponse> => {
    return apiFetch("/api/v1/uncertainty/quantiles", () => fetchUncertaintyData());
  },

  // Verification Services
  getVerification: async (): Promise<VerificationResponse> => {
    return apiFetch("/api/v1/verification/metrics", () => fetchVerificationData());
  },

  // District View Services
  getDistrictForecasts: async (): Promise<DistrictResponse> => {
    return apiFetch("/api/v1/district/forecast", () => fetchDistrictForecasts());
  },

  // Alerts Feed Services
  getAlerts: async (extremeOnly = false): Promise<AlertFeedResponse> => {
    const ep = extremeOnly ? "/api/v1/alerts/extreme" : "/api/v1/alerts";
    return apiFetch(ep, () => fetchAlertsFeed(extremeOnly));
  },

  // Climatology Services
  getClimatology: async (): Promise<ClimatologyResponse> => {
    return apiFetch("/api/v1/climatology/monsoon", () => fetchClimatologyData());
  },

  // Data Pipeline & Ingestion Health
  getDataMonitor: async (): Promise<DataMonitorResponse> => {
    return apiFetch("/api/v1/system/data-health", () => fetchDataMonitorStatus());
  },

  // Model Registry
  getModels: async (): Promise<any> => {
    return apiFetch("/api/v1/system/models", async () => ({
      timestamp: new Date().toISOString(),
      activePipeline: "RAINCOR Operational Pipeline",
      models: [
        { id: "mdl_raincor_moe", name: "RAINCOR MoE", version: "v2.4", status: "ACTIVE" },
        { id: "mdl_lgbm_regime", name: "Hierarchical Classifier", version: "v1.8", status: "ACTIVE" },
      ],
    }));
  },

  // Operational Settings
  getSettings: async (): Promise<any> => {
    return apiFetch("/api/v1/system/settings", async () => ({
      thresholds: { heavyThreshold: 64.5, veryHeavyThreshold: 115.5, extremeThreshold: 204.5 },
      forecast: { defaultLeadTime: "T+24h", defaultDisplayMode: "bias_corrected", spatialResolutionDeg: 0.25 },
      alerts: { enableSound: true, telegramDispatch: false, smsDispatch: false, highSeverityOnly: true },
      models: { activeMoE: true, gnnAdvectionLayer: true, quantileRegression: true },
    }));
  },

  updateSettings: async (settings: any): Promise<any> => {
    return apiFetch(
      "/api/v1/system/settings",
      async () => settings,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }
    );
  },
};

export const api = raincorApi;
