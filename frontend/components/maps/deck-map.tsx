"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "@deck.gl/core";
import { Play, Pause, Clock, Satellite, Plus, Minus, Maximize } from "lucide-react";

import { useMapStore } from "@/store/map-store";
import { useForecastStore } from "@/store/forecast-store";
import { useFilterStore } from "@/store/filter-store";
import { getIndiaGrids } from "@/lib/grid-generator";
import { GridCell } from "@/types/grid";
import { DistrictForecast, DistrictResponse } from "@/types/district";
import { formatRainfall, formatLatLon } from "@/lib/formatting";
import { REGION_CENTERS } from "@/lib/india-geo";
import { INDIA_STATES_GEOJSON_URL } from "@/lib/geo-sources";
import { api } from "@/services/api/client";
import { fetchDistrictForecasts } from "@/services/mock/district-service";
import { MapLegend } from "./map-legend";
import { MapToolbar } from "./map-toolbar";

// ─── IMD Precipitation Color Scale (RGBA) ──────────────────────────────────
// Matches the PRECIPITATION_SCALE in constants.ts exactly
// Each cell gets colored independently based on its rainfall value
function getRainfallRGBA(mm: number): [number, number, number, number] {
  if (mm < 1)   return [232, 238, 245, 25];   // Near-transparent
  if (mm < 5)   return [208, 232, 250, 140];   // Very light blue
  if (mm < 10)  return [163, 210, 247, 165];   // Light blue
  if (mm < 25)  return [93, 170, 232, 185];    // Moderate blue
  if (mm < 50)  return [47, 128, 217, 200];    // Medium blue
  if (mm < 100) return [29, 100, 181, 215];    // Deep blue
  if (mm < 200) return [242, 169, 59, 225];    // Amber/Orange (IMD Heavy)
  if (mm < 300) return [224, 82, 82, 235];     // Red (IMD Very Heavy)
  return              [139, 30, 143, 245];     // Purple (Extreme)
}

// ─── Regime Fill Colors (RGBA) ──────────────────────────────────────────────
const REGIME_COLORS_RGB: Record<string, [number, number, number, number]> = {
  "Active Monsoon": [47, 128, 217, 160],
  "Break Monsoon": [160, 178, 198, 130],
  "Monsoon Low / Depression": [117, 102, 216, 170],
  "Western Disturbance": [242, 169, 59, 155],
  "Orographic": [34, 160, 107, 165],
  "Coastal": [2, 132, 199, 155],
  "Post-Monsoon / Northeast": [249, 115, 22, 145],
  "Others": [100, 116, 139, 120],
};
const DEFAULT_REGIME_RGB: [number, number, number, number] = [100, 116, 139, 100];

// ─── District Alert Colors ──────────────────────────────────────────────────
const ALERT_COLORS_RGB: Record<string, [number, number, number, number]> = {
  Red: [239, 68, 68, 220],
  Orange: [249, 115, 22, 220],
  Yellow: [234, 179, 8, 210],
  Green: [34, 197, 94, 190],
};

// ─── Map Basemap Styles ─────────────────────────────────────────────────────
const SATELLITE_STYLE = {
  version: 8 as const,
  name: "RainMind Satellite",
  sources: {
    "esri-satellite": {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
    },
    "carto-labels": {
      type: "raster" as const,
      tiles: [
        "https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "satellite-base",
      type: "raster" as const,
      source: "esri-satellite",
      paint: {
        "raster-brightness-max": 0.62,
        "raster-contrast": 0.15,
        "raster-saturation": -0.25,
      },
    },
    {
      id: "labels-overlay",
      type: "raster" as const,
      source: "carto-labels",
      paint: { "raster-opacity": 0.9 },
    },
  ],
};


// ─── Initial View State ─────────────────────────────────────────────────────
const INITIAL_VIEW_STATE = {
  longitude: 80.0,
  latitude: 22.5,
  zoom: 4.25,
  pitch: 0,
  bearing: 0,
  minZoom: 3,
  maxZoom: 12,
};

// ─── Grid cell half-width for 0.25° resolution ─────────────────────────────
const HALF_STEP = 0.125;

// ─── Deterministic Weather Advection Model ──────────────────────────────────
// Simulates spatially coherent monsoon movement (SW→NE general flow)
// with cyclonic perturbation for depressions
function getAdvectedRainfall(
  g: GridCell,
  leadTimeHours: number,
  displayMode: string
): number {
  const baseValue = displayMode === "nwp"
    ? g.nwpRainfallMm
    : displayMode === "bias_corrected"
    ? g.correctedRainfallMm
    : Math.abs(g.anomalyMm);

  if (leadTimeHours === 0) return baseValue;

  // Deterministic phase based on position + time
  const tNorm = leadTimeHours / 72;

  // Southwest monsoon general advection direction
  const advectLon = -0.008 * leadTimeHours; // Westward drift (degrees/hour)
  const advectLat = 0.004 * leadTimeHours;  // Slight northward push

  // Effective source position (where rain came from)
  const srcLon = g.lon - advectLon;
  const srcLat = g.lat - advectLat;

  // Spatial modulation (large-scale storm system evolution)
  const stormPhase = Math.sin(srcLat * 0.35 + srcLon * 0.25 + tNorm * Math.PI * 2);
  const stormIntensity = Math.cos(srcLat * 0.18 - srcLon * 0.12 + tNorm * Math.PI * 1.5);

  // Depression deepening/weakening cycle
  const depressionCycle = Math.sin(tNorm * Math.PI * 3) * 0.3;

  // Combine: base rainfall + storm modulation + depression cycle
  const modulation = 1.0
    + 0.35 * stormPhase * (1 - tNorm * 0.5) // storms weaken at longer lead times
    + 0.2 * stormIntensity
    + depressionCycle * (g.regime === "Monsoon Low / Depression" ? 1.5 : 0.3);

  // Add forecast uncertainty growth
  const uncertaintyGrowth = 1.0 + tNorm * 0.15;

  return Math.max(0, baseValue * modulation * uncertaintyGrowth);
}

// ─── Transition probability evolution ───────────────────────────────────────
function getAdvectedTransition(g: GridCell, leadTimeHours: number): number {
  const base = g.transitionProbability || 0;
  if (leadTimeHours === 0) return base;
  const tNorm = leadTimeHours / 72;
  const evolution = Math.sin(g.lat * 0.4 + g.lon * 0.3 + tNorm * Math.PI * 2);
  return Math.min(1, Math.max(0, base + evolution * 0.25 * tNorm));
}

// ─── Uncertainty evolution ──────────────────────────────────────────────────
function getAdvectedUncertainty(g: GridCell, leadTimeHours: number): number {
  const spread = g.p90Mm - g.p10Mm;
  if (leadTimeHours === 0) return spread;
  const tNorm = leadTimeHours / 72;
  // Uncertainty grows with forecast lead time
  return spread * (1 + tNorm * 0.8);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const DeckMap: React.FC = () => {
  const { selectedGridId, selectGrid, selectedLayer, viewMode } = useMapStore();
  const { displayMode } = useForecastStore();
  const { selectedRegion } = useFilterStore();
  const grids = useMemo(() => getIndiaGrids(), []);

  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictForecast[]>([]);
  const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);

  // Time-Series Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [leadTime, setLeadTime] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Fetch India state boundaries once
  useEffect(() => {
    let isMounted = true;
    fetch(INDIA_STATES_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setStatesGeoJson(data);
      })
      .catch((err) => console.warn("Failed to load India state boundaries:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch District summaries for district-level view mode
  useEffect(() => {
    let isMounted = true;
    api
      .getDistrictForecasts()
      .then((res: DistrictResponse) => {
        if (isMounted && res.districts) setDistricts(res.districts);
      })
      .catch(() => {
        fetchDistrictForecasts().then((res: DistrictResponse) => {
          if (isMounted && res.districts) setDistricts(res.districts);
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Smooth camera fly-to on region change
  useEffect(() => {
    const center = REGION_CENTERS[selectedRegion];
    if (center && selectedRegion !== "All India") {
      setViewState((prev: any) => ({
        ...prev,
        longitude: center.center[0],
        latitude: center.center[1],
        zoom: center.zoom || 5.5,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
      }));
    } else if (selectedRegion === "All India") {
      setViewState((prev: any) => ({
        ...prev,
        longitude: INITIAL_VIEW_STATE.longitude,
        latitude: INITIAL_VIEW_STATE.latitude,
        zoom: INITIAL_VIEW_STATE.zoom,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
      }));
    }
  }, [selectedRegion]);

  const onViewStateChange = useCallback(({ viewState: nextViewState }: any) => {
    setViewState(nextViewState);
  }, []);

  // Animation using requestAnimationFrame for smoother playback
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      if (timestamp - lastTickRef.current > 750) {
        lastTickRef.current = timestamp;
        setLeadTime((prev) => (prev >= 72 ? 0 : prev + 3));
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // ─── Pre-compute Static Grid Polygon Geometry ONCE ──────────────────────
  // Each grid cell is a 0.25° × 0.25° polygon
  // Coordinates are reused across all visualization modes and time steps
  const baseGridFeatures = useMemo(() => {
    return grids.map((g) => ({
      type: "Feature" as const,
      id: g.id,
      properties: g,
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [g.lon - HALF_STEP, g.lat - HALF_STEP],
            [g.lon + HALF_STEP, g.lat - HALF_STEP],
            [g.lon + HALF_STEP, g.lat + HALF_STEP],
            [g.lon - HALF_STEP, g.lat + HALF_STEP],
            [g.lon - HALF_STEP, g.lat - HALF_STEP],
          ],
        ],
      },
    }));
  }, [grids]);

  const baseGridGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: baseGridFeatures,
    }),
    [baseGridFeatures]
  );

  // ─── Time-stepped GeoJSON ─────────────────────────────────────────────
  // Only updates properties (rainfall values) while reusing static geometry
  const animatedGridGeoJson = useMemo(() => {
    if (leadTime === 0) return baseGridGeoJson;
    return {
      type: "FeatureCollection" as const,
      features: grids.map((g, idx) => {
        const advectedRainfall = getAdvectedRainfall(g, leadTime, displayMode);
        const advectedNwp = getAdvectedRainfall(
          { ...g, correctedRainfallMm: g.nwpRainfallMm } as GridCell,
          leadTime,
          "bias_corrected"
        );
        return {
          type: "Feature" as const,
          id: g.id,
          properties: {
            ...g,
            correctedRainfallMm: advectedRainfall,
            nwpRainfallMm: advectedNwp,
            anomalyMm: advectedRainfall - advectedNwp,
            transitionProbability: getAdvectedTransition(g, leadTime),
            p90Mm: g.p10Mm + getAdvectedUncertainty(g, leadTime),
          },
          geometry: baseGridFeatures[idx].geometry,
        };
      }),
    };
  }, [leadTime, grids, displayMode, baseGridGeoJson, baseGridFeatures]);

  // ─── Selected cell feature for highlight ──────────────────────────────
  const selectedGridFeature = useMemo(() => {
    if (!selectedGridId) return null;
    const idx = grids.findIndex((g) => g.id === selectedGridId);
    if (idx === -1) return null;
    return {
      type: "FeatureCollection" as const,
      features: [baseGridFeatures[idx]],
    };
  }, [selectedGridId, grids, baseGridFeatures]);

  // ─── Hovered cell feature for subtle highlight ────────────────────────
  const hoveredGridFeature = useMemo(() => {
    if (!hoveredCellId) return null;
    const idx = grids.findIndex((g) => g.id === hoveredCellId);
    if (idx === -1) return null;
    return {
      type: "FeatureCollection" as const,
      features: [baseGridFeatures[idx]],
    };
  }, [hoveredCellId, grids, baseGridFeatures]);

  // ─── Get rainfall value based on display mode ─────────────────────────
  const getRainfall = useCallback(
    (g: GridCell) => {
      if (displayMode === "nwp") return g.nwpRainfallMm;
      if (displayMode === "bias_corrected") return g.correctedRainfallMm;
      return Math.abs(g.anomalyMm);
    },
    [displayMode]
  );

  // ─── Color accessor for the unified grid cell fill ────────────────────
  // This is the KEY function: each cell gets its own color based on
  // selectedLayer + rainfall/regime/transition/uncertainty value
  const getCellFillColor = useCallback(
    (f: any): [number, number, number, number] => {
      const g = f.properties as GridCell;

      switch (selectedLayer) {
        case "rainfall": {
          const mm = getRainfall(g);
          return getRainfallRGBA(mm);
        }
        case "regime": {
          return REGIME_COLORS_RGB[g.regime] || DEFAULT_REGIME_RGB;
        }
        case "transition": {
          const p = g.transitionProbability || 0;
          if (!g.isTransitioning && p < 0.1) return [60, 65, 80, 30];
          // Gradient: slate → amber → purple based on probability
          const r = Math.round(80 + p * 120);
          const gv = Math.round(60 + (1 - p) * 40);
          const b = Math.round(120 + p * 100);
          const a = Math.round(50 + p * 180);
          return [r, gv, b, a];
        }
        case "uncertainty": {
          const spread = g.p90Mm - g.p10Mm;
          if (spread < 15)  return [180, 210, 240, 60];   // Low
          if (spread < 35)  return [120, 180, 230, 100];   // Moderate-Low
          if (spread < 60)  return [60, 140, 210, 145];    // Moderate
          if (spread < 90)  return [30, 100, 190, 180];    // High
          return [40, 30, 140, 210];                       // Very High
        }
        default:
          return [0, 0, 0, 0];
      }
    },
    [selectedLayer, getRainfall]
  );

  // ─── Hover and Click callbacks ────────────────────────────────────────
  const handleGridHover = useCallback((info: any) => {
    if (info?.object?.properties?.id) {
      setHoveredCellId(info.object.properties.id);
      setHoverInfo(info);
    } else {
      setHoveredCellId(null);
      setHoverInfo(null);
    }
  }, []);

  const handleGridClick = useCallback(
    (info: any) => {
      if (info.object?.properties?.id) {
        selectGrid(info.object.properties.id);
      }
    },
    [selectGrid]
  );

  const handleDistrictClick = useCallback(
    (info: any) => {
      if (info.object?.name) {
        const match = grids.find(
          (g) => g.district.toLowerCase() === info.object.name.toLowerCase()
        );
        if (match) selectGrid(match.id);
      }
    },
    [grids, selectGrid]
  );

  // ─── DeckGL Layers ────────────────────────────────────────────────────
  // LAYER ORDER (bottom to top):
  // 1. Cell fills (precipitation/regime/transition/uncertainty data)
  // 2. India state boundaries
  // 3. Grid cell boundaries (ABOVE data, ABOVE boundaries)
  // 4. District markers (district mode)
  // 5. Hovered cell highlight
  // 6. Selected cell highlight
  const layers = useMemo(() => {
    const currentGeoJson = leadTime === 0 ? baseGridGeoJson : animatedGridGeoJson;
    const isGridMode = viewMode === "grid";

    return [
      // ── Layer 1: Grid Cell Fills ──────────────────────────────────────
      // Each cell independently colored by rainfall/regime/transition/uncertainty
      // This is the PRIMARY visualization — NOT a heatmap, NOT a blob
      ...(isGridMode
        ? [
            new GeoJsonLayer({
              id: "grid-cell-fills",
              data: currentGeoJson,
              pickable: true,
              stroked: false,   // Boundaries are a separate layer
              filled: true,
              getFillColor: getCellFillColor as any,
              onClick: handleGridClick,
              onHover: handleGridHover,
              updateTriggers: {
                getFillColor: [selectedLayer, displayMode, leadTime],
              },
            }),
          ]
        : []),

      // ── Layer 2: India State Boundaries ───────────────────────────────
      // Crisp vector state outlines, always visible above cell fills
      ...(statesGeoJson
        ? [
            new GeoJsonLayer({
              id: "india-state-boundaries",
              data: statesGeoJson,
              pickable: false,
              stroked: true,
              filled: false,
              lineWidthMinPixels: 1.5,
              getLineColor: [255, 255, 255, 140],
              getLineWidth: 1200,
            }),
          ]
        : []),

      // ── Layer 3: Grid Cell Boundaries ─────────────────────────────────
      // Thin, subtle, professional meteorological grid lines
      // ALWAYS rendered ABOVE the precipitation/data fill
      // This ensures grid structure is NEVER hidden by rainfall intensity
      ...(isGridMode
        ? [
            new GeoJsonLayer({
              id: "grid-cell-boundaries",
              data: baseGridGeoJson,
              pickable: false,
              stroked: true,
              filled: false,
              lineWidthMinPixels: 0.5,
              getLineColor: [200, 220, 255, 45],
              getLineWidth: 80,
            }),
          ]
        : []),

      // ── Layer 4: District Alert Pins (District mode) ──────────────────
      ...(viewMode === "district" && districts.length > 0
        ? [
            new ScatterplotLayer<DistrictForecast>({
              id: "district-alert-markers",
              data: districts,
              getPosition: (d) => [d.lon, d.lat],
              getRadius: (d) => Math.max(12000, Math.min(42000, d.rainfallMm * 450)),
              getFillColor: (d) =>
                ALERT_COLORS_RGB[d.alertLevel] || ALERT_COLORS_RGB.Green,
              getLineColor: [255, 255, 255, 240],
              lineWidthMinPixels: 2,
              stroked: true,
              filled: true,
              pickable: true,
              radiusScale: 1,
              radiusMinPixels: 7,
              radiusMaxPixels: 35,
              onClick: handleDistrictClick,
              onHover: handleGridHover,
              updateTriggers: {
                getFillColor: [districts],
                getRadius: [districts],
              },
            }),
          ]
        : []),

      // ── Layer 5: Hovered Cell Highlight ───────────────────────────────
      // Subtle luminous border on ONLY the hovered cell
      ...(hoveredGridFeature && isGridMode
        ? [
            new GeoJsonLayer({
              id: "hovered-cell-highlight",
              data: hoveredGridFeature,
              pickable: false,
              stroked: true,
              filled: true,
              getFillColor: [120, 200, 255, 25],
              getLineColor: [140, 220, 255, 180],
              lineWidthMinPixels: 2,
              getLineWidth: 1500,
            }),
          ]
        : []),

      // ── Layer 6: Selected Cell Highlight ──────────────────────────────
      // Glowing cyan indicator for the actively selected grid cell
      ...(selectedGridFeature && isGridMode
        ? [
            new GeoJsonLayer({
              id: "selected-grid-highlight",
              data: selectedGridFeature,
              pickable: false,
              stroked: true,
              filled: true,
              getFillColor: [6, 182, 212, 45],
              getLineColor: [34, 211, 238, 255],
              lineWidthMinPixels: 3,
              getLineWidth: 2200,
            }),
          ]
        : []),
    ];
  }, [
    selectedLayer,
    viewMode,
    displayMode,
    leadTime,
    baseGridGeoJson,
    animatedGridGeoJson,
    statesGeoJson,
    districts,
    hoveredGridFeature,
    selectedGridFeature,
    getCellFillColor,
    handleGridClick,
    handleGridHover,
    handleDistrictClick,
  ]);

  const mapStyle = SATELLITE_STYLE;
  const hoveredGrid = hoverInfo?.object?.properties as GridCell | undefined;
  const hoveredDistrict = hoverInfo?.object?.name
    ? (hoverInfo.object as DistrictForecast)
    : undefined;

  // ─── Forecast time label ──────────────────────────────────────────────
  const forecastLabel = useMemo(() => {
    if (leadTime === 0) return "Analysis (T+0)";
    return `Forecast T+${leadTime}h`;
  }, [leadTime]);

  return (
    <div 
      className="relative flex flex-col w-full h-[620px] rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl overflow-hidden select-none"
      onMouseLeave={() => {
        setHoverInfo(null);
        setHoveredCellId(null);
      }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-auto">
        <MapToolbar />
      </div>

      {/* DeckGL & MapLibre Hardware-Accelerated Canvas */}
      <div className="absolute inset-0 z-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          controller={{
            doubleClickZoom: true,
            dragPan: true,
            scrollZoom: { smooth: true, speed: 0.02 },
            inertia: 200,
          }}
          useDevicePixels={false}
          pickingRadius={4}
          layers={layers}
          getTooltip={() => null}
        >
          <Map
            reuseMaps
            mapStyle={mapStyle as any}
            attributionControl={false}
            renderWorldCopies={false}
          />
        </DeckGL>
      </div>

      {/* ─── Grid Cell Hover Tooltip ─────────────────────────────────── */}
      {(hoveredGrid || hoveredDistrict) && (
        <div
          className="absolute z-30 pointer-events-none p-3.5 bg-[#0B1929]/95 text-white rounded-xl shadow-2xl backdrop-blur-md text-xs border border-cyan-400/25 -translate-x-1/2 -translate-y-full min-w-[210px] transition-transform duration-75"
          style={{ left: hoverInfo.x, top: hoverInfo.y - 12 }}
        >
          {hoveredGrid && (
            <>
              <div className="flex items-center justify-between gap-4 font-semibold border-b border-white/10 pb-1.5 mb-1.5">
                <span className="text-cyan-300 font-mono tracking-wide">
                  {hoveredGrid.id}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatLatLon(hoveredGrid.lat, hoveredGrid.lon)}
                </span>
              </div>
              <div className="text-slate-300 font-medium">
                {hoveredGrid.district}, {hoveredGrid.state}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-slate-400">Regime</span>
                <span className="font-semibold text-emerald-400 text-right truncate">
                  {hoveredGrid.regime}
                </span>
                <span className="text-slate-400">Rainfall</span>
                <span className="font-bold text-amber-300 text-right">
                  {formatRainfall(hoveredGrid.correctedRainfallMm)}
                </span>
                <span className="text-slate-400">P10–P90</span>
                <span className="text-sky-300 text-right">
                  {formatRainfall(hoveredGrid.p10Mm)} – {formatRainfall(hoveredGrid.p90Mm)}
                </span>
                <span className="text-slate-400">Confidence</span>
                <span
                  className={`text-right font-semibold ${
                    hoveredGrid.confidence === "High"
                      ? "text-green-400"
                      : hoveredGrid.confidence === "Medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {hoveredGrid.confidence}
                </span>
                {leadTime > 0 && (
                  <>
                    <span className="text-slate-400">Forecast</span>
                    <span className="text-cyan-300 text-right font-mono text-[10px]">
                      {forecastLabel}
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          {hoveredDistrict && (
            <>
              <div className="flex items-center justify-between gap-3 font-semibold border-b border-white/10 pb-1.5 mb-1.5">
                <span className="text-cyan-300 font-bold text-sm">
                  {hoveredDistrict.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    hoveredDistrict.alertLevel === "Red"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : hoveredDistrict.alertLevel === "Orange"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : hoveredDistrict.alertLevel === "Yellow"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                      : "bg-green-500/20 text-green-400 border border-green-500/40"
                  }`}
                >
                  {hoveredDistrict.alertLevel} Alert
                </span>
              </div>
              <div className="text-slate-300 font-medium">
                {hoveredDistrict.state}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-slate-400">Rainfall Avg</span>
                <span className="font-bold text-amber-300 text-right">
                  {formatRainfall(hoveredDistrict.rainfallMm)}
                </span>
                <span className="text-slate-400">NWP Model</span>
                <span className="text-slate-300 text-right">
                  {formatRainfall(hoveredDistrict.nwpRainfallMm)}
                </span>
                <span className="text-slate-400">P10–P90</span>
                <span className="text-sky-300 text-right">
                  {formatRainfall(hoveredDistrict.p10Mm)} – {formatRainfall(hoveredDistrict.p90Mm)}
                </span>
                <span className="text-slate-400">Dominant</span>
                <span className="text-emerald-400 text-right truncate">
                  {hoveredDistrict.dominantRegime}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Base Map Badge */}
      <div className="absolute top-20 right-4 z-20">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-black/60 text-slate-300 backdrop-blur-md shadow-lg border border-white/10">
          <Satellite size={14} /> Satellite
        </div>
      </div>

      {/* Map Navigation Controls */}
      <div className="absolute top-[132px] right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setViewState((prev: any) => ({ ...prev, zoom: Math.min(prev.maxZoom || 12, prev.zoom + 1), transitionDuration: 300 }))}
          className="w-8 h-8 flex items-center justify-center bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-colors"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => setViewState((prev: any) => ({ ...prev, zoom: Math.max(prev.minZoom || 3, prev.zoom - 1), transitionDuration: 300 }))}
          className="w-8 h-8 flex items-center justify-center bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-colors"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => setViewState((prev: any) => ({ 
            ...prev, 
            longitude: INITIAL_VIEW_STATE.longitude, 
            latitude: INITIAL_VIEW_STATE.latitude, 
            zoom: INITIAL_VIEW_STATE.zoom, 
            transitionDuration: 1000 
          }))}
          className="w-8 h-8 flex items-center justify-center bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-colors mt-2"
          title="Reset View"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* Time-Series Animation Playback Controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 flex items-center gap-4 bg-black/75 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl border border-white/10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 flex items-center justify-center bg-cyan-500 text-white rounded-full hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30"
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <div className="flex flex-col gap-1 w-44">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock size={11} /> Lead Time
            </span>
            <span className="text-cyan-400 tabular-nums">T+{leadTime}h</span>
          </div>
          <input
            type="range"
            min="0"
            max="72"
            step="3"
            value={leadTime}
            onChange={(e) => {
              setIsPlaying(false);
              setLeadTime(Number(e.target.value));
            }}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0h</span>
            <span>24h</span>
            <span>48h</span>
            <span>72h</span>
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute left-4 bottom-4 z-20 max-w-lg pointer-events-auto">
        <MapLegend layer={selectedLayer} />
      </div>

      {/* Live Viewport Info & Domain Badge */}
      <div className="absolute right-4 bottom-4 z-20 hidden sm:flex flex-col items-end gap-2">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg text-[10px] font-mono text-slate-300">
          <span>Lat: {viewState.latitude?.toFixed(2)}°</span>
          <span>Lon: {viewState.longitude?.toFixed(2)}°</span>
          <span className="text-cyan-400 font-semibold">Z: {viewState.zoom?.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg text-xs font-semibold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>
            {viewMode === "district"
              ? `${districts.length || "700+"} Districts`
              : `${grids.length.toLocaleString()} Grids`}
          </span>
          <span className="text-slate-500 font-normal">
            {viewMode === "district" ? "| IMD Admin Level" : "| 0.25° IMD Grid"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeckMap;
