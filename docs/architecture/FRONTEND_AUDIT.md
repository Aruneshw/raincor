# Frontend Audit Report: RainMind (Arjuna)

## Overview
The frontend repository (`frontend/`) is a comprehensive operational meteorological dashboard built with Next.js 14. It is designed to visualize 0.25° grid-based rainfall forecasts and regime classifications across the Indian landmass.

## Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Soft Claymorphism design system)
- **State Management:** Zustand (`store/`)
- **Mapping:** Mapbox GL JS (`components/maps/`)
- **Charts:** Chart.js (`components/charts/`)
- **Package Manager:** npm
- **Testing:** Jest + React Testing Library

## Implemented Pages (Routes)
The following functional areas have been verified as implemented in `frontend/app/`:
1. **Dashboard** (`/dashboard`): India rainfall overview, core KPI cards, map, alerts.
2. **Forecast** (`/forecast`): Lead-time controls (T+6h to T+72h), model comparison, heavy rain thresholds.
3. **Regime** (`/regime`): Spatial mapping of 7 monsoon regimes, Markov transition matrix.
4. **Transition** (`/transition`): Regime shift hotspots, lag tracking, neighbour consistency.
5. **Uncertainty** (`/uncertainty`): P10/P50/P90 prediction intervals, Shannon entropy.
6. **Verification** (`/verification`): Skill metrics (CSI, ETS, POD, FAR, FSS, RMSE).
7. **Climatology** (`/climatology`): AIMR tracking against 30-year IMD normals.
8. **Data Monitor** (`/data-monitor`): Telemetry, latency, ingestion logs.
9. **Settings** (`/settings`): Thresholds, Mapbox config, alerts.

*(Note: "Extreme Alerts", "District View", "Time Series" exist as components or modalities within the pages above rather than standalone top-level pages.)*

## Components Structure
- `cards/`: KPI, Alert, Uncertainty cards.
- `charts/`: Rainfall, Regime Distribution, Reliability Plot, Skill Bar charts.
- `grid-inspector/`: Time-Series modal and grid detail panel.
- `layout/`: App Shell, Sidebar, Header.
- `maps/`: India Map, Map Legend, Map Toolbar.
- `ui/`: Reusable claymorphic UI elements (cards, buttons, badges, tabs).

## API & Mock Data Integration
The frontend strictly isolates API calls in `frontend/services/api/client.ts`. It uses an environment variable `NEXT_PUBLIC_API_BASE_URL` to route requests:
- If empty (or mock mode), it falls back to rich local mock services (`frontend/services/mock/`).
- If populated, it calls the remote REST API under `/api/v1/`.

## Authentication
**None present.** The dashboard currently operates without an authentication wall, assuming an internal or restricted network deployment context.

## State Management (Zustand)
- `filter-store.ts`: Tracks selected season, region, and state.
- `forecast-store.ts`: Tracks lead time, display mode, threshold, and comparison model.
- `map-store.ts`: Tracks map viewport, selected grid cell (`selectedGridId`), active layer, and inspector visibility.

## Environment Variables (`.env.local`)
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox API key.
- `NEXT_PUBLIC_API_BASE_URL`: Backend URL for FastAPI.
- `NEXT_PUBLIC_APP_ENV`: Environment flag (e.g., development/production).

## API Response Formats (Expected by Frontend)
The frontend expects strict JSON structures matching its TypeScript definitions in `frontend/types/`. 

Key structures expected:
1. **ForecastResponse**: `timestamp`, `leadTime`, `displayMode`, `totalGrids`, `grids` (array of `GridCell` objects with properties like `nwpRainfallMm`, `regime`, `p10Mm`, etc.)
2. **GridTimeSeriesResponse**: `gridId`, `series` array of points (`time`, `nwpMm`, `correctedMm`, etc.)
3. **RegimeResponse**: `distribution` array, `matrix` (transition probabilities).
4. **TransitionResponse**: `hotspots` array of grid transitions, `dominantTransitions`.
5. **UncertaintyResponse**: `zones`, `spreadHistogram`, `meanEntropy`.
6. **VerificationResponse**: `models` (RMSE, CSI, POD), `thresholdSkills`, `reliabilityCurve`.
7. **ClimatologyResponse**: `monthly` departures, `subdivisions` normal/actuals.
8. **DataMonitorResponse**: `sources` array (health telemetry), `recentLogs`.
