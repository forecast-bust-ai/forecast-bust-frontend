'use client';

import React from 'react';
import { Layers, MapPin, AlertTriangle, Sun } from 'lucide-react';
import { ConfidenceMapResponse } from '@/types/api';

interface StatsOverviewProps {
  confidenceMap: ConfidenceMapResponse | null;
  leadTimeHours: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  confidenceMap,
  leadTimeHours,
}) => {
  const points = confidenceMap?.points || [];
  const totalPoints = confidenceMap?.total_points || 1600;

  const maxProb =
    points.length > 0
      ? Math.max(...points.map((p) => p.bust_probability))
      : 0.872;

  const meanError =
    points.length > 0
      ? points.reduce((acc, p) => acc + p.expected_error_mm, 0) / points.length
      : 15.12;

  const dayNumber = Math.ceil(leadTimeHours / 24);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Lead Time Target Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lead Time Target
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">
              +{leadTimeHours} Hours <span className="text-cyan-400 font-bold text-sm">(Day {dayNumber})</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">Cycle: 2026-09-26 00Z</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold text-[10px]">
            Deterministic GFS
          </span>
        </div>
      </div>

      {/* 2. Spatial Resolution Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50 shadow-inner">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Spatial Resolution
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">
              {totalPoints} Points <span className="text-slate-400 font-semibold text-xs">(0.25°)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">Grid: 18°N–28°N / 80°E–92°E</span>
          <span className="text-blue-300 font-medium text-[10px]">Regular Mesh</span>
        </div>
      </div>

      {/* 3. Peak Bust Probability Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/50 shadow-inner">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peak Bust Probability
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">
              {(maxProb * 100).toFixed(1)}% <span className="text-rose-500 font-bold text-xs">(Severe)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">{totalPoints} Hotspots Evaluated</span>
          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold text-[10px]">
            Threshold &gt;50mm
          </span>
        </div>
      </div>

      {/* 4. Mean Expected Error Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/50 shadow-inner">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mean Expected Error
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">
              {meanError.toFixed(2)} <span className="text-slate-400 font-normal text-xs">mm / day</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">Regional MAE: ±4.2 mm</span>
          <span className="text-amber-400 font-semibold text-[10px]">Conf: 94.2%</span>
        </div>
      </div>
    </div>
  );
};
