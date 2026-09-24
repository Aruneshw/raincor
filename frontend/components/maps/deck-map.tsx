"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { Play, Pause, Clock, Satellite, Map as MapIcon } from "lucide-react";

import { useMapStore } from "@/store/map-store";
import { useForecastStore } from "@/store/forecast-store";
import { useFilterStore } from "@/store/filter-store";
import { getIndiaGrids } from "@/lib/grid-generator";
import { GridCell } from "@/types/grid";
import { REGIME_COLORS } from "@/lib/constants";
import { formatRainfall, formatLatLon } from "@/lib/formatting";
import { REGION_CENTERS } from "@/lib/india-geo";
import { INDIA_STATES_GEOJSON_URL, getIMDColor, getAnomalyColor } from "@/lib/geo-sources";
import { MapLegend } from "./map-legend";
import { MapToolbar } from "./map-toolbar";

// Map styles
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
        "raster-brightness-max": 0.6,
        "raster-contrast": 0.15,
        "raster-saturation": -0.3,
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
  zoom: 4.2,
  pitch: 0,
  bearing: 0,
  minZoom: 3,
  maxZoom: 12,
};

export const DeckMap: React.FC = () => {
  const { selectedGridId, selectGrid, selectedLayer } = useMapStore();
  const { displayMode } = useForecastStore();
  const { selectedRegion } = useFilterStore();
  const grids = useMemo(() => getIndiaGrids(), []);

  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);
  const [baseMap, setBaseMap] = useState<"satellite" | "dark">("satellite");

  // Time-Series Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [leadTime, setLeadTime] = useState(0);

  // Fetch India state boundaries
  useEffect(() => {
    fetch(INDIA_STATES_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => setStatesGeoJson(data))
      .catch(console.error);
  }, []);

  // Animation interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setLeadTime((prev) => (prev >= 72 ? 0 : prev + 3));
      }, 800);
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

  // Get rainfall value based on display mode
  const getRainfall = useCallback(
    (g: GridCell) => {
      if (displayMode === "nwp") return g.nwpRainfallMm;
      if (displayMode === "bias_corrected") return g.correctedRainfallMm;
      return Math.abs(g.anomalyMm);
    },
    [displayMode]
  );

  // Compute view state dynamically based on region
  const viewState = useMemo(() => {
    const center = REGION_CENTERS[selectedRegion];
    if (center && selectedRegion !== "All India") {
      return {
        ...INITIAL_VIEW_STATE,
        longitude: center.center[0],
        latitude: center.center[1],
        zoom: center.zoom || 5.5,
        transitionDuration: 1000,
      };
    }
    return { ...INITIAL_VIEW_STATE, transitionDuration: 1000 };
  }, [selectedRegion]);

  const layers = [
    // Layer 1: Smooth Radar-style Heatmap (like Zoom Earth precipitation overlay)
    new HeatmapLayer<GridCell>({
      id: "rainfall-heatmap",
      data: animatedGrids,
      getPosition: (d) => [d.lon, d.lat],
      getWeight: (d) => getRainfall(d),
      radiusPixels: 80,
      intensity: 1.5,
      threshold: 0.03,
      colorRange: [
        [200, 230, 245],   // Very light blue
        [80, 170, 225],    // Blue
        [30, 130, 210],    // Medium blue
        [255, 200, 0],     // Yellow (Heavy)
        [255, 120, 0],     // Orange (Very Heavy)
        [220, 30, 30],     // Red (Extreme)
      ],
      visible: selectedLayer === "rainfall",
      updateTriggers: {
        getWeight: [displayMode, leadTime],
      },
    }),

    // Layer 2: Regime Choropleth Grid (colored cells for regime view)
    ...(selectedLayer !== "rainfall"
      ? [
          new GeoJsonLayer({
            id: "grid-choropleth",
            data: {
              type: "FeatureCollection" as const,
              features: animatedGrids.map((g) => ({
                type: "Feature" as const,
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
              })),
            },
            pickable: true,
            stroked: false,
            filled: true,
            getFillColor: (f: any) => {
              const g = f.properties as GridCell;
              if (selectedLayer === "regime") {
                const hex = REGIME_COLORS[g.regime] || "#64748B";
                const r = parseInt(hex.substring(1, 3), 16);
                const gr = parseInt(hex.substring(3, 5), 16);
                const b = parseInt(hex.substring(5, 7), 16);
                return [r, gr, b, 180];
              }
              if (selectedLayer === "transition") {
                const p = g.transitionProbability || 0;
                if (!g.isTransitioning) return [100, 100, 120, 40];
                // Purple gradient for transition probability
                return [120 + p * 80, 50, 200, Math.round(100 + p * 155)];
              }
              // Uncertainty
              const spread = g.p90Mm - g.p10Mm;
              if (spread < 20) return [200, 230, 250, 100];
              if (spread < 50) return [100, 180, 240, 160];
              if (spread < 90) return [20, 100, 200, 200];
              return [50, 20, 130, 230];
            },
            onClick: (info: any) => {
              if (info.object?.properties) selectGrid(info.object.properties.id);
            },
            onHover: (info: any) => setHoverInfo(info),
            updateTriggers: {
              getFillColor: [selectedLayer, displayMode, leadTime],
            },
          }),
        ]
      : []),

    // Layer 3: India State Boundaries (GeoJSON vector outlines — like IMD maps)
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
            getLineWidth: 1500,
          }),
        ]
      : []),

    // Layer 4: Invisible click-target grid for rainfall heatmap mode
    ...(selectedLayer === "rainfall"
      ? [
          new GeoJsonLayer({
            id: "grid-click-target",
            data: {
              type: "FeatureCollection" as const,
              features: animatedGrids.map((g) => ({
                type: "Feature" as const,
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
              })),
            },
            pickable: true,
            stroked: false,
            filled: true,
            getFillColor: [0, 0, 0, 0],
            onClick: (info: any) => {
              if (info.object?.properties) selectGrid(info.object.properties.id);
            },
            onHover: (info: any) => setHoverInfo(info),
          }),
        ]
      : []),
  ];

  const mapStyle = baseMap === "satellite" ? SATELLITE_STYLE : DARK_STYLE;

  return (
    <div className="relative flex flex-col w-full h-[620px] rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl overflow-hidden select-none">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-auto">
        <MapToolbar />
      </div>

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <DeckGL
          initialViewState={viewState}
          controller={true}
          layers={layers}
          getTooltip={() => null}
        >
          <Map
            mapStyle={mapStyle as any}
            attributionControl={false}
          />
        </DeckGL>
      </div>

      {/* Hover Tooltip */}
      {hoverInfo?.object?.properties && (
        <div
          className="absolute z-30 pointer-events-none p-3 bg-[#0B1929]/95 text-white rounded-xl shadow-2xl backdrop-blur-md text-xs border border-cyan-400/20 -translate-x-1/2 -translate-y-full"
          style={{ left: hoverInfo.x, top: hoverInfo.y - 12 }}
        >
          <div className="flex items-center justify-between gap-4 font-semibold border-b border-white/10 pb-1.5 mb-1.5">
            <span className="text-cyan-300">{hoverInfo.object.properties.id}</span>
            <span className="text-[10px] text-slate-400">
              {formatLatLon(hoverInfo.object.properties.lat, hoverInfo.object.properties.lon)}
            </span>
          </div>
          <div className="text-slate-300 font-medium">
            {hoverInfo.object.properties.district}, {hoverInfo.object.properties.state}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-400">Regime</span>
            <span className="font-semibold text-emerald-400 text-right">
              {hoverInfo.object.properties.regime}
            </span>
            <span className="text-slate-400">Rainfall</span>
            <span className="font-bold text-amber-300 text-right">
              {formatRainfall(hoverInfo.object.properties.correctedRainfallMm)}
            </span>
            <span className="text-slate-400">P10–P90</span>
            <span className="text-sky-300 text-right">
              {formatRainfall(hoverInfo.object.properties.p10Mm)} – {formatRainfall(hoverInfo.object.properties.p90Mm)}
            </span>
            <span className="text-slate-400">Confidence</span>
            <span
              className={`text-right font-semibold ${
                hoverInfo.object.properties.confidence === "High"
                  ? "text-green-400"
                  : hoverInfo.object.properties.confidence === "Medium"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {hoverInfo.object.properties.confidence}
            </span>
          </div>
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

      {/* Animation Playback Controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 flex items-center gap-4 bg-black/70 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl border border-white/10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 flex items-center justify-center bg-cyan-500 text-white rounded-full hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30"
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

      {/* Legend */}
      <div className="absolute left-4 bottom-4 z-20 max-w-lg pointer-events-auto">
        <MapLegend layer={selectedLayer} />
      </div>

      {/* Grid Info Badge */}
      <div className="absolute right-4 bottom-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg text-xs font-semibold text-slate-200">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span>{grids.length.toLocaleString()} Grids Live</span>
        <span className="text-slate-500 font-normal">| 0.25° IMD Domain</span>
      </div>
    </div>
  );
};

export default DeckMap;
