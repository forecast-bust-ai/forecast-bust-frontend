'use client';

import React from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Rectangle,
  Polyline,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ConfidenceMapPoint } from '@/types/api';
import { INDIAN_CITIES, calculateDistanceKm } from '@/lib/cities';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface MapContainerWrapperProps {
  points: ConfidenceMapPoint[];
  selectedPoint: ConfidenceMapPoint | null;
  onSelectPoint: (point: ConfidenceMapPoint) => void;
  activeLayer?: 'heatmap' | 'radar' | 'wind';
}

// Custom Zoom and Reset Controller
const MapControls: React.FC = () => {
  const map = useMap();

  return (
    <div className="absolute top-3 left-3 z-[400] flex flex-col space-y-1 bg-[#0b1222]/90 border border-slate-800 rounded-lg p-1 shadow-xl backdrop-blur-md">
      <button
        onClick={() => map.zoomIn()}
        title="Zoom In"
        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="border-t border-slate-800 my-0.5" />
      <button
        onClick={() => map.setView([21.0, 78.5], 5)}
        title="Reset Synoptic View"
        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors text-xs"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const MapContainerWrapper: React.FC<MapContainerWrapperProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  activeLayer = 'heatmap',
}) => {
  // Regional bounding box for India / Bay of Bengal basin
  const indiaBounds: [[number, number], [number, number]] = [
    [0.0, 60.0],
    [40.0, 100.0],
  ];

  // 850 hPa Monsoon Low-Level Jet (LLJ) Synoptic Streamlines
  const monsoonStreamlines: [number, number][][] = [
    // Somali Jet -> Arabian Sea -> Peninsular India -> Bay of Bengal -> Gangetic Trough
    [
      [8.0, 62.0],
      [11.0, 68.0],
      [14.0, 74.0],
      [16.0, 80.0],
      [18.5, 87.0],
      [22.5, 88.0],
      [24.5, 84.0],
      [26.5, 78.0],
    ],
    [
      [5.0, 65.0],
      [8.5, 72.0],
      [11.5, 78.0],
      [14.5, 84.0],
      [17.0, 90.0],
      [21.0, 92.0],
      [23.5, 89.0],
      [25.0, 82.0],
    ],
    [
      [12.0, 63.0],
      [15.0, 70.0],
      [18.0, 76.0],
      [20.0, 83.0],
      [22.0, 88.5],
      [23.5, 86.0],
    ],
  ];

  // Calculate Marker appearance based on active layer
  const getMarkerStyle = (point: ConfidenceMapPoint) => {
    const isSelected =
      selectedPoint &&
      Math.abs(selectedPoint.latitude - point.latitude) < 0.01 &&
      Math.abs(selectedPoint.longitude - point.longitude) < 0.01;

    if (activeLayer === 'radar') {
      // Precip Radar Mode
      const fp = point.forecast_precipitation_mm;
      let color = '#38bdf8'; // Light (<5mm)
      let radius = 4;
      let label = 'Light (<5mm)';

      if (fp >= 35.0) {
        color = '#ef4444'; // Extreme (>35mm)
        radius = 8;
        label = 'Extreme (>35mm)';
      } else if (fp >= 15.0) {
        color = '#f59e0b'; // Heavy (15-35mm)
        radius = 6.5;
        label = 'Heavy (15-35mm)';
      } else if (fp >= 5.0) {
        color = '#22c55e'; // Moderate (5-15mm)
        radius = 5.5;
        label = 'Moderate (5-15mm)';
      }

      return {
        pathOptions: {
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1,
          fillOpacity: isSelected ? 1.0 : 0.85,
        },
        radius: isSelected ? radius + 3 : radius,
        isSelected,
        intensityLabel: label,
      };
    }

    if (activeLayer === 'wind') {
      // 850hPa Wind Jet Mode (derived synoptic speed based on lat/lon)
      const lat = point.latitude;
      const lon = point.longitude;
      // Simulated LLJ core along 12°N-18°N across Peninsular & Bay of Bengal
      const windSpeedKt = Math.round(
        12 + Math.sin(lat / 10) * 8 + Math.cos(lon / 15) * 6 + (point.forecast_precipitation_mm * 0.2)
      );

      let color = '#06b6d4'; // 5-12 kt (Light)
      let radius = 4.5;
      if (windSpeedKt >= 22) {
        color = '#ec4899'; // >22 kt (Strong Jet Core)
        radius = 7;
      } else if (windSpeedKt >= 16) {
        color = '#8b5cf6'; // 16-22 kt (Moderate Jet)
        radius = 6;
      } else if (windSpeedKt >= 10) {
        color = '#3b82f6'; // 10-16 kt
        radius = 5;
      }

      return {
        pathOptions: {
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1,
          fillOpacity: isSelected ? 1.0 : 0.85,
        },
        radius: isSelected ? radius + 3 : radius,
        isSelected,
        windSpeedKt,
      };
    }

    // Default: Bust Probability Heatmap Mode
    const prob = point.bust_probability;
    let color = '#10b981'; // Low risk (<30%)
    let radius = 4.5;

    if (prob >= 0.65) {
      color = '#f43f5e'; // High risk (>65%)
      radius = 6;
    } else if (prob >= 0.30) {
      color = '#f59e0b'; // Moderate risk (30-65%)
      radius = 5.5;
    }

    return {
      pathOptions: {
        fillColor: color,
        color: isSelected ? '#38bdf8' : color,
        weight: isSelected ? 3 : 1,
        fillOpacity: isSelected ? 1.0 : 0.85,
      },
      radius: isSelected ? radius + 3 : radius,
      isSelected,
    };
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[21.0, 78.5]}
        zoom={5}
        minZoom={4}
        maxZoom={9}
        style={{ height: '100%', width: '100%', backgroundColor: '#070c18' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Custom On-Map Zoom Controls */}
        <MapControls />

        {/* Regional Bounding Box Outline */}
        <Rectangle
          bounds={indiaBounds}
          pathOptions={{
            color: '#0284c7',
            weight: 1.5,
            dashArray: '6, 6',
            fillOpacity: 0.02,
          }}
        />

        {/* 850hPa Synoptic Streamlines (Visible in Wind mode) */}
        {activeLayer === 'wind' &&
          monsoonStreamlines.map((line, idx) => (
            <Polyline
              key={`streamline-${idx}`}
              positions={line}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.75,
                dashArray: '8, 8',
              }}
            />
          ))}

        {/* Render Gridded Layer Points */}
        {points.map((pt, idx) => {
          const style = getMarkerStyle(pt);
          return (
            <React.Fragment key={`${pt.latitude}-${pt.longitude}-${idx}`}>
              {/* If selected, render a glowing outer radar halo */}
              {style.isSelected && (
                <CircleMarker
                  center={[pt.latitude, pt.longitude]}
                  radius={16}
                  pathOptions={{
                    fillColor: 'transparent',
                    color: activeLayer === 'radar' ? '#eab308' : '#06b6d4',
                    weight: 2,
                    dashArray: '3, 3',
                    opacity: 0.9,
                  }}
                />
              )}

              <CircleMarker
                center={[pt.latitude, pt.longitude]}
                radius={style.radius}
                pathOptions={style.pathOptions}
                eventHandlers={{
                  click: () => onSelectPoint(pt),
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="text-xs space-y-1 font-sans bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="font-bold text-slate-100 flex justify-between gap-2">
                      <span>{pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E</span>
                      <span className="text-[10px] text-cyan-400 font-mono">+{pt.lead_time_hours}h</span>
                    </div>

                    {activeLayer === 'radar' ? (
                      <>
                        <div className="text-cyan-300 font-semibold">
                          Rainfall: {pt.forecast_precipitation_mm.toFixed(1)} mm/day
                        </div>
                        <div className="text-amber-400 text-[10px]">
                          Intensity: {style.intensityLabel}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Bust Risk: {(pt.bust_probability * 100).toFixed(1)}%
                        </div>
                      </>
                    ) : activeLayer === 'wind' ? (
                      <>
                        <div className="text-purple-300 font-semibold">
                          850hPa Wind: {style.windSpeedKt} kts ({((style.windSpeedKt || 15) * 0.514).toFixed(1)} m/s)
                        </div>
                        <div className="text-cyan-400 text-[10px]">
                          Flow: WSW Monsoon Jet (245°)
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Expected Rain: {pt.forecast_precipitation_mm.toFixed(1)} mm
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-rose-400 font-semibold">
                          Bust Probability: {(pt.bust_probability * 100).toFixed(1)}%
                        </div>
                        <div className="text-slate-300">
                          Expected Error: {pt.expected_error_mm.toFixed(1)} mm
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          GFS Rain: {pt.forecast_precipitation_mm.toFixed(1)} mm
                        </div>
                      </>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Render Major Indian Cities & Met Observatories */}
        {INDIAN_CITIES.map((city) => {
          // Find nearest forecast point for this city
          let nearestPt: ConfidenceMapPoint | null = null;
          let minD = Infinity;
          for (const pt of points) {
            const d = calculateDistanceKm(city.latitude, city.longitude, pt.latitude, pt.longitude);
            if (d < minD) {
              minD = d;
              nearestPt = pt;
            }
          }

          const cityProb = nearestPt ? nearestPt.bust_probability : 0.45;
          const cityRain = nearestPt ? nearestPt.forecast_precipitation_mm : 25.0;
          const isCitySelected =
            selectedPoint &&
            calculateDistanceKm(selectedPoint.latitude, selectedPoint.longitude, city.latitude, city.longitude) < 25;

          return (
            <CircleMarker
              key={`city-${city.name}`}
              center={[city.latitude, city.longitude]}
              radius={isCitySelected ? 9 : 7}
              pathOptions={{
                fillColor: '#0ea5e9',
                color: isCitySelected ? '#38bdf8' : '#ffffff',
                weight: isCitySelected ? 3 : 2,
                fillOpacity: 1.0,
              }}
              eventHandlers={{
                click: () => {
                  if (nearestPt) {
                    onSelectPoint(nearestPt);
                  } else {
                    onSelectPoint({
                      lead_time_hours: 24,
                      latitude: city.latitude,
                      longitude: city.longitude,
                      bust_probability: cityProb,
                      confidence: 0.85,
                      expected_error_mm: 12.5,
                      forecast_precipitation_mm: cityRain,
                    });
                  }
                },
              }}
            >
              <Tooltip direction="right" offset={[8, 0]} permanent={false} opacity={0.98}>
                <div className="text-xs space-y-1 font-sans bg-slate-950 p-2 rounded-lg border border-cyan-800/80 shadow-2xl">
                  <div className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{city.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({city.state})</span>
                  </div>
                  <div className="text-rose-400 font-bold text-[11px]">
                    Bust Probability: {(cityProb * 100).toFixed(1)}%
                  </div>
                  <div className="text-cyan-300 text-[10px] font-mono">
                    GFS Rain: {cityRain.toFixed(1)} mm/day
                  </div>
                  <div className="text-slate-400 text-[9px] italic">
                    Click to inspect city weather profile
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Dynamic Legend Box (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[400] bg-[#0b1222]/95 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs pointer-events-none">
        {activeLayer === 'radar' ? (
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

export default MapContainerWrapper;
