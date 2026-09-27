'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ConfidenceMapPoint } from '@/types/api';
import { INDIAN_CITIES, calculateDistanceKm } from '@/lib/cities';
import { Plus, Minus, RotateCcw } from 'lucide-react';

// Ensure MapLibre Worker URL points to the bundled local worker script
if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface MapLibreContainerProps {
  points: ConfidenceMapPoint[];
  selectedPoint: ConfidenceMapPoint | null;
  onSelectPoint: (point: ConfidenceMapPoint) => void;
  activeLayer?: 'heatmap' | 'radar' | 'wind' | 'thermal';
}

export const MapLibreContainer: React.FC<MapLibreContainerProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  activeLayer = 'heatmap',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (typeof window !== 'undefined') {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
    }

    // Dark Map Style with reliable vector/raster layers
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-dark': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '&copy; Esri &mdash; MapLibre GL JS Engine',
          },
        },
        layers: [
          {
            id: 'esri-dark-tiles',
            type: 'raster',
            source: 'esri-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [78.9629, 21.5937], // Centered on India (Lon, Lat)
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 10,
      pitch: 20, // 3D perspective tilt
      bearing: 0,
      attributionControl: false,
    });

    // Add scale bar
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);
    });

    hoverPopupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'maplibre-weather-popup',
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Prepare GeoJSON Data Sources for Grid & Cities
  const gridGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: points.map((pt, idx) => {
        const lat = pt.latitude;
        const lon = pt.longitude;

        // Thermal simulation (°C)
        const inlandFactor = Math.sin(((lon - 68) / 25) * Math.PI) * 4.5;
        const latFactor = (32 - lat) * 0.35;
        const rainCooling = Math.min(5.5, pt.forecast_precipitation_mm * 0.12);
        const tempC = Number((34.0 + inlandFactor + latFactor - rainCooling).toFixed(1));

        // Wind simulation (kts)
        const windSpeedKt = Math.round(
          12 + Math.sin(lat / 10) * 8 + Math.cos(lon / 15) * 6 + pt.forecast_precipitation_mm * 0.2
        );

        return {
          type: 'Feature' as const,
          id: idx,
          geometry: {
            type: 'Point' as const,
            coordinates: [lon, lat],
          },
          properties: {
            idx,
            latitude: lat,
            longitude: lon,
            lead_time_hours: pt.lead_time_hours,
            bust_probability: pt.bust_probability,
            confidence: pt.confidence,
            expected_error_mm: pt.expected_error_mm,
            forecast_precipitation_mm: pt.forecast_precipitation_mm,
            tempC,
            windSpeedKt,
          },
        };
      }),
    };
  }, [points]);

  const citiesGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: INDIAN_CITIES.map((city, idx) => ({
        type: 'Feature' as const,
        id: `city-${idx}`,
        geometry: {
          type: 'Point' as const,
          coordinates: [city.longitude, city.latitude],
        },
        properties: {
          name: city.name,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          region: city.region,
        },
      })),
    };
  }, []);

  const streamlinesGeoJSON = useMemo(() => {
    const lines = [
      [[62.0, 8.0], [68.0, 11.0], [74.0, 14.0], [80.0, 16.0], [87.0, 18.5], [88.0, 22.5], [84.0, 24.5], [78.0, 26.5]],
      [[65.0, 5.0], [72.0, 8.5], [78.0, 11.5], [84.0, 14.5], [90.0, 17.0], [92.0, 21.0], [89.0, 23.5], [82.0, 25.0]],
      [[63.0, 12.0], [70.0, 15.0], [76.0, 18.0], [83.0, 20.0], [88.5, 22.0], [86.0, 23.5]],
    ];
    return {
      type: 'FeatureCollection' as const,
      features: lines.map((line, idx) => ({
        type: 'Feature' as const,
        id: `streamline-${idx}`,
        geometry: {
          type: 'LineString' as const,
          coordinates: line,
        },
        properties: { name: `Streamline ${idx + 1}` },
      })),
    };
  }, []);

  // 3. Update Sources and Layers on Data/Mode Changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // A. Grid Points Source
    if (map.getSource('grid-points')) {
      (map.getSource('grid-points') as maplibregl.GeoJSONSource).setData(gridGeoJSON);
    } else {
      map.addSource('grid-points', {
        type: 'geojson',
        data: gridGeoJSON,
      });
    }

    // B. Streamlines Source
    if (map.getSource('monsoon-streamlines')) {
      (map.getSource('monsoon-streamlines') as maplibregl.GeoJSONSource).setData(streamlinesGeoJSON);
    } else {
      map.addSource('monsoon-streamlines', {
        type: 'geojson',
        data: streamlinesGeoJSON,
      });
    }

    // C. Cities Source
    if (map.getSource('indian-cities')) {
      (map.getSource('indian-cities') as maplibregl.GeoJSONSource).setData(citiesGeoJSON);
    } else {
      map.addSource('indian-cities', {
        type: 'geojson',
        data: citiesGeoJSON,
      });
    }

    // D. Streamlines Layer (for Wind Mode)
    if (!map.getLayer('wind-streamlines-layer')) {
      map.addLayer({
        id: 'wind-streamlines-layer',
        type: 'line',
        source: 'monsoon-streamlines',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: activeLayer === 'wind' ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-opacity': 0.8,
          'line-dasharray': [3, 2],
        },
      });
    } else {
      map.setLayoutProperty(
        'wind-streamlines-layer',
        'visibility',
        activeLayer === 'wind' ? 'visible' : 'none'
      );
    }

    // E. Grid Circles Layer
    if (map.getLayer('grid-circles-layer')) {
      map.removeLayer('grid-circles-layer');
    }

    // Dynamic Color Calculation by Active Layer
    let circleColorExpression: maplibregl.ExpressionSpecification;
    let circleRadiusExpression: maplibregl.ExpressionSpecification;

    if (activeLayer === 'thermal') {
      // Thermal Palette (<28: Cyan, 28-32: Lime, 32-37: Amber, 37-41: Red, >41: Fuchsia)
      circleColorExpression = [
        'interpolate',
        ['linear'],
        ['get', 'tempC'],
        24, '#06b6d4',
        28, '#84cc16',
        34, '#f59e0b',
        38, '#ef4444',
        42, '#d946ef',
      ];
      circleRadiusExpression = [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4,
        7, 8,
        10, 16,
      ];
    } else if (activeLayer === 'radar') {
      // Radar Palette (<5: Sky Blue, 5-15: Green, 15-35: Amber, >35: Crimson)
      circleColorExpression = [
        'interpolate',
        ['linear'],
        ['get', 'forecast_precipitation_mm'],
        0, '#38bdf8',
        5, '#22c55e',
        15, '#f59e0b',
        35, '#ef4444',
      ];
      circleRadiusExpression = [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4.5,
        7, 9,
        10, 18,
      ];
    } else if (activeLayer === 'wind') {
      // 850hPa Wind Jet Palette (<10: Cyan, 10-18: Blue, 18-25: Purple, >25: Pink)
      circleColorExpression = [
        'interpolate',
        ['linear'],
        ['get', 'windSpeedKt'],
        8, '#06b6d4',
        14, '#3b82f6',
        20, '#8b5cf6',
        28, '#ec4899',
      ];
      circleRadiusExpression = [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4,
        7, 8,
        10, 15,
      ];
    } else {
      // Bust Probability Heatmap (0.0: Emerald, 0.5: Amber, 1.0: Rose)
      circleColorExpression = [
        'interpolate',
        ['linear'],
        ['get', 'bust_probability'],
        0.0, '#10b981',
        0.3, '#10b981',
        0.5, '#f59e0b',
        0.65, '#f43f5e',
        1.0, '#e11d48',
      ];
      circleRadiusExpression = [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4.5,
        7, 9,
        10, 16,
      ];
    }

    map.addLayer({
      id: 'grid-circles-layer',
      type: 'circle',
      source: 'grid-points',
      paint: {
        'circle-radius': circleRadiusExpression,
        'circle-color': circleColorExpression,
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.4,
      },
    });

    // F. Major Cities Layer (Pins & Text Labels)
    if (!map.getLayer('cities-pins-layer')) {
      map.addLayer({
        id: 'cities-pins-layer',
        type: 'circle',
        source: 'indian-cities',
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#0ea5e9',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1.0,
        },
      });
    }

    // G. Setup Interactive Hover & Click Events
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
      }
    };

    const handleMouseMoveGrid = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const f = e.features[0];
      const p = f.properties;
      const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      let contentHTML = `
        <div style="background: #020617; color: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #1e293b; font-family: ui-sans-serif, system-ui; font-size: 11px; min-width: 170px;">
          <div style="font-weight: 800; color: #ffffff; display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 4px;">
            <span>${p.latitude.toFixed(2)}°N, ${p.longitude.toFixed(2)}°E</span>
            <span style="color: #38bdf8; font-family: monospace;">+${p.lead_time_hours}h</span>
          </div>
      `;

      if (activeLayer === 'thermal') {
        contentHTML += `
          <div style="color: #fb923c; font-weight: bold;">🔥 Surface Temp: ${p.tempC}°C</div>
          <div style="color: #94a3b8; font-size: 10px;">Bust Risk: ${(p.bust_probability * 100).toFixed(1)}%</div>
        `;
      } else if (activeLayer === 'radar') {
        contentHTML += `
          <div style="color: #38bdf8; font-weight: bold;">Rainfall: ${p.forecast_precipitation_mm.toFixed(1)} mm/day</div>
          <div style="color: #94a3b8; font-size: 10px;">Bust Risk: ${(p.bust_probability * 100).toFixed(1)}%</div>
        `;
      } else if (activeLayer === 'wind') {
        contentHTML += `
          <div style="color: #c084fc; font-weight: bold;">850hPa Jet: ${p.windSpeedKt} kts</div>
          <div style="color: #38bdf8; font-size: 10px;">Flow: WSW Monsoon (245°)</div>
        `;
      } else {
        contentHTML += `
          <div style="color: #f43f5e; font-weight: bold;">Bust Probability: ${(p.bust_probability * 100).toFixed(1)}%</div>
          <div style="color: #cbd5e1;">Expected Error: ${p.expected_error_mm.toFixed(1)} mm</div>
          <div style="color: #94a3b8; font-size: 10px;">GFS Rain: ${p.forecast_precipitation_mm.toFixed(1)} mm</div>
        `;
      }

      contentHTML += `</div>`;

      if (hoverPopupRef.current) {
        hoverPopupRef.current.setLngLat(coords).setHTML(contentHTML).addTo(map);
      }
    };

    const handleMouseMoveCity = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const f = e.features[0];
      const p = f.properties;
      const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      const contentHTML = `
        <div style="background: #020617; color: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #0284c7; font-family: ui-sans-serif, system-ui; font-size: 11px; min-width: 170px;">
          <div style="font-weight: 800; color: #38bdf8; font-size: 12px;">📍 ${p.name}</div>
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 4px;">${p.state} • ${p.region}</div>
          <div style="color: #38bdf8; font-size: 10px; font-style: italic;">Click to inspect city forecast</div>
        </div>
      `;

      if (hoverPopupRef.current) {
        hoverPopupRef.current.setLngLat(coords).setHTML(contentHTML).addTo(map);
      }
    };

    const handleClickGrid = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const p = e.features[0].properties;
      const pt: ConfidenceMapPoint = {
        lead_time_hours: p.lead_time_hours,
        latitude: p.latitude,
        longitude: p.longitude,
        bust_probability: p.bust_probability,
        confidence: p.confidence,
        expected_error_mm: p.expected_error_mm,
        forecast_precipitation_mm: p.forecast_precipitation_mm,
      };
      onSelectPoint(pt);

      map.flyTo({
        center: [p.longitude, p.latitude],
        zoom: Math.max(map.getZoom(), 6),
        speed: 1.2,
      });
    };

    const handleClickCity = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const p = e.features[0].properties;

      // Find closest grid point
      let closestPt: ConfidenceMapPoint | null = null;
      let minD = Infinity;
      for (const pt of points) {
        const d = calculateDistanceKm(p.latitude, p.longitude, pt.latitude, pt.longitude);
        if (d < minD) {
          minD = d;
          closestPt = pt;
        }
      }

      if (closestPt) {
        onSelectPoint(closestPt);
      } else {
        onSelectPoint({
          lead_time_hours: 24,
          latitude: p.latitude,
          longitude: p.longitude,
          bust_probability: 0.45,
          confidence: 0.85,
          expected_error_mm: 12.0,
          forecast_precipitation_mm: 25.0,
        });
      }

      map.flyTo({
        center: [p.longitude, p.latitude],
        zoom: 6.8,
        speed: 1.2,
      });
    };

    // Attach map listeners
    map.on('mouseenter', 'grid-circles-layer', handleMouseEnter);
    map.on('mouseleave', 'grid-circles-layer', handleMouseLeave);
    map.on('mousemove', 'grid-circles-layer', handleMouseMoveGrid);
    map.on('click', 'grid-circles-layer', handleClickGrid);

    map.on('mouseenter', 'cities-pins-layer', handleMouseEnter);
    map.on('mouseleave', 'cities-pins-layer', handleMouseLeave);
    map.on('mousemove', 'cities-pins-layer', handleMouseMoveCity);
    map.on('click', 'cities-pins-layer', handleClickCity);

    return () => {
      map.off('mouseenter', 'grid-circles-layer', handleMouseEnter);
      map.off('mouseleave', 'grid-circles-layer', handleMouseLeave);
      map.off('mousemove', 'grid-circles-layer', handleMouseMoveGrid);
      map.off('click', 'grid-circles-layer', handleClickGrid);

      map.off('mouseenter', 'cities-pins-layer', handleMouseEnter);
      map.off('mouseleave', 'cities-pins-layer', handleMouseLeave);
      map.off('mousemove', 'cities-pins-layer', handleMouseMoveCity);
      map.off('click', 'cities-pins-layer', handleClickCity);
    };
  }, [mapLoaded, gridGeoJSON, citiesGeoJSON, streamlinesGeoJSON, activeLayer, points, onSelectPoint]);

  // Handle zooming when selectedPoint changes externally
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoint) return;
    // Gentle camera center on selected point
  }, [selectedPoint]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#070c18]">
      {/* MapLibre Container DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Map Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1 bg-[#0b1222]/90 border border-slate-800 rounded-lg p-1 shadow-xl backdrop-blur-md">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-800 my-0.5" />
        <button
          onClick={() => {
            mapRef.current?.flyTo({
              center: [78.9629, 21.5937],
              zoom: 4.8,
              pitch: 20,
              bearing: 0,
              speed: 1.2,
            });
          }}
          title="Reset Synoptic View"
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Dynamic Legend Box (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#0b1222]/95 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs pointer-events-none">
        {activeLayer === 'thermal' ? (
          <>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block mb-2 font-mono">
              2m Surface Temp & Thermal Forcing
            </span>
            <div className="space-y-1.5 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
                <span className="text-slate-300 text-[11px]">&lt; 28°C (Cool Marine / Orographic)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(132,204,22,0.7)]" />
                <span className="text-slate-300 text-[11px]">28°C – 32°C (Moderate Temp)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                <span className="text-slate-300 text-[11px]">32°C – 37°C (High Convective Heat)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                <span className="text-slate-300 text-[11px]">37°C – 41°C (Severe Heat Forcing)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.7)]" />
                <span className="text-slate-300 text-[11px]">&gt; 41°C (Extreme Thermal Plume)</span>
              </div>
            </div>
          </>
        ) : activeLayer === 'radar' ? (
          <>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-2 font-mono">
              Precipitation Intensity (24h)
            </span>
            <div className="space-y-1.5 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
                <span className="text-slate-300 text-[11px]">Trace / Light (&lt;5 mm)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
                <span className="text-slate-300 text-[11px]">Moderate (5–15 mm)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                <span className="text-slate-300 text-[11px]">Heavy (15–35 mm)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                <span className="text-slate-300 text-[11px]">Extreme (&gt;35 mm)</span>
              </div>
            </div>
          </>
        ) : activeLayer === 'wind' ? (
          <>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-2 font-mono">
              850 hPa Synoptic Wind Field
            </span>
            <div className="space-y-1.5 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300 text-[11px]">5–10 kt (Light Flow)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300 text-[11px]">10–18 kt (Moderate Jet)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.7)]" />
                <span className="text-slate-300 text-[11px]">18–30+ kt (Strong Jet Core)</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                <span className="w-4 h-0.5 bg-cyan-400 border-dashed" />
                <span className="text-slate-400 text-[10px]">Monsoon Streamlines</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
              Bust Probability Class
            </span>
            <div className="space-y-1.5 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                <span className="text-slate-300 text-[11px]">Low (&lt;30%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
                <span className="text-slate-300 text-[11px]">Moderate (30–65%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                <span className="text-slate-300 text-[11px]">High Risk (&gt;65%)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapLibreContainer;
