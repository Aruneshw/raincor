# Backend Integration Plan

## Overview
This document outlines the integration plan for building the `services/api` (FastAPI) backend to fulfill the existing frontend's data requirements. The frontend has been audited and expects specific JSON payloads matching its TypeScript types.

## Target Endpoints
The backend must implement the following REST endpoints under `/api/v1/`:

| Frontend Service Method | API Endpoint | Expected Response Type (Frontend) |
| :--- | :--- | :--- |
| `getForecast(leadTime, displayMode)` | `GET /api/v1/forecast` | `ForecastResponse` |
| `getGridTimeSeries(gridId)` | `GET /api/v1/forecast/grids/{gridId}/timeseries` | `GridTimeSeriesResponse` |
| `getRegimeDistribution()` | `GET /api/v1/regime/distribution` | `RegimeResponse` |
| `getTransitions()` | `GET /api/v1/transition/monitor` | `TransitionResponse` |
| `getUncertainty()` | `GET /api/v1/uncertainty/quantiles` | `UncertaintyResponse` |
| `getVerification()` | `GET /api/v1/verification/metrics` | `VerificationResponse` |
| `getClimatology()` | `GET /api/v1/climatology/monsoon` | `ClimatologyResponse` |
| `getDataMonitor()` | `GET /api/v1/system/data-health` | `DataMonitorResponse` |

## Data Models
The backend schemas (Pydantic models) must strictly match the frontend TypeScript types:
- `GridCell`, `TimeSeriesPoint`
- `RegimeDistributionItem`, `RegimeProbabilityMatrix`
- `TransitionHotspot`
- `UncertaintyZone`
- `ModelMetricSet`, `ThresholdSkillScore`, `ReliabilityBin`
- `MonthlyClimatology`, `SubdivisionClimatology`
- `DataSourceHealth`, `IngestionLogEntry`

## Phase 1: API Scaffolding (Mock Parity)
1. Initialize FastAPI app in `services/api/app/main.py`.
2. Configure CORS to allow `http://localhost:3000`.
3. Create Pydantic schemas mirroring the frontend interfaces.
4. Port the existing mock logic from `frontend/services/mock/*.ts` to Python in the respective FastAPI routes, so that the frontend can seamlessly switch to the backend (`NEXT_PUBLIC_API_BASE_URL`) while retaining full functionality.

## Phase 2: ML & Data Pipeline Integration
Once the Python backend is serving the correct mock data format, subsequent stages will replace the mock logic with real ML inferences, regime classifications, and NWP processing pipelines using the planned architecture (e.g. `services/ml`, `services/spatial`).
