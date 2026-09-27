'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ConfidenceMapPoint } from '@/types/api';
import { Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled for MapLibre GL JS client-side map rendering
const MapLibreContainer = dynamic(
  () => import('./MapLibreContainer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[460px] bg-[#070c18] flex flex-col items-center justify-center text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        <span>Initializing MapLibre GL JS Engine (WebGL)...</span>
      </div>
    ),
  }
);

interface WeatherMapProps {
  points: ConfidenceMapPoint[];
  selectedPoint: ConfidenceMapPoint | null;
  onSelectPoint: (point: ConfidenceMapPoint) => void;
  loading: boolean;
  leadTimeHours: number;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  loading,
  leadTimeHours,
}) => {
  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'radar' | 'wind' | 'thermal'>('heatmap');

  const selectedLat = selectedPoint ? selectedPoint.latitude.toFixed(2) : '23.00';
  const selectedLon = selectedPoint ? selectedPoint.longitude.toFixed(2) : '86.00';

  // Calculate forecast valid time based on lead time
  const validDate = new Date();
  validDate.setHours(validDate.getHours() + leadTimeHours);
  const formattedValid = validDate.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
      {/* 1. Header Bar inside Map Card */}
      <div className="px-4 py-2.5 bg-[#080e1a]/95 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="uppercase tracking-wider">MapLibre GL Synoptic Grid Engine</span>
          <span className="text-slate-500 font-normal">| Sub-basin: Eastern India / Gangetic Plain</span>
        </div>

        {/* Layer Mode Switch Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveLayer('heatmap')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeLayer === 'heatmap'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Bust Heatmap
          </button>
          <button
            onClick={() => setActiveLayer('thermal')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeLayer === 'thermal'
                ? 'bg-orange-950 text-orange-300 border border-orange-700/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            🔥 Thermal IR / Temp
          </button>
          <button
            onClick={() => setActiveLayer('radar')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeLayer === 'radar'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Precip Radar
          </button>
          <button
            onClick={() => setActiveLayer('wind')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeLayer === 'wind'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            850hPa Wind
          </button>
        </div>
      </div>

      {/* 2. Interactive MapLibre Map Container */}
      <div className="relative w-full h-[460px] sm:h-[500px] bg-[#070c18]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#070c18]/80 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center text-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
            <span className="text-xs font-semibold">Updating Spatial Forecast Map...</span>
          </div>
        )}

        <MapLibreContainer
          points={points}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
          activeLayer={activeLayer}
        />
      </div>

      {/* 3. Map Status Footer Bar */}
      <div className="px-4 py-2 bg-[#080e1a]/95 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-2">
          <span>Cursor / Selected: <strong className="text-cyan-400 font-semibold">{selectedLat}°N, {selectedLon}°E</strong></span>
          <span className="text-slate-600">|</span>
          <span>Engine: MapLibre GL JS (WebGL)</span>
          <span className="text-slate-600">|</span>
          <span>Pitch: 20°</span>
        </div>
        <div>
          <span>Forecast Valid: <span className="text-slate-200 font-semibold">{formattedValid}</span></span>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
