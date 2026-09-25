# ARJUNA — India Monsoon Intelligence & Rainfall Forecasting Platform

> **Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts**  
> Operational weather intelligence system developed to Ministry of Earth Sciences (MoES), NCMRWF, and India Meteorological Department (IMD) standards.

---

## 1. Project Overview

**ARJUNA** is an India-focused operational meteorological forecasting platform designed for meteorologists, weather researchers, and control-room operators. 

Numerical Weather Prediction (NWP) models (e.g., NCUM, GFS, ECMWF) exhibit systematic bias across diverse Indian weather regimes—such as active monsoon phases, break periods, low-pressure depressions, orographic barriers along the Western Ghats, and western disturbances. ARJUNA solves this problem by:
1. Dynamically classifying 0.25° grid cells across the Indian landmass into **7 distinct meteorological regimes**.
2. Applying **adaptive regime-aware AI post-processing** and Mixture-of-Experts (MoE) routing to raw NWP forecasts.
3. Quantifying forecast uncertainty with **P10, P50, and P90 quantile prediction intervals** and Shannon entropy.
4. Detecting **spatial regime transitions** up to 12 hours before standard numerical models resolve them.

---

## 2. Key Capabilities & Pages

| Page | Route | Description |
| :--- | :--- | :--- |
| **Operational Dashboard** | `/dashboard` | India rainfall overview, 4 core KPI cards, interactive 17,415 grid map, priority operational alerts, and regime distribution visualizer. |
| **Precipitation Forecast** | `/forecast` | Lead-time controls (T+6h to T+72h), model comparison (Raw NWP vs ARJUNA vs Anomaly), and operational threshold exceedance counts (Moderate, Heavy, Very Heavy, Extreme). |
| **Regime Analysis** | `/regime` | Spatial mapping of the 7 Indian monsoon regimes, dynamic regime probability breakdown, and 72-hour Markov transition matrix. |
| **Transition Monitor** | `/transition` | High-priority surveillance of regime shift hotspots, NWP regime lag tracking (+6h delay identification), and neighbour spatial consistency index. |
| **Uncertainty Quantification** | `/uncertainty` | P10–P90 quantile interval surfaces, Shannon classification entropy, and confidence distributions across subdivisions. |
| **Model Verification** | `/verification` | Scientific verification scores (**CSI, ETS, POD, FAR, FSS, RMSE**) comparing NWP, ML baseline, MoE, and ARJUNA, including probability calibration reliability curves. |
| **Monsoon Climatology** | `/climatology` | All-India Monsoon Rainfall (AIMR) tracking against 30-year IMD normals (1991–2020) and subdivision departure categorizations. |
| **Data Feed Monitor** | `/data-monitor` | Health telemetry, latency, record counts, and quality assurance logs across NWP, IMD AWS, INSAT-3D/3DR QPE, and reanalysis. |
| **System Settings** | `/settings` | Operational threshold customization (64.5mm, 115.5mm, 204.5mm), Mapbox settings, alert dispatch rules, and model routing. |

---

## 3. Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript (strict mode enabled)
- **Styling & Design System**: Tailwind CSS with custom **soft claymorphism** design system (`clay-card`, `clay-kpi`, `clay-button`, `clay-badge`, subtle 3D depth, soft shadows, `#F3F8FC` canvas)
- **Geospatial Mapping**: Mapbox GL JS with interactive fallback canvas/SVG engine for immediate zero-token local execution
- **Charts & Data Visualization**: Chart.js + react-chartjs-2
- **State Management**: Zustand (UI and spatial selection state) + TanStack Query (server state & caching)
- **Testing**: Jest + React Testing Library (`@testing-library/jest-dom`)
- **Component Prototyping**: Storybook 8 configuration & stories
- **Icons**: Lucide React
- **DevOps**: Docker (multi-stage production container), GitHub Actions CI, Vercel

---

## 4. Design System: Soft Claymorphism

The user interface follows a professional, human-designed meteorological control room style:
- **Primary Navy**: `#0B2A4A` (typography and primary boundaries)
- **Deep Navy**: `#08213D`
- **Primary Blue**: `#2F80D9` (accent and interaction highlights)
- **Soft Blue**: `#EAF5FF` (clay pill highlights)
- **Background Canvas**: `#F3F8FC`
- **Cards**: Pure white `#FFFFFF` with soft 3D elevation, inner highlights (`inset 0 1px 1px rgba(255,255,255,0.95)`), and diffuse drop shadows (`shadow-clay`).
- **Meteorological Color Scale**: IMD standard thresholds for precipitation (0mm dry, 1–5mm light blue, 10–25mm moderate, 25–50mm rain blue, 50–100mm heavy, 100–200mm very heavy amber, 200–300mm extreme red, 300+mm exceptional purple).

---

## 5. Local Development Setup

### Prerequisites
- Node.js 20+ (tested on Node v20.18.0)
- npm 10+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/arjuna.git
cd arjuna

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional Mapbox GL API Token. If left blank, the app runs smoothly with the interactive high-resolution SVG/Canvas India grid engine. | Empty |
| `NEXT_PUBLIC_API_BASE_URL` | Optional FastAPI backend URL. If empty, typed local mock services run out-of-the-box. | Empty |
| `NEXT_PUBLIC_APP_ENV` | Application environment (`development` / `production`). | `development` |

### Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The application will load immediately on the operational dashboard.

---

## 6. Verification & Quality Commands

```bash
# Run Jest Unit & Integration Tests
npm test

# Run TypeScript Strict Type Checking
npm run typecheck

# Run ESLint Check
npm run lint

# Build Production Bundle
npm run build

# Start Production Server
npm start
```

---

## 7. Directory Structure

```
arjuna/
├── .github/workflows/ci.yml       # GitHub Actions CI automated pipeline
├── .storybook/                    # Storybook config (main.ts, preview.ts)
├── app/                           # Next.js App Router pages
│   ├── dashboard/page.tsx         # Executive operational overview
│   ├── forecast/page.tsx          # Precipitation forecast & bias correction
│   ├── regime/page.tsx            # 7-Regime classification & Markov matrix
│   ├── transition/page.tsx        # Spatial transition monitor & lag analysis
│   ├── uncertainty/page.tsx       # P10/P50/P90 prediction intervals & entropy
│   ├── verification/page.tsx      # CSI, ETS, POD, FAR, FSS skill metrics
│   ├── climatology/page.tsx       # 30-year IMD normals vs seasonal departures
│   ├── data-monitor/page.tsx      # Ingestion telemetry & pipeline audit logs
│   ├── settings/page.tsx          # IMD thresholds, alerts & model routing
│   ├── layout.tsx                 # Root layout with QueryClientProvider & fonts
│   └── page.tsx                   # Redirect to /dashboard
├── components/
│   ├── layout/                    # Sidebar, Header, AppShell
│   ├── maps/                      # IndiaMap, MapToolbar, MapLegend
│   ├── grid-inspector/            # GridInspector card & TimeSeriesModal
│   ├── cards/                     # KpiCard, AlertCard, UncertaintyCard
│   ├── charts/                    # RainfallChart, RegimeDistChart, SkillBarChart, ReliabilityPlot
│   └── ui/                        # ClayCard, ClayButton, ClayBadge, ClayTabs
├── lib/
│   ├── constants.ts               # IMD thresholds, regime palettes, coordinates
│   ├── grid-generator.ts          # 17,415 grid cell generator & spatial sampler
│   ├── formatting.ts              # Units, mm, percentage, and coordinate formatting
│   └── utils.ts                   # Tailwind cn helper
├── services/
│   ├── api/client.ts              # Typed API boundary (seamless FastAPI / mock switch)
│   └── mock/                      # Realistic mock services for all 8 subsystems
├── store/
│   ├── map-store.ts               # Selected grid, active layer, inspector visibility
│   ├── forecast-store.ts          # Lead time (T+6h to T+72h), model mode, threshold
│   └── filter-store.ts            # Selected season, region, and state
├── types/                         # Strict TypeScript domain interfaces
├── tests/                         # Jest unit & integration test suites
├── stories/                       # Storybook component stories
├── Dockerfile                     # Multi-stage production container
└── tailwind.config.ts             # Soft claymorphism theme extensions
```

---

## 8. Future FastAPI / ML Backend Integration

The frontend architecture strictly isolates data access behind `services/api/client.ts`. When the Python / FastAPI machine learning services are deployed, simply provide the backend endpoint in your `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.arjuna.gov.in
```

The client will automatically route all requests to the following REST endpoints:
- `GET /api/v1/forecast?lead_time=T+24h&display_mode=bias_corrected`
- `GET /api/v1/forecast/grids/{gridId}/timeseries`
- `GET /api/v1/regime/distribution`
- `GET /api/v1/transition/monitor`
- `GET /api/v1/uncertainty/quantiles`
- `GET /api/v1/verification/metrics`
- `GET /api/v1/climatology/monsoon`
- `GET /api/v1/system/data-health`

---

## 9. Vercel Deployment

ARJUNA is zero-config ready for Vercel deployment:
1. Push your repository to GitHub.
2. In Vercel, import the repository.
3. Framework Preset: **Next.js**.
4. Configure optional Environment Variables (`NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_API_BASE_URL`).
5. Click **Deploy**. Production builds are automatically triggered on pushes to `main`.
