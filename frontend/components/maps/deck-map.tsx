"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { FlyToInterpolator } from "@deck.gl/core";
import { Play, Pause, Clock, Satellite, Map as MapIcon } from "lucide-react";

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

// Static RGB Tuples for Instant O(1) Color Lookups without String Parsing
const REGIME_COLORS_RGB: Record<string, [number, number, number, number]> = {
  "Active Monsoon": [34, 197, 94, 190],
  "Break Monsoon": [234, 179, 8, 190],
  "Monsoon Low / Depression": [59, 130, 246, 190],
  "Western Disturbance": [168, 85, 247, 190],
  "Orographic": [20, 184, 166, 190],
  "Coastal": [6, 182, 212, 190],
  "Post-Monsoon / Northeast": [249, 115, 22, 190],
};
const DEFAULT_REGIME_RGB: [number, number, number, number] = [100, 116, 139, 180];

// High-fidelity IMD Doppler Radar Precipitation Palette
const DOPPLER_HEATMAP_COLORS: [number, number, number][] = [
  [56, 189, 248],   // Light Sky Blue (<5 mm)
  [34, 197, 94],    // Green (5-15 mm)
  [234, 179, 8],    // Yellow (15-35 mm)
  [249, 115, 22],   // Orange (35-65 mm)
  [239, 68, 68],    // Red (65-115 mm)
  [168, 85, 247],   // Purple (>115 mm)
];

// District Alert Colors
const ALERT_COLORS_RGB: Record<string, [number, number, number, number]> = {
  Red: [239, 68, 68, 220],
  Orange: [249, 115, 22, 220],
  Yellow: [234, 179, 8, 210],
  Green: [34, 197, 94, 190],
};

// Map Basemap Styles
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

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Initial View State focusing on India
const INITIAL_VIEW_STATE = {
  longitude: 80.0,
  latitude: 22.5,
  zoom: 4.25,
  pitch: 0,
  bearing: 0,
  minZoom: 3,
  maxZoom: 12,
};

export const DeckMap: React.FC = () => {
  const { selectedGridId, selectGrid, selectedLayer, viewMode } = useMapStore();
  const { displayMode } = useForecastStore();
  const { selectedRegion } = useFilterStore();
  const grids = useMemo(() => getIndiaGrids(), []);

  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictForecast[]>([]);
  const [baseMap, setBaseMap] = useState<"satellite" | "dark">("satellite");
  const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);

  // Time-Series Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [leadTime, setLeadTime] = useState(0);

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

  // Animation interval with smooth lead-time progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setLeadTime((prev) => (prev >= 72 ? 0 : prev + 3));
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulate data shifting over lead time
  const animatedGrids = useMemo(() => {
    if (leadTime === 0) return grids;
    const phase = leadTime / 12;
    return grids.map((g) => ({
      ...g,
      correctedRainfallMm: Math.max(
        0,
        g.correctedRainfallMm *
          (1 + 0.4 * Math.sin(phase + g.lat * 0.3 + g.lon * 0.2))
      ),
      nwpRainfallMm: Math.max(
        0,
        g.nwpRainfallMm *
          (1 + 0.35 * Math.sin(phase + g.lat * 0.25 + g.lon * 0.15))
      ),
    }));
  }, [grids, leadTime]);

  // Pre-generate base 0.25° grid GeoJSON geometry ONCE
  // This completely eliminates allocating 10,000+ objects on every hover/render frame
  const baseGridFeatures = useMemo(() => {
    return grids.map((g) => ({
      type: "Feature" as const,
      id: g.id,
      properties: g,
      geometry: {
        type: "Polygon" as const,
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
    }));
  }, [grids]);

  const baseGridGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: baseGridFeatures,
    }),
    [baseGridFeatures]
  );

  // Time-stepped GeoJSON: reuses static polygon coordinate arrays to prevent GC pauses
  const animatedGridGeoJson = useMemo(() => {
    if (leadTime === 0) return baseGridGeoJson;
    return {
      type: "FeatureCollection" as const,
      features: animatedGrids.map((g, idx) => ({
        type: "Feature" as const,
        id: g.id,
        properties: g,
        geometry: baseGridFeatures[idx].geometry,
      })),
    };
  }, [leadTime, animatedGrids, baseGridGeoJson, baseGridFeatures]);

  // Selected cell feature for glowing highlight outline
  const selectedGridFeature = useMemo(() => {
    if (!selectedGridId) return null;
    const cell = grids.find((g) => g.id === selectedGridId);
    if (!cell) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: cell.id,
          properties: cell,
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [cell.lon - 0.125, cell.lat - 0.125],
                [cell.lon + 0.125, cell.lat - 0.125],
                [cell.lon + 0.125, cell.lat + 0.125],
                [cell.lon - 0.125, cell.lat + 0.125],
                [cell.lon - 0.125, cell.lat - 0.125],
              ],
            ],
          },
        },
      ],
    };
  }, [selectedGridId, grids]);

  // Get rainfall value based on display mode
  const getRainfall = useCallback(
    (g: GridCell) => {
      if (displayMode === "nwp") return g.nwpRainfallMm;
      if (displayMode === "bias_corrected") return g.correctedRainfallMm;
      return Math.abs(g.anomalyMm);
    },
    [displayMode]
  );

  // Hover and Click callbacks
  const handleGridHover = useCallback((info: any) => {
    setHoverInfo(info?.object ? info : null);
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

  // Memoized DeckGL Layers: Decoupled from hoverInfo to maintain liquid 60+ FPS
  const layers = useMemo(() => {
    const isRainfall = selectedLayer === "rainfall";

    return [
      // Layer 1: Smooth IMD Radar-style Heatmap Overlay
      new HeatmapLayer<GridCell>({
        id: "rainfall-heatmap",
        data: animatedGrids,
        getPosition: (d) => [d.lon, d.lat],
        getWeight: (d) => getRainfall(d),
        radiusPixels: 48,
        intensity: 1.25,
        threshold: 0.035,
        colorDomain: [0, 140],
        debounceTimeout: 20,
        aggregation: "SUM",
        colorRange: DOPPLER_HEATMAP_COLORS,
        visible: isRainfall && viewMode === "grid",
        updateTriggers: {
          getWeight: [displayMode, leadTime],
        },
      }),

      // Layer 2: Regime / Transition / Uncertainty Choropleth (Grid mode)
      ...(!isRainfall && viewMode === "grid"
        ? [
            new GeoJsonLayer({
              id: "grid-choropleth",
              data: animatedGridGeoJson,
              pickable: true,
              stroked: false,
              filled: true,
              getFillColor: (f: any) => {
                const g = f.properties as GridCell;
                if (selectedLayer === "regime") {
                  return REGIME_COLORS_RGB[g.regime] || DEFAULT_REGIME_RGB;
                }
                if (selectedLayer === "transition") {
                  const p = g.transitionProbability || 0;
                  if (!g.isTransitioning) return [100, 100, 120, 35];
                  return [120 + p * 80, 50, 200, Math.round(90 + p * 165)];
                }
                // Uncertainty spread: P90 - P10
                const spread = g.p90Mm - g.p10Mm;
                if (spread < 20) return [200, 230, 250, 110];
                if (spread < 50) return [100, 180, 240, 160];
                if (spread < 90) return [20, 100, 200, 200];
                return [50, 20, 130, 230];
              },
              onClick: handleGridClick,
              onHover: handleGridHover,
              updateTriggers: {
                getFillColor: [selectedLayer, displayMode, leadTime],
              },
            }),
          ]
        : []),

      // Layer 3: India State Boundaries (Crisp vector overlays)
      ...(statesGeoJson
        ? [
            new GeoJsonLayer({
              id: "india-state-boundaries",
              data: statesGeoJson,
              pickable: false,
              stroked: true,
              filled: false,
              lineWidthMinPixels: 1.5,
              getLineColor: [255, 255, 255, 150],
              getLineWidth: 1200,
            }),
          ]
        : []),

      // Layer 4: District Alert Pins (District mode)
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

      // Layer 5: Invisible High-Performance Click Target for Heatmap Mode
      ...(isRainfall && viewMode === "grid"
        ? [
            new GeoJsonLayer({
              id: "grid-click-target",
              data: baseGridGeoJson,
              pickable: true,
              stroked: false,
              filled: true,
              getFillColor: [0, 0, 0, 0],
              onClick: handleGridClick,
              onHover: handleGridHover,
            }),
          ]
        : []),

      // Layer 6: Selected Grid Cell Highlight (Glowing cyan indicator)
      ...(selectedGridFeature && viewMode === "grid"
        ? [
            new GeoJsonLayer({
              id: "selected-grid-highlight",
              data: selectedGridFeature,
              pickable: false,
              stroked: true,
              filled: true,
              getFillColor: [6, 182, 212, 50],
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
    animatedGrids,
    animatedGridGeoJson,
    baseGridGeoJson,
    statesGeoJson,
    districts,
    selectedGridFeature,
    getRainfall,
    handleGridClick,
    handleGridHover,
    handleDistrictClick,
  ]);

  const mapStyle = baseMap === "satellite" ? SATELLITE_STYLE : DARK_STYLE;
  const hoveredGrid = hoverInfo?.object?.properties as GridCell | undefined;
  const hoveredDistrict = hoverInfo?.object?.name
    ? (hoverInfo.object as DistrictForecast)
    : undefined;

  return (
    <div className="relative flex flex-col w-full h-[620px] rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl overflow-hidden select-none">
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
            scrollZoom: { smooth: true, speed: 0.008 },
            inertia: 350,
          }}
          useDevicePixels={true}
          pickingRadius={6}
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

      {/* Smooth Hover Tooltip (Decoupled from Layer Evaluation) */}
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

      {/* Base Map Toggle */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setBaseMap("satellite")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg ${
            baseMap === "satellite"
              ? "bg-cyan-500/90 text-white"
              : "bg-black/60 text-slate-300 hover:bg-black/80 backdrop-blur-md"
          }`}
        >
          <Satellite size={14} /> Satellite
        </button>
        <button
          onClick={() => setBaseMap("dark")}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg ${
            baseMap === "dark"
              ? "bg-cyan-500/90 text-white"
              : "bg-black/60 text-slate-300 hover:bg-black/80 backdrop-blur-md"
          }`}
        >
          <MapIcon size={14} /> Dark
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

      {/* Domain Info Badge */}
      <div className="absolute right-4 bottom-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg text-xs font-semibold text-slate-200">
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
  );
};

export default DeckMap;
