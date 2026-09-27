'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { WeatherMap } from '@/components/WeatherMap';
import { CityForecastTable } from '@/components/CityForecastTable';
import { useForecastData } from '@/hooks/useForecastData';
import { Radar, Eye } from 'lucide-react';

export default function RadarPage() {
  const {
    leadTimeHours,
    selectedPoint,
    setSelectedPoint,
    health,
    confidenceMap,
    loading,
  } = useForecastData();

  const [subBasin, setSubBasin] = useState<string>('eastern');

  const basins = [
    { id: 'eastern', name: 'Gangetic Plain & Eastern India', coords: '22°N-26°N / 82°E-90°E' },
    { id: 'western_ghats', name: 'Western Ghats / Konkan Belt', coords: '12°N-20°N / 72°E-76°E' },
    { id: 'bay_of_bengal', name: 'North Bay of Bengal Depression', coords: '17°N-22°N / 86°E-93°E' },
    { id: 'central', name: 'Central India Monsoon Core', coords: '18°N-24°N / 76°E-84°E' },
    { id: 'northeast', name: 'Northeast & Brahmaputra Valley', coords: '24°N-28°N / 89°E-96°E' },
  ];

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between">
      <div>
        <Header health={health} loading={loading} />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          {/* Top Studio Control Bar */}
          <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50 shadow-inner">
                <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
                  <span>Synoptic NWP & Radar Studio</span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono">
                    High-Res 0.25° Grid
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Interactive multi-layer meteorological radar, 850hPa monsoon streamlines, and bust risk vectors.
                </p>
              </div>
            </div>

            {/* Basin Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Sub-basin Focus:</span>
              <select
                value={subBasin}
                onChange={(e) => setSubBasin(e.target.value)}
                className="bg-[#070c18] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {basins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Screen Interactive Map Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Main Full Width Map */}
            <div className="lg:col-span-9 space-y-4">
              <WeatherMap
                points={confidenceMap?.points || []}
                selectedPoint={selectedPoint}
                onSelectPoint={setSelectedPoint}
                loading={loading}
                leadTimeHours={leadTimeHours}
              />
            </div>

            {/* Side Quick Inspection Panel */}
            <div className="lg:col-span-3 space-y-3">
              {/* Point Inspector */}
              <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Grid Inspection</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-mono">
                    +{leadTimeHours}h
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Coordinates</span>
                    <strong className="text-slate-200 font-mono">
                      {selectedPoint ? `${selectedPoint.latitude.toFixed(2)}°N, ${selectedPoint.longitude.toFixed(2)}°E` : '23.00°N, 86.00°E'}
                    </strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Bust Risk Severity</span>
                    <strong className="text-rose-400 font-bold font-mono">
                      {selectedPoint ? `${(selectedPoint.bust_probability * 100).toFixed(1)}%` : '58.5%'}
                    </strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Expected Rainfall (GFS)</span>
                    <strong className="text-cyan-300 font-bold font-mono">
                      {selectedPoint ? `${selectedPoint.forecast_precipitation_mm.toFixed(1)} mm` : '35.7 mm'}
                    </strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Mean Model Confidence</span>
                    <strong className="text-amber-300 font-bold font-mono">
                      {selectedPoint ? `${(selectedPoint.confidence * 100).toFixed(1)}%` : '82.4%'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Layer Legend Quick Info */}
              <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider font-mono">
                  Synoptic Layer Modes
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Toggle between <strong>Bust Heatmap</strong> (failure hotspots), <strong>Precip Radar</strong> (GFS Quantitative Rain), and <strong>850hPa Wind</strong> (Low-Level Jet streamlines) using the header buttons on the map.
                </p>
              </div>
            </div>
          </div>

          {/* City-to-City Forecast Breakdown */}
          <CityForecastTable
            points={confidenceMap?.points || []}
            leadTimeHours={leadTimeHours}
            onSelectCity={(pt) => setSelectedPoint(pt)}
          />
        </main>
      </div>

      <footer className="border-t border-slate-900/90 bg-[#040711] py-3 mt-6">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          Synoptic Radar Studio • Forecast Bust AI • National Centre for Medium Range Weather Forecasting
        </div>
      </footer>
    </div>
  );
}
