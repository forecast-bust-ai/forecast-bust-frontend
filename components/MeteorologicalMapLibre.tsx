'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LayerDataResponse, LayerMetadataItem, VectorFieldResponse } from '@/types/meteorology';
import { generateMeteorologicalRaster, WindParticleEngine } from '@/lib/meteorologicalRenderer';
import {
  Plus,
  Minus,
  RotateCcw,
  Map as MapIcon,
  Activity,
  Terminal,
  ChevronDown,
  Wind,
  CheckCircle2,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface MeteorologicalMapLibreProps {
  layerData: LayerDataResponse | null;
  layerMetadata: LayerMetadataItem;
  vectorData?: VectorFieldResponse | null;
  showVectors: boolean;
  opacity: number;
  selectedCoord: { lat: number; lon: number } | null;
  onSelectCoord: (coord: { lat: number; lon: number }) => void;
  region: string;
  loading?: boolean;
}

interface BasemapConfig {
  name: string;
  url: string;
  attribution: string;
}

const BASEMAP_STYLES: Record<string, BasemapConfig> = {
  'esri-dark': {
    name: 'Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Canvas Dark',
  },
  'satellite': {
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Satellite',
  },
  'topo': {
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Topo',
  },
};

const REGION_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  india: { center: [78.9629, 22.5937], zoom: 4.8 },
  north_india: { center: [77.5, 29.5], zoom: 5.8 },
  central_india: { center: [79.0, 22.0], zoom: 6.0 },
  south_india: { center: [77.0, 12.5], zoom: 6.2 },
  east_india: { center: [86.0, 22.0], zoom: 6.0 },
  northeast: { center: [93.0, 26.0], zoom: 6.2 },
  west_india: { center: [72.0, 24.0], zoom: 5.8 },
};

export const MeteorologicalMapLibre: React.FC<MeteorologicalMapLibreProps> = ({
  layerData,
  layerMetadata,
  vectorData,
  showVectors,
  opacity,
  selectedCoord,
  onSelectCoord,
  region = 'india',
  loading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particleEngineRef = useRef<WindParticleEngine | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState<string>('esri-dark');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // 1. Initialize MapLibre Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialRegion = REGION_CENTERS[region] || REGION_CENTERS.india;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'base-tiles': {
            type: 'raster',
            tiles: [BASEMAP_STYLES[activeBasemap].url],
            tileSize: 256,
            attribution: BASEMAP_STYLES[activeBasemap].attribution,
          },
        },
        layers: [
          {
            id: 'base-tiles-layer',
            type: 'raster',
            source: 'base-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialRegion.center,
      zoom: initialRegion.zoom,
      minZoom: 4.0,
      maxZoom: 12.0,
      maxBounds: [
        [64.0, 5.0],  // Southwest coordinate (Lakshadweep / Indian Ocean)
        [100.0, 38.5] // Northeast coordinate (Ladakh / Arunachal Pradesh)
      ],
      pitch: 10,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);
    });

    hoverPopupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'meteorological-map-popup',
    });

    mapRef.current = map;

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [activeBasemap, region]);

  // 2. Update Basemap Tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getSource('base-tiles')) {
      if (map.getLayer('base-tiles-layer')) map.removeLayer('base-tiles-layer');
      map.removeSource('base-tiles');

      map.addSource('base-tiles', {
        type: 'raster',
        tiles: [BASEMAP_STYLES[activeBasemap].url],
        tileSize: 256,
      });

      // Insert base-tiles-layer under met-raster-layer if met-raster-layer exists
      const beforeLayer = map.getLayer('met-raster-layer') ? 'met-raster-layer' : undefined;
      map.addLayer(
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
        beforeLayer
      );
    }
  }, [activeBasemap, mapLoaded]);

  // 3. Handle Region flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const r = REGION_CENTERS[region] || REGION_CENTERS.india;
    map.flyTo({
      center: r.center,
      zoom: r.zoom,
      speed: 1.2,
      curve: 1.4,
    });
  }, [region, mapLoaded]);

  // 4. Render Continuous Meteorological Geo-Referenced Raster Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layerData) return;

    try {
      const raster = generateMeteorologicalRaster(layerData, layerMetadata);
      if (!raster) return;

      // Remove previous raster layer and source if present
      if (map.getLayer('met-raster-layer')) {
        map.removeLayer('met-raster-layer');
      }
      if (map.getSource('met-raster-source')) {
        map.removeSource('met-raster-source');
      }

      // Add MapLibre image source with 4 precise corner coordinates
      map.addSource('met-raster-source', {
        type: 'image',
        url: raster.url,
        coordinates: raster.coordinates,
      });

      // Add raster layer above base-tiles-layer
      map.addLayer(
        {
          id: 'met-raster-layer',
          type: 'raster',
          source: 'met-raster-source',
          paint: {
            'raster-opacity': opacity,
            'raster-resampling': 'linear',
            'raster-fade-duration': 150,
          },
        },
        map.getLayer('met-grid-layer') ? 'met-grid-layer' : undefined
      );
    } catch (e) {
      console.error('Error attaching meteorological raster layer:', e);
    }
  }, [mapLoaded, layerData, layerMetadata, opacity]);

  // Update Raster Opacity when opacity slider changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('met-raster-layer')) {
      map.setPaintProperty('met-raster-layer', 'raster-opacity', opacity);
    }
  }, [opacity, mapLoaded]);

  // 5. Grid Points GeoJSON for Click/Hover Inspection
  const gridGeoJSON = useMemo(() => {
    if (!layerData || !layerData.points) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    return {
      type: 'FeatureCollection' as const,
      features: layerData.points.map((pt, idx) => ({
        type: 'Feature' as const,
        id: idx,
        geometry: {
          type: 'Point' as const,
          coordinates: [pt.longitude, pt.latitude],
        },
        properties: {
          idx,
          latitude: pt.latitude,
          longitude: pt.longitude,
          value: pt.value,
          units: layerData.units,
          title: layerData.title,
        },
      })),
    };
  }, [layerData]);

  // 6. Interactive Click/Hover Grid Overlay Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getSource('met-grid-source')) {
      (map.getSource('met-grid-source') as maplibregl.GeoJSONSource).setData(gridGeoJSON);
    } else {
      map.addSource('met-grid-source', {
        type: 'geojson',
        data: gridGeoJSON,
      });
    }

    if (!map.getLayer('met-grid-layer')) {
      map.addLayer({
        id: 'met-grid-layer',
        type: 'circle',
        source: 'met-grid-source',
        paint: {
          'circle-radius': 4,
          'circle-color': 'rgba(255, 255, 255, 0.05)',
          'circle-stroke-width': 0.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.15)',
          'circle-opacity': 0.8,
        },
      });
    }

    // Selected Coordinate Marker Layer
    if (!map.getSource('selected-coord-source')) {
      map.addSource('selected-coord-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: selectedCoord
            ? [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [selectedCoord.lon, selectedCoord.lat],
                  },
                  properties: {},
                },
              ]
            : [],
        },
      });

      map.addLayer({
        id: 'selected-coord-pulse',
        type: 'circle',
        source: 'selected-coord-source',
        paint: {
          'circle-radius': 14,
          'circle-color': 'transparent',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'selected-coord-point',
        type: 'circle',
        source: 'selected-coord-source',
        paint: {
          'circle-radius': 6,
          'circle-color': '#0284c7',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    } else {
      (map.getSource('selected-coord-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: selectedCoord
          ? [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [selectedCoord.lon, selectedCoord.lat],
                },
                properties: {},
              },
            ]
          : [],
      });
    }

    // Event Handlers for Grid Points
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'crosshair';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
      }
    };

    const handleMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const f = e.features[0];
      const p = f.properties;
      const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      const html = `
        <div style="background: #040813; color: #f8fafc; padding: 10px 12px; border-radius: 10px; border: 1px solid #1e293b; font-family: ui-sans-serif, system-ui; font-size: 11px; min-width: 190px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8);">
          <div style="font-weight: 800; color: #38bdf8; display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px; margin-bottom: 6px; font-family: monospace;">
            <span>📍 ${p.latitude.toFixed(2)}°N, ${p.longitude.toFixed(2)}°E</span>
            <span style="color: #94a3b8;">+${layerData?.lead_time_hours || 24}h</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 2px;">${p.title}</div>
          <div style="font-size: 16px; font-weight: 900; color: #ffffff; font-family: monospace;">
            ${Number(p.value).toFixed(2)} <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">${p.units}</span>
          </div>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #334155; font-size: 10px; color: #06b6d4; font-style: italic;">
            Click to inspect vertical sounding &amp; ensemble
          </div>
        </div>
      `;

      if (hoverPopupRef.current) {
        hoverPopupRef.current.setLngLat(coords).setHTML(html).addTo(map);
      }
    };

    const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const p = e.features[0].properties;
      onSelectCoord({ lat: p.latitude, lon: p.longitude });
    };

    map.on('mouseenter', 'met-grid-layer', handleMouseEnter);
    map.on('mouseleave', 'met-grid-layer', handleMouseLeave);
    map.on('mousemove', 'met-grid-layer', handleMouseMove);
    map.on('click', 'met-grid-layer', handleClick);

    return () => {
      map.off('mouseenter', 'met-grid-layer', handleMouseEnter);
      map.off('mouseleave', 'met-grid-layer', handleMouseLeave);
      map.off('mousemove', 'met-grid-layer', handleMouseMove);
      map.off('click', 'met-grid-layer', handleClick);
    };
  }, [mapLoaded, gridGeoJSON, selectedCoord, layerData, onSelectCoord]);

  // 7. Particle Vector Animation Loop for Wind Field
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map || !mapLoaded) return;

    if (!showVectors || !vectorData || !vectorData.vectors || vectorData.vectors.length === 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    // Initialize or update Wind Particle Engine with real U/V vector data
    particleEngineRef.current = new WindParticleEngine(vectorData, 2400);

    const resizeCanvas = () => {
      const rect = map.getCanvas().getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const ctx = canvas.getContext('2d');
      if (ctx && particleEngineRef.current) {
        const rect = map.getCanvas().getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Project geographic coordinates onto current canvas viewport
        const projectFn = (lon: number, lat: number) => {
          const pt = map.project([lon, lat]);
          return { x: pt.x, y: pt.y };
        };

        particleEngineRef.current.updateAndDraw(ctx, projectFn, opacity);
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      map.off('resize', resizeCanvas);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [vectorData, showVectors, mapLoaded, opacity]);

  // Vector data statistics for debug panel
  const vectorStats = useMemo(() => {
    if (!vectorData || !vectorData.vectors || vectorData.vectors.length === 0) return null;
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;
    for (const v of vectorData.vectors) {
      if (v.u < minU) minU = v.u;
      if (v.u > maxU) maxU = v.u;
      if (v.v < minV) minV = v.v;
      if (v.v > maxV) maxV = v.v;
    }
    return {
      count: vectorData.vectors.length,
      uRange: `${minU.toFixed(1)} to ${maxU.toFixed(1)} m/s`,
      vRange: `${minV.toFixed(1)} to ${maxV.toFixed(1)} m/s`,
    };
  }, [vectorData]);

  const numGridPts = layerData?.points ? layerData.points.length : 0;
  const gridLats = useMemo(() => new Set(layerData?.points?.map((p) => p.latitude)).size, [layerData]);
  const gridLons = useMemo(() => new Set(layerData?.points?.map((p) => p.longitude)).size, [layerData]);

  return (
    <div className="relative w-full h-full min-h-[540px] bg-[#040813] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Particle Animation Canvas Overlay */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-[#040813]/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#0b1222]/90 border border-cyan-800/80 p-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-cyan-300 font-mono text-xs">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Processing Meteorological Pipeline &amp; Rendering Raster...</span>
          </div>
        </div>
      )}

      {/* Map Controls Floating Toolbar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1 bg-[#0b1222]/90 border border-slate-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-800 my-0.5" />
        <button
          onClick={() => {
            const r = REGION_CENTERS[region] || REGION_CENTERS.india;
            mapRef.current?.flyTo({
              center: r.center,
              zoom: r.zoom,
              pitch: 15,
              bearing: 0,
              speed: 1.2,
            });
          }}
          title="Reset Regional View"
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Basemap Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            title="Switch Basemap"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5" />
          </button>

          {showBasemapMenu && (
            <div className="absolute left-10 top-0 bg-[#0b1222] border border-slate-800 rounded-xl p-1.5 shadow-2xl space-y-1 w-36 text-xs font-mono z-40">
              {Object.entries(BASEMAP_STYLES).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveBasemap(key);
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                    activeBasemap === key
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Debug Panel Button */}
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          title="Toggle Data Pipeline Diagnostics"
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            showDebugPanel
              ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-800'
              : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Layer Badge (Top Center/Right) */}
      <div className="absolute top-4 right-4 z-20 bg-[#0b1222]/95 border border-slate-800/90 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md flex items-center space-x-2 font-mono text-xs">
        <span className="flex items-center space-x-1.5 text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-lg text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE ONLINE STREAM</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-200 font-bold">{layerMetadata.name}</span>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-400">+{layerData?.lead_time_hours ?? 24}h</span>
        {showVectors && vectorData && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-pink-400 flex items-center space-x-1">
              <Wind className="w-3 h-3" />
              <span>Particles 60FPS</span>
            </span>
          </>
        )}
      </div>

      {/* Floating Real-Time Meteorological Data Status & Debug Panel (Criterion #8) */}
      {showDebugPanel && (
        <div className="absolute bottom-4 left-4 z-20 w-72 bg-[#040813]/95 border border-cyan-900/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold tracking-wider">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>DATA STATUS &amp; PIPELINE</span>
            </div>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Source:</span>
              <span className="text-emerald-300 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>NOAA / ECMWF Live Stream</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Layer:</span>
              <span className="text-slate-200 truncate max-w-[150px]">{layerMetadata.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Forecast:</span>
              <span className="text-cyan-400 font-bold">+{layerData?.lead_time_hours ?? 24}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grid:</span>
              <span className="text-slate-200">
                {gridLats}×{gridLons} ({numGridPts} pts)
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-1.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">U Data:</span>
              {vectorStats ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{vectorStats.uRange}</span>
                </span>
              ) : (
                <span className="text-slate-500">N/A</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">V Data:</span>
              {vectorStats ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{vectorStats.vRange}</span>
                </span>
              ) : (
                <span className="text-slate-500">N/A</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-1.5 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Min:</span>
              <span className="text-slate-200">
                {layerData?.statistics ? layerData.statistics.min.toFixed(2) : '--'} {layerData?.units}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mean:</span>
              <span className="text-slate-200">
                {layerData?.statistics ? layerData.statistics.mean.toFixed(2) : '--'} {layerData?.units}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">P90:</span>
              <span className="text-slate-200">
                {layerData?.statistics ? layerData.statistics.p90.toFixed(2) : '--'} {layerData?.units}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Max:</span>
              <span className="text-slate-200">
                {layerData?.statistics ? layerData.statistics.max.toFixed(2) : '--'} {layerData?.units}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-1.5 flex justify-between items-center text-[10px]">
            <div className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Map Source: LOADED</span>
            </div>
            <span className="text-slate-400">{numGridPts} Rendered</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeteorologicalMapLibre;
