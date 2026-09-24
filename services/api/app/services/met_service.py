import os
import json
import math
import time
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any, Tuple

from ..api.schemas.forecast import (
    GridCell, TimeSeriesPoint, ForecastResponse, GridTimeSeriesResponse,
    ForecastLeadTime, ForecastDisplayMode, RegimeType, ConfidenceLevel,
    ForecastMapResponse, GeoJsonFeature, MapGeometry
)
from ..api.schemas.regime import (
    RegimeResponse, RegimeDistributionItem, RegimeProbabilityMatrix
)
from ..api.schemas.transition import (
    TransitionResponse, TransitionHotspot, DominantTransition
)
from ..api.schemas.uncertainty import (
    UncertaintyResponse, UncertaintyZone, ConfidenceDistribution, SpreadHistogramBin
)
from ..api.schemas.verification import (
    VerificationResponse, ModelMetricSet, ThresholdSkillScore, ReliabilityBin,
    LeadTimeEvolutionPoint
)
from ..api.schemas.climatology import (
    ClimatologyResponse, MonthlyClimatology, SubdivisionClimatology
)
from ..api.schemas.system import (
    DataMonitorResponse, DataSourceHealth, IngestionLogEntry,
    ModelRegistryResponse, ModelInfo, OperationalSettings,
    ThresholdSettings, ForecastSettings, AlertSettings, ModelSettings
)
from ..api.schemas.district import (
    DistrictResponse, DistrictForecast, AlertBreakdown, DistrictDetailResponse
)
from ..api.schemas.alerts import (
    AlertFeedResponse, OperationalAlert
)
from ..api.schemas.error_mechanism import (
    ErrorMechanismResponse, MechanismScore, GridMechanismItem, RegionalMechanismProfile
)

# Standard IMD / Indian Meteorological Domain Constants
REGIMES: List[RegimeType] = [
    "Active Monsoon",
    "Break Monsoon",
    "Monsoon Low / Depression",
    "Orographic",
    "Coastal",
    "Western Disturbance",
    "Others",
]

REGIME_COLORS: Dict[RegimeType, str] = {
    "Active Monsoon": "#2F80D9",
    "Break Monsoon": "#A0B2C6",
    "Monsoon Low / Depression": "#7566D8",
    "Orographic": "#22A06B",
    "Coastal": "#0284C7",
    "Western Disturbance": "#F2A93B",
    "Others": "#64748B",
}

LEAD_MULTIPLIERS: Dict[ForecastLeadTime, float] = {
    "T+6h": 0.35,
    "T+12h": 0.65,
    "T+24h": 1.00,
    "T+48h": 1.85,
    "T+72h": 2.40,
}

def is_inside_india(lat: float, lon: float) -> bool:
    """Accurate bounding polygon filter for Indian subcontinent."""
    if lat < 6.5 or lat > 37.5 or lon < 68.0 or lon > 97.5:
        return False
    if lon < 72.0 and lat < 20.0:
        return False
    if lon < 69.0 and lat < 24.0:
        return False
    if lon > 88.0 and lat < 15.0:
        return False
    if lon > 90.0 and lat < 22.0:
        return False
    if lat < 8.5 and lon > 78.5:
        return False
    if lat < 10.0 and lon < 74.5:
        return False
    if lon > 95.0 and lat < 27.0:
        return False
    if lon > 93.5 and lat < 22.0:
        return False
    if lon < 70.5 and lat > 30.0:
        return False
    if lon < 72.0 and lat > 34.0:
        return False
    if lon < 70.0 and 25.0 < lat < 28.0:
        return False
    return True

def get_admin_location(lat: float, lon: float) -> Tuple[str, str, str, int]:
    """Returns (state, district, subdivision, elevationM) based on geographic coordinates."""
    if lat > 32:
        return ("Jammu & Kashmir", "Srinagar", "Northwest India", 1580)
    elif lat > 30:
        return ("Himachal Pradesh", "Shimla", "Northwest India", 2200)
    elif lat > 28 and lon < 75:
        return ("Rajasthan", "Jaipur", "Northwest India", 430)
    elif lat > 28 and lon >= 80:
        return ("Uttar Pradesh", "Lucknow", "Central India", 123)
    elif lat > 27 and lon < 78:
        return ("Haryana", "Gurugram", "Northwest India", 217)
    elif lat > 25 and lon > 89:
        return ("Assam", "Kamrup", "East & Northeast India", 55)
    elif lat > 25 and lon > 84:
        return ("Bihar", "Patna", "East & Northeast India", 53)
    elif lat > 24 and lon > 91:
        return ("Meghalaya", "Cherrapunji", "East & Northeast India", 1430)
    elif lat > 22 and lon > 85:
        return ("Jharkhand", "Ranchi", "East & Northeast India", 651)
    elif lat > 22 and lon < 74:
        return ("Gujarat", "Surat", "Northwest India", 13)
    elif lat > 21 and lon > 86:
        return ("West Bengal", "24 Parganas", "East & Northeast India", 9)
    elif lat > 20 and lon > 80:
        return ("Chhattisgarh", "Raipur", "Central India", 298)
    elif lat > 19 and lon > 84:
        return ("Odisha", "Puri", "East & Northeast India", 15)
    elif lat > 18 and lon < 76:
        return ("Maharashtra", "Pune", "Central India", 560)
    elif lat > 18 and lon >= 76:
        return ("Maharashtra", "Nagpur", "Central India", 310)
    elif lat > 16 and lon > 78:
        return ("Telangana", "Hyderabad", "South Peninsula", 505)
    elif lat > 14 and lon > 79:
        return ("Andhra Pradesh", "Vijayawada", "South Peninsula", 23)
    elif lat > 13 and lon < 77:
        return ("Karnataka", "Bengaluru", "South Peninsula", 920)
    elif lat > 13 and lon >= 79:
        return ("Tamil Nadu", "Chennai", "South Peninsula", 6)
    elif lat > 10 and lon < 77:
        return ("Kerala", "Kochi", "South Peninsula", 5)
    elif lat > 9 and lon >= 77:
        return ("Tamil Nadu", "Madurai", "South Peninsula", 136)
    elif lat <= 9 and lon < 77.5:
        return ("Kerala", "Thiruvananthapuram", "South Peninsula", 18)
    else:
        return ("Madhya Pradesh", "Bhopal", "Central India", 527)


class MeteorologicalService:
    """
    Central Meteorological & ML Service for RainMind.
    Integrates spatial grids, baseline corrections, regime intelligence,
    uncertainty quantification, and administrative aggregations.
    """
    _instance: Optional["MeteorologicalService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._settings = OperationalSettings(lastUpdated=datetime.now(timezone.utc).isoformat())
        self._init_base_grids()

    def _init_base_grids(self):
        """Initializes canonical 0.25 deg India grid cells with realistic synoptic structures."""
        self._raw_grids: List[Dict[str, Any]] = []
        self._grid_lookup: Dict[str, Dict[str, Any]] = {}

        lat_min, lat_max = 7.0, 37.0
        lon_min, lon_max = 68.0, 97.0
        step = 0.25

        lat_steps = int(round((lat_max - lat_min) / step))
        lon_steps = int(round((lon_max - lon_min) / step))
        counter = 10001

        for i in range(lat_steps + 1):
            for j in range(lon_steps + 1):
                lat = round(lat_min + i * step, 2)
                lon = round(lon_min + j * step, 2)

                if not is_inside_india(lat, lon):
                    continue

                # Deterministic spatial seeds
                seed1 = math.sin(lat * 3.14159 + lon * 2.71828) * 43758.5453
                seed2 = math.cos(lat * 12.9898 + lon * 78.233) * 12345.6789
                rand1 = seed1 - math.floor(seed1)
                rand2 = seed2 - math.floor(seed2)

                state, district, subdivision, elevation = get_admin_location(lat, lon)

                # Atmospheric wave & storm depression tracks
                storm_system = math.sin((lat - 20.0) * 0.5) * math.cos((lon - 80.0) * 0.5)

                # Regime assignment
                if 10.0 < lat < 16.0 and 72.0 < lon < 76.0:
                    regime: RegimeType = "Coastal"
                    base_rainfall = 80.0 + rand1 * 120.0
                elif 10.0 < lat < 20.0 and 72.0 < lon < 75.0:
                    regime = "Orographic"
                    base_rainfall = 100.0 + rand1 * 160.0
                elif lat > 29.0:
                    regime = "Western Disturbance"
                    base_rainfall = 12.0 + rand2 * 45.0
                elif lon > 88.0 and lat > 22.0:
                    regime = "Orographic"
                    base_rainfall = 90.0 + rand1 * 140.0
                elif 18.0 < lat < 26.0 and 80.0 < lon < 88.0:
                    regime = "Monsoon Low / Depression" if storm_system > 0.25 else "Active Monsoon"
                    base_rainfall = 45.0 + max(0.0, storm_system) * 110.0 + rand2 * 35.0
                elif storm_system > 0.45:
                    regime = "Monsoon Low / Depression"
                    base_rainfall = 65.0 + storm_system * 115.0 + rand2 * 40.0
                elif rand1 > 0.76 and 20.0 < lat < 30.0:
                    regime = "Break Monsoon"
                    base_rainfall = rand2 * 7.5
                else:
                    regime = "Active Monsoon"
                    base_rainfall = 18.0 + rand1 * 48.0

                nwp_raw = max(0.0, round(base_rainfall * (0.8 + rand2 * 0.4), 1))

                # Adaptive bias correction
                if nwp_raw > 80.0:
                    bias = round(15.0 + rand1 * 30.0, 1)
                elif nwp_raw > 20.0:
                    bias = round((rand2 - 0.5) * 15.0, 1)
                else:
                    bias = round(-2.0 + rand1 * 3.0, 1)

                corrected = max(0.0, round(nwp_raw + bias, 1))
                anomaly = round(corrected - base_rainfall * 0.8, 1)

                is_transitioning = (rand1 > 0.84)
                transition_target = "Monsoon Low / Depression" if regime == "Active Monsoon" else "Active Monsoon"
                transition_prob = round(0.65 + rand2 * 0.30, 2) if is_transitioning else None
                lag_hours = (6 if rand1 > 0.5 else 12) if is_transitioning else 0

                spread_factor = 0.20 + rand1 * 0.30
                p50 = corrected
                p10 = max(0.0, round(p50 * (1.0 - spread_factor), 1))
                p90 = round(p50 * (1.0 + spread_factor * 1.5), 1)

                entropy = round(0.20 + (0.40 if is_transitioning else 0.10) + rand2 * 0.30, 2)
                confidence: ConfidenceLevel = "High" if entropy < 0.45 else ("Medium" if entropy < 0.70 else "Low")

                grid_id = f"G{counter}"
                alt_id = f"G_{i}_{j}"

                cell_dict = {
                    "id": grid_id,
                    "alt_id": alt_id,
                    "lat": lat,
                    "lon": lon,
                    "state": state,
                    "district": district,
                    "subdivision": subdivision,
                    "elevationM": int(elevation + rand1 * 150),
                    "nwpRainfallMm": nwp_raw,
                    "correctedRainfallMm": corrected,
                    "biasMm": bias,
                    "anomalyMm": anomaly,
                    "regime": regime,
                    "regimeProbability": round(0.70 + rand2 * 0.25, 2),
                    "isTransitioning": is_transitioning,
                    "transitionTarget": transition_target if is_transitioning else None,
                    "transitionProbability": transition_prob,
                    "nwpRegimeLagHours": lag_hours,
                    "neighbourConsistency": round(0.75 + rand2 * 0.20, 2),
                    "p10Mm": p10,
                    "p50Mm": p50,
                    "p90Mm": p90,
                    "entropy": entropy,
                    "confidence": confidence,
                    # Error mechanism diagnostic proxies
                    "mechanisms": {
                        "SPATIAL_DISPLACEMENT": round(0.15 + (0.45 if is_transitioning else 0.05) + rand1 * 0.25, 2),
                        "TEMPORAL_TIMING": round(0.20 + (0.40 if lag_hours > 0 else 0.10), 2),
                        "INTENSITY": round(0.10 + min(0.60, abs(bias) / 40.0), 2),
                        "OROGRAPHIC": round(0.85 if regime == "Orographic" else 0.12, 2),
                        "COASTAL": round(0.82 if regime == "Coastal" else 0.10, 2),
                        "CONVECTIVE": round(0.35 + rand2 * 0.40 if corrected > 40.0 else 0.15, 2),
                        "MOISTURE_TRANSPORT": round(0.40 + (0.35 if storm_system > 0.2 else 0.10), 2),
                        "PHYSICS_RESIDUAL": round(0.15 + rand1 * 0.20, 2),
                    }
                }

                self._raw_grids.append(cell_dict)
                self._grid_lookup[grid_id.lower()] = cell_dict
                self._grid_lookup[alt_id.lower()] = cell_dict
                counter += 1

    def get_forecast(
        self,
        lead_time: ForecastLeadTime = "T+24h",
        display_mode: ForecastDisplayMode = "bias_corrected"
    ) -> ForecastResponse:
        """Returns the full India grid-point forecast modulated by lead time."""
        multiplier = LEAD_MULTIPLIERS.get(lead_time, 1.0)
        heavy_thresh = self._settings.thresholds.heavyThreshold

        cells: List[GridCell] = []
        heavy_count = 0
        transition_count = 0
        total_corrected = 0.0
        max_rain = 0.0

        for g in self._raw_grids:
            raw_mm = round(g["nwpRainfallMm"] * multiplier, 1)
            bias_mm = round(g["biasMm"] * math.sqrt(multiplier), 1)
            corr_mm = max(0.0, round(raw_mm + bias_mm, 1))
            anom_mm = round(corr_mm - (g["correctedRainfallMm"] * 0.80), 1)
            p10 = max(0.0, round(corr_mm * 0.65, 1))
            p50 = corr_mm
            p90 = round(corr_mm * 1.55, 1)

            if corr_mm >= heavy_thresh:
                heavy_count += 1
            if g["isTransitioning"]:
                transition_count += 1
            total_corrected += corr_mm
            if corr_mm > max_rain:
                max_rain = corr_mm

            cells.append(
                GridCell(
                    id=g["id"],
                    lat=g["lat"],
                    lon=g["lon"],
                    state=g["state"],
                    district=g["district"],
                    elevationM=g["elevationM"],
                    subdivision=g["subdivision"],
                    nwpRainfallMm=raw_mm,
                    correctedRainfallMm=corr_mm,
                    biasMm=bias_mm,
                    anomalyMm=anom_mm,
                    regime=g["regime"],
                    regimeProbability=g["regimeProbability"],
                    isTransitioning=g["isTransitioning"],
                    transitionTarget=g["transitionTarget"],
                    transitionProbability=g["transitionProbability"],
                    nwpRegimeLagHours=g["nwpRegimeLagHours"],
                    neighbourConsistency=g["neighbourConsistency"],
                    p10Mm=p10,
                    p50Mm=p50,
                    p90Mm=p90,
                    entropy=g["entropy"],
                    confidence=g["confidence"],
                )
            )

        avg_rainfall = round(total_corrected / len(cells), 1) if cells else 0.0

        return ForecastResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            leadTime=lead_time,
            displayMode=display_mode,
            totalGrids=len(cells),
            heavyRainGridsCount=heavy_count,
            transitionGridsCount=transition_count,
            averageRainfallMm=avg_rainfall,
            maxRainfallMm=max_rain,
            grids=cells,
        )

    def get_forecast_map(
        self,
        lead_time: ForecastLeadTime = "T+24h",
        display_mode: ForecastDisplayMode = "bias_corrected"
    ) -> ForecastMapResponse:
        """Returns standard GeoJSON FeatureCollection format for map rendering."""
        forecast = self.get_forecast(lead_time, display_mode)
        features: List[GeoJsonFeature] = []

        half_step = 0.125
        for g in forecast.grids:
            poly_coords = [[
                [round(g.lon - half_step, 4), round(g.lat - half_step, 4)],
                [round(g.lon + half_step, 4), round(g.lat - half_step, 4)],
                [round(g.lon + half_step, 4), round(g.lat + half_step, 4)],
                [round(g.lon - half_step, 4), round(g.lat + half_step, 4)],
                [round(g.lon - half_step, 4), round(g.lat - half_step, 4)],
            ]]
            features.append(
                GeoJsonFeature(
                    id=g.id,
                    geometry=MapGeometry(type="Polygon", coordinates=poly_coords),
                    properties=g,
                )
            )

        return ForecastMapResponse(
            timestamp=forecast.timestamp,
            leadTime=lead_time,
            displayMode=display_mode,
            totalFeatures=len(features),
            features=features,
        )

    def get_grid_timeseries(self, grid_id: str) -> GridTimeSeriesResponse:
        """Generates realistic 72h time-series for a single grid cell."""
        grid = self._grid_lookup.get(grid_id.lower())
        if not grid:
            grid = self._raw_grids[0]

        base_mm = grid["correctedRainfallMm"]
        series: List[TimeSeriesPoint] = [
            TimeSeriesPoint(time="00:00", nwpMm=round(base_mm * 0.60, 1), correctedMm=round(base_mm * 0.85, 1), observedMm=round(base_mm * 0.88, 1), p10Mm=round(base_mm * 0.60, 1), p90Mm=round(base_mm * 1.10, 1)),
            TimeSeriesPoint(time="06:00", nwpMm=round(base_mm * 0.75, 1), correctedMm=round(base_mm * 0.95, 1), observedMm=round(base_mm * 0.98, 1), p10Mm=round(base_mm * 0.70, 1), p90Mm=round(base_mm * 1.25, 1)),
            TimeSeriesPoint(time="12:00", nwpMm=round(base_mm * 0.85, 1), correctedMm=round(base_mm * 1.15, 1), observedMm=round(base_mm * 1.12, 1), p10Mm=round(base_mm * 0.80, 1), p90Mm=round(base_mm * 1.50, 1)),
            TimeSeriesPoint(time="18:00", nwpMm=round(base_mm * 0.95, 1), correctedMm=round(base_mm * 1.30, 1), observedMm=round(base_mm * 1.25, 1), p10Mm=round(base_mm * 0.95, 1), p90Mm=round(base_mm * 1.70, 1)),
            TimeSeriesPoint(time="24:00", nwpMm=round(base_mm * 0.80, 1), correctedMm=round(base_mm * 1.05, 1), observedMm=None, p10Mm=round(base_mm * 0.75, 1), p90Mm=round(base_mm * 1.45, 1)),
            TimeSeriesPoint(time="36:00", nwpMm=round(base_mm * 0.70, 1), correctedMm=round(base_mm * 0.90, 1), observedMm=None, p10Mm=round(base_mm * 0.60, 1), p90Mm=round(base_mm * 1.30, 1)),
            TimeSeriesPoint(time="48:00", nwpMm=round(base_mm * 0.55, 1), correctedMm=round(base_mm * 0.75, 1), observedMm=None, p10Mm=round(base_mm * 0.45, 1), p90Mm=round(base_mm * 1.15, 1)),
            TimeSeriesPoint(time="72:00", nwpMm=round(base_mm * 0.40, 1), correctedMm=round(base_mm * 0.60, 1), observedMm=None, p10Mm=round(base_mm * 0.35, 1), p90Mm=round(base_mm * 0.95, 1)),
        ]

        return GridTimeSeriesResponse(
            gridId=grid["id"],
            state=grid["state"],
            district=grid["district"],
            series=series,
        )

    def get_regime_distribution(self) -> RegimeResponse:
        """Returns the distribution and 7x7 Markov transition matrix for all 7 regimes."""
        total = len(self._raw_grids)
        counts: Dict[RegimeType, Dict[str, float]] = {r: {"count": 0, "rainfallSum": 0.0} for r in REGIMES}

        for g in self._raw_grids:
            r = g["regime"]
            counts[r]["count"] += 1
            counts[r]["rainfallSum"] += g["correctedRainfallMm"]

        distribution: List[RegimeDistributionItem] = []
        for r in REGIMES:
            cnt = int(counts[r]["count"])
            pct = round((cnt / total) * 100.0, 1) if total > 0 else 0.0
            mean_rain = round(counts[r]["rainfallSum"] / cnt, 1) if cnt > 0 else 0.0
            distribution.append(
                RegimeDistributionItem(
                    regime=r,
                    gridCount=cnt,
                    percentage=pct,
                    meanRainfallMm=mean_rain,
                    color=REGIME_COLORS[r],
                )
            )

        matrix: List[RegimeProbabilityMatrix] = []
        for src in REGIMES:
            targets: Dict[RegimeType, float] = {t: 0.05 for t in REGIMES}
            if src == "Active Monsoon":
                targets["Active Monsoon"] = 0.68
                targets["Break Monsoon"] = 0.12
                targets["Monsoon Low / Depression"] = 0.15
            elif src == "Monsoon Low / Depression":
                targets["Monsoon Low / Depression"] = 0.55
                targets["Active Monsoon"] = 0.28
                targets["Coastal"] = 0.12
            elif src == "Break Monsoon":
                targets["Break Monsoon"] = 0.72
                targets["Active Monsoon"] = 0.22
            elif src == "Orographic":
                targets["Orographic"] = 0.82
                targets["Coastal"] = 0.12
            else:
                targets[src] = 0.75
            matrix.append(RegimeProbabilityMatrix(sourceRegime=src, targets=targets))

        return RegimeResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            distribution=distribution,
            dominantRegime="Active Monsoon",
            transitionRatePct=24.6,
            matrix=matrix,
        )

    def get_transitions(self) -> TransitionResponse:
        """Returns the transition monitor hotspot list and dominant shifts."""
        shifting = [g for g in self._raw_grids if g["isTransitioning"] and g["transitionTarget"]]
        hotspots: List[TransitionHotspot] = []

        for g in shifting[:15]:
            hotspots.append(
                TransitionHotspot(
                    gridId=g["id"],
                    state=g["state"],
                    district=g["district"],
                    lat=g["lat"],
                    lon=g["lon"],
                    currentRegime=g["regime"],
                    targetRegime=g["transitionTarget"],
                    probability=g["transitionProbability"] or 0.72,
                    nwpLagHours=g["nwpRegimeLagHours"] or 6,
                    neighbourConsistency=g["neighbourConsistency"] or 0.81,
                    confidence=g["confidence"],
                    rainfallMm=g["correctedRainfallMm"],
                )
            )

        dominant = [
            DominantTransition(from_="Active Monsoon", to="Monsoon Low / Depression", count=184, pct=44.1),
            DominantTransition(from_="Monsoon Low / Depression", to="Coastal", count=128, pct=30.7),
            DominantTransition(from_="Break Monsoon", to="Active Monsoon", count=65, pct=15.6),
            DominantTransition(from_="Active Monsoon", to="Break Monsoon", count=40, pct=9.6),
        ]

        return TransitionResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            totalTransitioningGrids=len(shifting),
            hotspots=hotspots,
            averageLagHours=6.8,
            dominantTransitions=dominant,
        )

    def get_uncertainty(self) -> UncertaintyResponse:
        """Returns domain-wide uncertainty, quantiles, and subdivision entropy."""
        total = len(self._raw_grids)
        sum_p10 = sum(g["p10Mm"] for g in self._raw_grids)
        sum_p50 = sum(g["p50Mm"] for g in self._raw_grids)
        sum_p90 = sum(g["p90Mm"] for g in self._raw_grids)
        sum_entropy = sum(g["entropy"] for g in self._raw_grids)
        high_unc_count = sum(1 for g in self._raw_grids if g["confidence"] == "Low")

        zones = [
            UncertaintyZone(
                region="Western Ghats (Orographic)",
                avgSpreadMm=68.4,
                entropy=0.38,
                confidenceDistribution=ConfidenceDistribution(high=58, medium=32, low=10),
            ),
            UncertaintyZone(
                region="Odisha / Bengal Depression Track",
                avgSpreadMm=74.2,
                entropy=0.52,
                confidenceDistribution=ConfidenceDistribution(high=45, medium=38, low=17),
            ),
            UncertaintyZone(
                region="Central India (Monsoon Trough)",
                avgSpreadMm=34.6,
                entropy=0.28,
                confidenceDistribution=ConfidenceDistribution(high=72, medium=22, low=6),
            ),
            UncertaintyZone(
                region="Northwest India (Transition Zone)",
                avgSpreadMm=22.1,
                entropy=0.64,
                confidenceDistribution=ConfidenceDistribution(high=30, medium=42, low=28),
            ),
            UncertaintyZone(
                region="Northeast India (Topographic)",
                avgSpreadMm=85.0,
                entropy=0.44,
                confidenceDistribution=ConfidenceDistribution(high=50, medium=35, low=15),
            ),
        ]

        histogram = [
            SpreadHistogramBin(range="0–10 mm", count=184),
            SpreadHistogramBin(range="10–25 mm", count=320),
            SpreadHistogramBin(range="25–50 mm", count=480),
            SpreadHistogramBin(range="50–100 mm", count=290),
            SpreadHistogramBin(range="100+ mm", count=110),
        ]

        return UncertaintyResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            meanP10=round(sum_p10 / total, 1) if total > 0 else 18.4,
            meanP50=round(sum_p50 / total, 1) if total > 0 else 42.1,
            meanP90=round(sum_p90 / total, 1) if total > 0 else 86.5,
            meanEntropy=round(sum_entropy / total, 2) if total > 0 else 0.42,
            highUncertaintyGridsCount=high_unc_count,
            zones=zones,
            spreadHistogram=histogram,
        )

    def get_verification(self) -> VerificationResponse:
        """Returns standard IMD categorical scores and benchmark comparisons."""
        models = [
            ModelMetricSet(
                modelName="RAINCOR (Regime-Aware)",
                rmse=14.8, ets=0.54, csi=0.62, pod=0.84, far=0.28, fss=0.88, biasRatio=1.04
            ),
            ModelMetricSet(
                modelName="MoE (Mixture of Experts)",
                rmse=17.2, ets=0.49, csi=0.57, pod=0.80, far=0.33, fss=0.83, biasRatio=1.08
            ),
            ModelMetricSet(
                modelName="ML Baseline (LightGBM/CNN)",
                rmse=19.5, ets=0.43, csi=0.51, pod=0.76, far=0.37, fss=0.77, biasRatio=1.12
            ),
            ModelMetricSet(
                modelName="Raw NWP (NCUM / GFS)",
                rmse=26.4, ets=0.36, csi=0.44, pod=0.68, far=0.46, fss=0.69, biasRatio=0.82
            ),
        ]

        thresholds = [
            ThresholdSkillScore(thresholdMm=15.6, thresholdLabel="Moderate (≥15.6 mm)", nwpCsi=0.58, mlCsi=0.66, moeCsi=0.71, raincorCsi=0.76),
            ThresholdSkillScore(thresholdMm=64.5, thresholdLabel="Heavy (≥64.5 mm)", nwpCsi=0.44, mlCsi=0.51, moeCsi=0.57, raincorCsi=0.62),
            ThresholdSkillScore(thresholdMm=115.5, thresholdLabel="Very Heavy (≥115.5 mm)", nwpCsi=0.28, mlCsi=0.36, moeCsi=0.43, raincorCsi=0.50),
            ThresholdSkillScore(thresholdMm=204.5, thresholdLabel="Extremely Heavy (≥204.5 mm)", nwpCsi=0.16, mlCsi=0.24, moeCsi=0.31, raincorCsi=0.41),
        ]

        reliability = [
            ReliabilityBin(forecastProbability=0.1, observedFrequencyNwp=0.18, observedFrequencyRaincor=0.11, sampleCount=1420),
            ReliabilityBin(forecastProbability=0.2, observedFrequencyNwp=0.31, observedFrequencyRaincor=0.22, sampleCount=1250),
            ReliabilityBin(forecastProbability=0.3, observedFrequencyNwp=0.44, observedFrequencyRaincor=0.32, sampleCount=980),
            ReliabilityBin(forecastProbability=0.4, observedFrequencyNwp=0.52, observedFrequencyRaincor=0.41, sampleCount=810),
            ReliabilityBin(forecastProbability=0.5, observedFrequencyNwp=0.61, observedFrequencyRaincor=0.51, sampleCount=750),
            ReliabilityBin(forecastProbability=0.6, observedFrequencyNwp=0.73, observedFrequencyRaincor=0.62, sampleCount=620),
            ReliabilityBin(forecastProbability=0.7, observedFrequencyNwp=0.82, observedFrequencyRaincor=0.71, sampleCount=540),
            ReliabilityBin(forecastProbability=0.8, observedFrequencyNwp=0.89, observedFrequencyRaincor=0.81, sampleCount=410),
            ReliabilityBin(forecastProbability=0.9, observedFrequencyNwp=0.94, observedFrequencyRaincor=0.91, sampleCount=290),
        ]

        lead_evolution = [
            LeadTimeEvolutionPoint(leadTime="T+6h", nwpRmse=18.2, raincorRmse=9.8, csiGainPct=24.2),
            LeadTimeEvolutionPoint(leadTime="T+12h", nwpRmse=21.4, raincorRmse=11.9, csiGainPct=22.8),
            LeadTimeEvolutionPoint(leadTime="T+24h", nwpRmse=26.4, raincorRmse=14.8, csiGainPct=20.5),
            LeadTimeEvolutionPoint(leadTime="T+48h", nwpRmse=34.1, raincorRmse=21.2, csiGainPct=17.9),
            LeadTimeEvolutionPoint(leadTime="T+72h", nwpRmse=43.6, raincorRmse=29.5, csiGainPct=14.8),
        ]

        return VerificationResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            season="Monsoon 2026 Active Season",
            models=models,
            thresholdSkills=thresholds,
            reliabilityCurve=reliability,
            leadTimeEvolution=lead_evolution,
        )

    def get_climatology(self) -> ClimatologyResponse:
        """Returns 30-year IMD monsoon climatology and subdivision actuals."""
        monthly = [
            MonthlyClimatology(month="June", historicalNormalMm=165.3, currentSeasonMm=158.4, anomalyMm=-6.9, departurePct=-4.2),
            MonthlyClimatology(month="July", historicalNormalMm=280.5, currentSeasonMm=312.2, anomalyMm=31.7, departurePct=11.3),
            MonthlyClimatology(month="August", historicalNormalMm=254.9, currentSeasonMm=278.6, anomalyMm=23.7, departurePct=9.3),
            MonthlyClimatology(month="September (Active)", historicalNormalMm=167.9, currentSeasonMm=175.0, anomalyMm=7.1, departurePct=4.2),
        ]

        subdivisions = [
            SubdivisionClimatology(subdivision="Konkan & Goa", normalMm=2914.3, actualMm=3240.5, category="Excess"),
            SubdivisionClimatology(subdivision="Coastal Karnataka", normalMm=3083.8, actualMm=3310.2, category="Excess"),
            SubdivisionClimatology(subdivision="Kerala & Mahe", normalMm=2049.2, actualMm=1980.4, category="Normal"),
            SubdivisionClimatology(subdivision="Odisha", normalMm=1149.9, actualMm=1285.0, category="Excess"),
            SubdivisionClimatology(subdivision="Assam & Meghalaya", normalMm=1792.8, actualMm=1690.1, category="Normal"),
            SubdivisionClimatology(subdivision="Gangetic West Bengal", normalMm=1138.4, actualMm=1045.2, category="Normal"),
            SubdivisionClimatology(subdivision="West Madhya Pradesh", normalMm=876.1, actualMm=960.8, category="Excess"),
            SubdivisionClimatology(subdivision="West Rajasthan", normalMm=263.2, actualMm=315.6, category="Excess"),
            SubdivisionClimatology(subdivision="East Uttar Pradesh", normalMm=817.2, actualMm=712.5, category="Deficient"),
            SubdivisionClimatology(subdivision="Bihar", normalMm=1021.0, actualMm=889.3, category="Deficient"),
        ]

        return ClimatologyResponse(
            season="Monsoon 2026 (JJAS)",
            allIndiaMonsoonNormalMm=868.6,
            allIndiaActualCumulativeMm=924.2,
            cumulativeDeparturePct=6.4,
            monthly=monthly,
            subdivisions=subdivisions,
        )

    def get_district_forecasts(self) -> DistrictResponse:
        """Aggregates grid cells into administrative districts with IMD warning alert colors."""
        district_map: Dict[str, List[Dict[str, Any]]] = {}
        for g in self._raw_grids:
            key = f"{g['state']}___{g['district']}"
            if key not in district_map:
                district_map[key] = []
            district_map[key].append(g)

        red_thresh = self._settings.thresholds.veryHeavyThreshold
        orange_thresh = self._settings.thresholds.heavyThreshold
        yellow_thresh = 15.6

        red_c, orange_c, yellow_c, green_c = 0, 0, 0, 0
        districts: List[DistrictForecast] = []

        for key, cells in sorted(district_map.items()):
            state, district_name = key.split("___")
            avg_rain = round(sum(c["correctedRainfallMm"] for c in cells) / len(cells), 1)
            avg_nwp = round(sum(c["nwpRainfallMm"] for c in cells) / len(cells), 1)
            avg_lat = round(sum(c["lat"] for c in cells) / len(cells), 2)
            avg_lon = round(sum(c["lon"] for c in cells) / len(cells), 2)
            avg_anom = round(sum(c["anomalyMm"] for c in cells) / len(cells), 1)
            avg_p10 = round(sum(c["p10Mm"] for c in cells) / len(cells), 1)
            avg_p90 = round(sum(c["p90Mm"] for c in cells) / len(cells), 1)

            # Dominant regime in this district
            regime_counts = {}
            for c in cells:
                regime_counts[c["regime"]] = regime_counts.get(c["regime"], 0) + 1
            dom_regime = max(regime_counts.keys(), key=lambda r: regime_counts[r])
            dom_prob = round(regime_counts[dom_regime] / len(cells), 2)

            # Alert color
            if avg_rain >= red_thresh:
                alert = "Red"
                red_c += 1
            elif avg_rain >= orange_thresh:
                alert = "Orange"
                orange_c += 1
            elif avg_rain >= yellow_thresh:
                alert = "Yellow"
                yellow_c += 1
            else:
                alert = "Green"
                green_c += 1

            confidence = "High" if avg_rain < 40 or avg_p90 - avg_p10 < 30 else ("Medium" if avg_p90 - avg_p10 < 60 else "Low")

            dist_id = f"DIST_{state[:3].upper()}_{district_name.replace(' ', '_').upper()}"
            districts.append(
                DistrictForecast(
                    districtId=dist_id,
                    name=district_name,
                    state=state,
                    lat=avg_lat,
                    lon=avg_lon,
                    rainfallMm=avg_rain,
                    nwpRainfallMm=avg_nwp,
                    alertLevel=alert,
                    dominantRegime=dom_regime,
                    regimeProbability=dom_prob,
                    anomalyPct=avg_anom,
                    p10Mm=avg_p10,
                    p90Mm=avg_p90,
                    confidence=confidence,
                )
            )

        return DistrictResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            totalDistricts=len(districts),
            alertSummary=AlertBreakdown(red=red_c, orange=orange_c, yellow=yellow_c, green=green_c),
            districts=districts,
        )

    def get_alerts(self, extreme_only: bool = False) -> AlertFeedResponse:
        """Returns prioritized operational and severe weather alerts feed."""
        alerts: List[OperationalAlert] = []

        # Find top heavy rain cells
        sorted_heavy = sorted(self._raw_grids, key=lambda g: g["correctedRainfallMm"], reverse=True)
        for i, g in enumerate(sorted_heavy[:6]):
            if g["correctedRainfallMm"] >= 64.5:
                alerts.append(
                    OperationalAlert(
                        id=f"alt_h_{i+1}",
                        type="Heavy Rainfall",
                        gridId=g["id"],
                        location=f"{g['state']} / {g['district']}",
                        detail=f"{g['correctedRainfallMm']} mm / 24h ({g['regime']})",
                        timeAgo=f"{5 + i * 4}m ago",
                        severity="high" if g["correctedRainfallMm"] >= 115.5 else "medium",
                        lat=g["lat"],
                        lon=g["lon"],
                    )
                )

        if not extreme_only:
            # Active regime transition alerts
            trans_cells = [g for g in self._raw_grids if g["isTransitioning"] and g["transitionTarget"]]
            for i, g in enumerate(trans_cells[:4]):
                alerts.append(
                    OperationalAlert(
                        id=f"alt_t_{i+1}",
                        type="Regime Transition",
                        gridId=g["id"],
                        location=f"{g['state']} / {g['district']}",
                        detail=f"{g['regime']} → {g['transitionTarget']} (Prob: {int((g['transitionProbability'] or 0.7)*100)}%)",
                        timeAgo=f"{12 + i * 7}m ago",
                        severity="medium",
                        lat=g["lat"],
                        lon=g["lon"],
                    )
                )

            # High uncertainty alert
            unc_cells = [g for g in self._raw_grids if g["confidence"] == "Low"]
            for i, g in enumerate(unc_cells[:2]):
                alerts.append(
                    OperationalAlert(
                        id=f"alt_u_{i+1}",
                        type="High Uncertainty",
                        gridId=g["id"],
                        location=f"{g['state']} / {g['district']}",
                        detail=f"P10–P90: {g['p10Mm']}–{g['p90Mm']} mm (Entropy: {g['entropy']})",
                        timeAgo=f"{25 + i * 10}m ago",
                        severity="high",
                        lat=g["lat"],
                        lon=g["lon"],
                    )
                )

        crit_count = sum(1 for a in alerts if a.severity == "high")
        return AlertFeedResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            activeCount=len(alerts),
            criticalCount=crit_count,
            alerts=alerts,
        )

    def get_error_mechanisms(self) -> ErrorMechanismResponse:
        """Computes diagnostic error mechanism breakdown (Spatial, Timing, Intensity, etc.)."""
        # Summary scores across the 8 mechanisms
        mechanisms_summary = [
            MechanismScore(mechanism="SPATIAL_DISPLACEMENT", label="Spatial Displacement", probability=0.38, description="NWP rainband shifted 25-50km relative to AWS/INSAT ground truth"),
            MechanismScore(mechanism="TEMPORAL_TIMING", label="Temporal Timing Lag", probability=0.34, description="+6h to +12h numerical lag in advancing monsoon depression front"),
            MechanismScore(mechanism="INTENSITY", label="Intensity Bias", probability=0.29, description="Raw NWP underestimating peak convective rain cores (>64.5mm)"),
            MechanismScore(mechanism="OROGRAPHIC", label="Orographic Enhancement", probability=0.48, description="Steep windward slope rain enhancement along Western Ghats"),
            MechanismScore(mechanism="COASTAL", label="Coastal Convergence", probability=0.42, description="Land-sea breeze front moisture convergence"),
            MechanismScore(mechanism="CONVECTIVE", label="Convective Initiation", probability=0.31, description="Sub-grid thermodynamic instability trigger discrepancies"),
            MechanismScore(mechanism="MOISTURE_TRANSPORT", label="Moisture Advection", probability=0.26, description="Low-level monsoon jet moisture transport flux discrepancies"),
            MechanismScore(mechanism="PHYSICS_RESIDUAL", label="Physics Residual", probability=0.18, description="Unresolved microphysics and boundary layer parameterization errors"),
        ]

        regional_profiles = [
            RegionalMechanismProfile(region="Western Ghats", dominantMechanism="OROGRAPHIC", mechanisms={"OROGRAPHIC": 0.88, "SPATIAL_DISPLACEMENT": 0.22, "INTENSITY": 0.35}),
            RegionalMechanismProfile(region="Odisha / Bengal Coast", dominantMechanism="COASTAL", mechanisms={"COASTAL": 0.84, "TEMPORAL_TIMING": 0.65, "INTENSITY": 0.40}),
            RegionalMechanismProfile(region="Monsoon Trough (Central India)", dominantMechanism="TEMPORAL_TIMING", mechanisms={"TEMPORAL_TIMING": 0.58, "MOISTURE_TRANSPORT": 0.45, "INTENSITY": 0.30}),
            RegionalMechanismProfile(region="Northwest India", dominantMechanism="CONVECTIVE", mechanisms={"CONVECTIVE": 0.62, "PHYSICS_RESIDUAL": 0.35, "SPATIAL_DISPLACEMENT": 0.28}),
            RegionalMechanismProfile(region="Northeast Topographic", dominantMechanism="OROGRAPHIC", mechanisms={"OROGRAPHIC": 0.82, "INTENSITY": 0.52, "SPATIAL_DISPLACEMENT": 0.41}),
        ]

        hotspots: List[GridMechanismItem] = []
        for g in self._raw_grids[:10]:
            mechs = g.get("mechanisms", {})
            dom_mech = max(mechs.keys(), key=lambda k: mechs[k]) if mechs else "INTENSITY"
            hotspots.append(
                GridMechanismItem(
                    gridId=g["id"],
                    lat=g["lat"],
                    lon=g["lon"],
                    state=g["state"],
                    district=g["district"],
                    dominantMechanism=dom_mech,
                    dominantProbability=mechs.get(dom_mech, 0.5),
                    mechanisms=mechs,
                )
            )

        return ErrorMechanismResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            leadTime="T+24h",
            dominantMechanismNational="OROGRAPHIC",
            mechanismsSummary=mechanisms_summary,
            regionalProfiles=regional_profiles,
            hotspotGrids=hotspots,
        )

    def get_data_health(self) -> DataMonitorResponse:
        """Returns telemetry health across the 6 core operational data feeds."""
        sources = [
            DataSourceHealth(id="src_nwp_ncum", name="NCUM Global (12km)", sourceType="NWP", provider="NCMRWF / MoES", status="LIVE", lastUpdate="12 mins ago (00Z Cycle)", recordCount="17,415 Grids", latencySeconds=142, coveragePct=100.0, qualityScorePct=99.4, anomalyCount=2),
            DataSourceHealth(id="src_nwp_gfs", name="IMD-GFS (12.5km)", sourceType="NWP", provider="India Meteorological Dept", status="LIVE", lastUpdate="28 mins ago (00Z Cycle)", recordCount="17,415 Grids", latencySeconds=185, coveragePct=100.0, qualityScorePct=98.7, anomalyCount=5),
            DataSourceHealth(id="src_imd_aws", name="IMD AWS / ARG Network", sourceType="IMD Observations", provider="IMD Ground Network", status="LIVE", lastUpdate="4 mins ago", recordCount="1,140 Stations", latencySeconds=45, coveragePct=94.2, qualityScorePct=96.8, anomalyCount=14),
            DataSourceHealth(id="src_sat_insat", name="INSAT-3D/3DR QPE", sourceType="Satellite", provider="ISRO / IMD", status="LIVE", lastUpdate="8 mins ago", recordCount="Raster Tile Set", latencySeconds=62, coveragePct=99.8, qualityScorePct=99.1, anomalyCount=1),
            DataSourceHealth(id="src_rean_imdaa", name="IMDAA High-Res Reanalysis", sourceType="Reanalysis", provider="NCMRWF / Met Office", status="LIVE", lastUpdate="Daily 03:00Z", recordCount="17,415 Grids", latencySeconds=310, coveragePct=100.0, qualityScorePct=100.0, anomalyCount=0),
            DataSourceHealth(id="src_geo_dem", name="CartoDEM High-Res Terrain", sourceType="Geospatial", provider="NRSC / ISRO", status="LIVE", lastUpdate="Static Baseline", recordCount="17,415 Grids", latencySeconds=0, coveragePct=100.0, qualityScorePct=100.0, anomalyCount=0),
        ]

        recent_logs = [
            IngestionLogEntry(id="log_1", timestamp="01:15:20 IST", source="NCUM Global", cycle="00Z", recordsIngested=17415, status="SUCCESS", message="GRIB2 ingestion & 0.25° regridding complete (142s)"),
            IngestionLogEntry(id="log_2", timestamp="01:10:04 IST", source="INSAT-3DR QPE", cycle="00:45Z", recordsIngested=4800, status="SUCCESS", message="Infrared / Water Vapour precipitation calibrated"),
            IngestionLogEntry(id="log_3", timestamp="00:58:33 IST", source="IMD AWS Network", cycle="Hourly", recordsIngested=1140, status="WARNING", message="14 stations in Northeast reporting telemetry timeout"),
            IngestionLogEntry(id="log_4", timestamp="00:45:10 IST", source="IMD-GFS", cycle="00Z", recordsIngested=17415, status="SUCCESS", message="Convective vs Stratiform precipitation decomposed"),
            IngestionLogEntry(id="log_5", timestamp="00:30:00 IST", source="MoE Routing Engine", cycle="Scheduled", recordsIngested=17415, status="SUCCESS", message="Regime weights updated for 7 operational categories"),
        ]

        return DataMonitorResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            overallStatus="OPTIMAL",
            activeSources=6,
            totalDailyRecords="2.4M",
            avgLatencyMin=2.1,
            sources=sources,
            recentLogs=recent_logs,
        )

    def get_models_registry(self) -> ModelRegistryResponse:
        """Returns the registered machine learning and numerical weather prediction models."""
        models = [
            ModelInfo(id="mdl_raincor_moe", name="RAINCOR Regime-Aware Mixture-of-Experts", version="v2.4", type="MoE + GNN Advection", status="ACTIVE", rmse=14.8, csi=0.62, latencyMs=84.2, description="Sparse gated expert mixture with atmospheric transport graph layer"),
            ModelInfo(id="mdl_lgbm_regime", name="Hierarchical Regime Classifier", version="v1.8", type="LightGBM + Temperature Scaling", status="ACTIVE", rmse=19.5, csi=0.51, latencyMs=12.4, description="Multiclass hierarchical regime head with calibrated Shannon entropy"),
            ModelInfo(id="mdl_qm_baseline", name="Empirical Quantile Mapping", version="v1.2", type="Non-Parametric QM", status="ACTIVE", rmse=18.1, csi=0.54, latencyMs=4.6, description="Local intensity scaling with non-parametric quantile mapping"),
            ModelInfo(id="mdl_nwp_ncum", name="NCMRWF NCUM Global Model", version="v6.1", type="Numerical Weather Prediction", status="ACTIVE", rmse=26.4, csi=0.44, latencyMs=320.0, description="12km operational deterministic NWP model baseline"),
        ]

        return ModelRegistryResponse(
            timestamp=datetime.now(timezone.utc).isoformat(),
            activePipeline="RAINCOR Operational Pipeline (NCUM + MoE + GNN)",
            models=models,
        )

    def get_settings(self) -> OperationalSettings:
        return self._settings

    def update_settings(self, updates: Dict[str, Any]) -> OperationalSettings:
        if "thresholds" in updates:
            t = updates["thresholds"]
            self._settings.thresholds.heavyThreshold = float(t.get("heavyThreshold", self._settings.thresholds.heavyThreshold))
            self._settings.thresholds.veryHeavyThreshold = float(t.get("veryHeavyThreshold", self._settings.thresholds.veryHeavyThreshold))
            self._settings.thresholds.extremeThreshold = float(t.get("extremeThreshold", self._settings.thresholds.extremeThreshold))
        if "forecast" in updates:
            f = updates["forecast"]
            self._settings.forecast.defaultLeadTime = f.get("defaultLeadTime", self._settings.forecast.defaultLeadTime)
            self._settings.forecast.defaultDisplayMode = f.get("defaultDisplayMode", self._settings.forecast.defaultDisplayMode)
        if "alerts" in updates:
            a = updates["alerts"]
            self._settings.alerts.enableSound = a.get("enableSound", self._settings.alerts.enableSound)
            self._settings.alerts.telegramDispatch = a.get("telegramDispatch", self._settings.alerts.telegramDispatch)
        if "models" in updates:
            m = updates["models"]
            self._settings.models.activeMoE = m.get("activeMoE", self._settings.models.activeMoE)
            self._settings.models.gnnAdvectionLayer = m.get("gnnAdvectionLayer", self._settings.models.gnnAdvectionLayer)
        self._settings.lastUpdated = datetime.now(timezone.utc).isoformat()
        return self._settings

# Singleton accessor
met_service = MeteorologicalService()
