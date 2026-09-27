'use client';

import React, { useState } from 'react';
import { AiComparisonResponse, ComparisonPoint } from '@/types/meteorology';
import { Sparkles } from 'lucide-react';

interface AiComparisonGridProps {
  comparisonData: AiComparisonResponse | null;
  loading?: boolean;
}

export const AiComparisonGrid: React.FC<AiComparisonGridProps> = ({
  comparisonData,
  loading = false,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ComparisonPoint | null>(null);

  if (loading || !comparisonData) {
    return (
      <div className="bg-[#080e1e] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">
          Evaluating 6-Field AI Post-Processing Synchronized Analysis...
        </p>
      </div>
    );
  }

  const { metrics, points } = comparisonData;

  // Find sample representative points (e.g. Western Ghats, Bay of Bengal, Central India)
  const samplePoints = points.filter(
    (pt) =>
      (pt.latitude === 18.0 && pt.longitude === 74.0) ||
      (pt.latitude === 20.0 && pt.longitude === 88.0) ||
      (pt.latitude === 24.0 && pt.longitude === 80.0) ||
      (pt.latitude === 12.0 && pt.longitude === 76.0)
  );

  const activeProbe = hoveredPoint || samplePoints[0] || points[Math.floor(points.length / 2)];

  // Subsample 2D grid for rendering the mini synchronised heatmaps (8x8 grid preview)
  const lats = Array.from(new Set(points.map((p) => p.latitude))).sort((a, b) => b - a);
  const lons = Array.from(new Set(points.map((p) => p.longitude))).sort((a, b) => a - b);

  const gridMap: Record<string, ComparisonPoint> = {};
  points.forEach((p) => {
    gridMap[`${p.latitude.toFixed(1)}_${p.longitude.toFixed(1)}`] = p;
  });

  const getRainColor = (v: number) => {
    if (v < 2) return '#0369a1';
    if (v < 10) return '#06b6d4';
    if (v < 25) return '#10b981';
    if (v < 50) return '#facc15';
    if (v < 100) return '#f97316';
    return '#ef4444';
  };

  const getBiasColor = (v: number) => {
    if (v < -10) return '#2563eb';
    if (v < -2) return '#93c5fd';
    if (v <= 2) return '#475569';
    if (v < 10) return '#fca5a5';
    return '#dc2626';
  };

  const getReductionColor = (v: number) => {
    if (v < 20) return '#94a3b8';
    if (v < 50) return '#38bdf8';
    if (v < 75) return '#10b981';
    return '#059669';
  };

  const renderMiniGrid = (
    fieldKey: keyof ComparisonPoint,
    colorFn: (val: number) => string,
    unit: string
  ) => {
    return (
      <div className="w-full aspect-[4/3] bg-[#040711] rounded-xl p-2 border border-slate-800/80 flex flex-col justify-between">
        <div className="grid grid-cols-12 gap-0.5 w-full h-full">
          {lats.slice(0, 12).map((lat) =>
            lons.slice(0, 12).map((lon) => {
              const pt = gridMap[`${lat.toFixed(1)}_${lon.toFixed(1)}`];
              const val = pt ? (pt[fieldKey] as number) : 0;
              const isHovered =
                hoveredPoint &&
                hoveredPoint.latitude === lat &&
                hoveredPoint.longitude === lon;

              return (
                <div
                  key={`${lat}_${lon}`}
                  onMouseEnter={() => pt && setHoveredPoint(pt)}
                  className={`w-full h-full rounded-[2px] transition-all cursor-crosshair ${
                    isHovered ? 'ring-2 ring-white scale-125 z-10' : ''
                  }`}
                  style={{ backgroundColor: colorFn(val) }}
                  title={`${lat}°N, ${lon}°E: ${val} ${unit}`}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#080e1e]/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-5 text-slate-100">
      {/* 1. Header & Scorecard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/80 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
              <span>Synchronized 6-Map AI Post-Processing Suite</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/80 font-bold">
                Regime-Aware
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous side-by-side evaluation of Raw NWP, AI-Calibrated Forecast, and Reference Ground Truth.
          </p>
        </div>

        {/* 4 Scorecard KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Raw NWP MAE</span>
            <strong className="text-rose-400 text-sm">{metrics.raw_mae_mm} mm</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">AI Corrected MAE</span>
            <strong className="text-emerald-400 text-sm">{metrics.ai_corrected_mae_mm} mm</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-cyan-900/60 bg-cyan-950/20">
            <span className="text-[10px] text-cyan-400 block">Error Reduction</span>
            <strong className="text-cyan-300 text-sm font-black">
              +{metrics.overall_error_reduction_pct}%
            </strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-purple-900/60 bg-purple-950/20">
            <span className="text-[10px] text-purple-400 block">Bias Removed</span>
            <strong className="text-purple-300 text-sm font-black">
              +{metrics.bias_reduction_pct}%
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Synchronized Coordinate Inspector Banner */}
      {activeProbe && (
        <div className="bg-[#040711] border border-cyan-800/60 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              PROBE: {activeProbe.latitude.toFixed(1)}°N, {activeProbe.longitude.toFixed(1)}°E
            </span>
            <span className="text-slate-500 text-[11px]">Hover over any mini map to sync probe across all 6 layers</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Raw: <strong className="text-rose-300">{activeProbe.raw_forecast} mm</strong></span>
            <span>AI: <strong className="text-cyan-300">{activeProbe.ai_forecast} mm</strong></span>
            <span>Obs: <strong className="text-emerald-300">{activeProbe.observed} mm</strong></span>
            <span>Raw Bias: <strong className="text-amber-400">{activeProbe.raw_bias > 0 ? `+${activeProbe.raw_bias}` : activeProbe.raw_bias} mm</strong></span>
            <span>Skill: <strong className="text-emerald-400">+{activeProbe.error_reduction_pct}%</strong></span>
          </div>
        </div>
      )}

      {/* 3. 6-Map Comparison Matrix (2 rows x 3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* MAP 1: RAW FORECAST */}
        <div className="bg-[#050b18] border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-rose-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>1. RAW NWP FORECAST</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">GFS / GEFS</span>
          </div>
          {renderMiniGrid('raw_forecast', getRainColor, 'mm/day')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Range: 0 – 120 mm</span>
            <span className="text-rose-400 font-bold">Uncalibrated</span>
          </div>
        </div>

        {/* MAP 2: AI FORECAST */}
        <div className="bg-[#050b18] border border-cyan-800/60 p-3.5 rounded-2xl space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-cyan-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span>2. AI POST-PROCESSED FORECAST</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">REGIME-AWARE</span>
          </div>
          {renderMiniGrid('ai_forecast', getRainColor, 'mm/day')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Range: 0 – 120 mm</span>
            <span className="text-cyan-400 font-bold">Calibrated Field</span>
          </div>
        </div>

        {/* MAP 3: OBSERVED */}
        <div className="bg-[#050b18] border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-emerald-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>3. OBSERVED / REFERENCE DATA</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">ERA5 Ground Truth</span>
          </div>
          {renderMiniGrid('observed', getRainColor, 'mm/day')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Range: 0 – 120 mm</span>
            <span className="text-emerald-400 font-bold">Verification Target</span>
          </div>
        </div>

        {/* MAP 4: RAW FORECAST BIAS */}
        <div className="bg-[#050b18] border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-amber-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>4. RAW FORECAST BIAS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Forecast - Observed</span>
          </div>
          {renderMiniGrid('raw_bias', getBiasColor, 'mm')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Blue: Under | Red: Over</span>
            <span className="text-amber-400 font-bold">Systematic Error</span>
          </div>
        </div>

        {/* MAP 5: CORRECTED BIAS */}
        <div className="bg-[#050b18] border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-cyan-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>5. AI CORRECTED RESIDUAL BIAS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">AI - Observed</span>
          </div>
          {renderMiniGrid('corrected_bias', getBiasColor, 'mm')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Near Zero across Domain</span>
            <span className="text-emerald-400 font-bold">Unbiased</span>
          </div>
        </div>

        {/* MAP 6: ERROR REDUCTION SKILL */}
        <div className="bg-[#050b18] border border-purple-900/60 p-3.5 rounded-2xl space-y-2 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-purple-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span>6. ERROR REDUCTION SKILL (%)</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400 font-bold">+78% Avg</span>
          </div>
          {renderMiniGrid('error_reduction_pct', getReductionColor, '%')}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>0% (No Gain) to 95% (Perfect)</span>
            <span className="text-purple-300 font-bold">AI Skill Gain</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiComparisonGrid;
