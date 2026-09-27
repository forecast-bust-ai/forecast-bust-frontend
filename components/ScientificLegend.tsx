'use client';

import React from 'react';
import { LayerMetadataItem } from '@/types/meteorology';
import { Sliders } from 'lucide-react';

interface ScientificLegendProps {
  layer: LayerMetadataItem;
  statistics?: {
    min: number;
    max: number;
    mean: number;
    p90: number;
  };
  opacity: number;
  onOpacityChange: (val: number) => void;
  pressureLevel?: number;
  onPressureLevelChange?: (level: number) => void;
  threshold?: number;
  onThresholdChange?: (th: number) => void;
}

export const getPaletteGradient = (palette: string): string => {
  switch (palette) {
    case 'rain':
      return 'linear-gradient(to right, #0369a1, #06b6d4, #10b981, #facc15, #f97316, #ef4444, #d946ef)';
    case 'convective':
      return 'linear-gradient(to right, #38bdf8, #34d399, #fbbf24, #f87171, #c084fc)';
    case 'thermal':
      return 'linear-gradient(to right, #1e3a8a, #0284c7, #22c55e, #eab308, #ef4444, #a855f7)';
    case 'wind_jet':
      return 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #f43f5e)';
    case 'pressure':
      return 'linear-gradient(to right, #4c1d95, #2563eb, #06b6d4, #10b981, #eab308, #dc2626)';
    case 'humidity':
      return 'linear-gradient(to right, #ca8a04, #e2e8f0, #38bdf8, #0284c7, #1e3a8a)';
    case 'cape':
      return 'linear-gradient(to right, #1e293b, #22c55e, #eab308, #ea580c, #dc2626, #d946ef)';
    case 'cin':
      return 'linear-gradient(to right, #1e293b, #94a3b8, #f59e0b, #e11d48)';
    case 'lifted_index':
      return 'linear-gradient(to right, #dc2626, #f97316, #eab308, #22c55e, #0284c7)';
    case 'probability':
      return 'linear-gradient(to right, #10b981, #facc15, #f97316, #ef4444, #881337)';
    case 'diverging_bias':
    case 'diverging_temp':
    case 'diverging_wind':
    case 'diverging_rain':
    case 'diverging_pressure':
    case 'diverging_vorticity':
    case 'diverging_omega':
      return 'linear-gradient(to right, #2563eb, #93c5fd, #f8fafc, #fca5a5, #dc2626)';
    case 'cloud':
    case 'visibility':
      return 'linear-gradient(to right, #0f172a, #475569, #94a3b8, #e2e8f0, #ffffff)';
    case 'infrared':
      return 'linear-gradient(to right, #450a0a, #dc2626, #f59e0b, #10b981, #06b6d4, #3b82f6, #ffffff)';
    case 'solar':
      return 'linear-gradient(to right, #0f172a, #854d0e, #ca8a04, #facc15, #ffffff)';
    case 'skill_score':
      return 'linear-gradient(to right, #94a3b8, #38bdf8, #10b981, #059669)';
    case 'uncertainty':
      return 'linear-gradient(to right, #1e293b, #6366f1, #a855f7, #ec4899, #f59e0b)';
    case 'monsoon_regime':
      return 'linear-gradient(to right, #f43f5e, #fbbf24, #38bdf8, #10b981)';
    default:
      return 'linear-gradient(to right, #0284c7, #10b981, #facc15, #ef4444)';
  }
};

export const getColorForValue = (val: number, layer: LayerMetadataItem): string => {
  const min = layer.min;
  const max = layer.max;
  const norm = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));

  const p = layer.palette;
  if (p === 'rain' || p === 'convective') {
    if (val < 1.0) return '#0369a1';
    if (val < 10.0) return '#06b6d4';
    if (val < 25.0) return '#10b981';
    if (val < 50.0) return '#facc15';
    if (val < 100.0) return '#f97316';
    if (val < 150.0) return '#ef4444';
    return '#d946ef';
  } else if (p === 'thermal') {
    if (val < 20.0) return '#0284c7';
    if (val < 28.0) return '#22c55e';
    if (val < 34.0) return '#facc15';
    if (val < 38.0) return '#f97316';
    if (val < 42.0) return '#ef4444';
    return '#a855f7';
  } else if (p === 'wind_jet') {
    if (val < 10.0) return '#06b6d4';
    if (val < 18.0) return '#3b82f6';
    if (val < 26.0) return '#8b5cf6';
    if (val < 35.0) return '#ec4899';
    return '#f43f5e';
  } else if (p === 'cape') {
    if (val < 500) return '#334155';
    if (val < 1500) return '#22c55e';
    if (val < 2500) return '#facc15';
    if (val < 3500) return '#f97316';
    return '#d946ef';
  } else if (p === 'probability') {
    if (val < 20) return '#10b981';
    if (val < 45) return '#facc15';
    if (val < 70) return '#f97316';
    if (val < 85) return '#ef4444';
    return '#881337';
  } else if (p.startsWith('diverging')) {
    if (val < -5) return '#2563eb';
    if (val < -1) return '#93c5fd';
    if (val <= 1) return '#cbd5e1';
    if (val < 5) return '#fca5a5';
    return '#dc2626';
  } else if (p === 'skill_score') {
    if (val < 30) return '#94a3b8';
    if (val < 60) return '#38bdf8';
    if (val < 80) return '#10b981';
    return '#059669';
  }

  // Fallback linear
  if (norm < 0.25) return '#0284c7';
  if (norm < 0.5) return '#10b981';
  if (norm < 0.75) return '#facc15';
  return '#ef4444';
};

export const ScientificLegend: React.FC<ScientificLegendProps> = ({
  layer,
  statistics,
  opacity,
  onOpacityChange,
  pressureLevel = 850,
  onPressureLevelChange,
  threshold = 25,
  onThresholdChange,
}) => {
  const gradient = getPaletteGradient(layer.palette);

  return (
    <div className="bg-[#0b1222]/95 border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-3 min-w-[260px] max-w-[320px]">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-bold">
            {layer.category}
          </div>
          <h4 className="font-extrabold text-slate-100 text-xs truncate">{layer.name}</h4>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          {layer.units || 'dimensionless'}
        </span>
      </div>

      {/* Layer Description */}
      {layer.description && (
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{layer.description}</p>
      )}

      {/* Pressure Level Selector if applicable */}
      {layer.has_levels && onPressureLevelChange && (
        <div className="space-y-1 bg-[#070c18] p-2 rounded-xl border border-slate-800">
          <label className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Isobaric Pressure Level:</span>
            <strong className="text-cyan-400">{pressureLevel} hPa</strong>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[1000, 850, 700, 500, 300].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onPressureLevelChange(lvl)}
                className={`py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                  pressureLevel === lvl
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rainfall Threshold Selector if applicable */}
      {(layer.id.startsWith('prob_') || layer.id === 'threshold_custom') && onThresholdChange && (
        <div className="space-y-1 bg-[#070c18] p-2 rounded-xl border border-slate-800">
          <label className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Rainfall Threshold:</span>
            <strong className="text-amber-400">{threshold} mm</strong>
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[10, 25, 50, 100].map((th) => (
              <button
                key={th}
                onClick={() => onThresholdChange(th)}
                className={`py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                  threshold === th
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                &gt;{th}mm
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colorbar Gradient Bar */}
      <div className="space-y-1.5">
        <div
          className="h-3 w-full rounded-full border border-white/20 shadow-inner"
          style={{ background: gradient }}
        />
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{layer.min} {layer.units}</span>
          <span>{((layer.min + layer.max) / 2).toFixed(0)}</span>
          <span>{layer.max}+ {layer.units}</span>
        </div>
      </div>

      {/* Real Statistics Breakdown */}
      {statistics && (
        <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-800 text-[10px] font-mono">
          <div className="bg-[#070c18] p-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-slate-500 block">Min</span>
            <strong className="text-slate-200">{statistics.min}</strong>
          </div>
          <div className="bg-[#070c18] p-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-slate-500 block">Mean</span>
            <strong className="text-cyan-300">{statistics.mean}</strong>
          </div>
          <div className="bg-[#070c18] p-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-slate-500 block">P90</span>
            <strong className="text-amber-300">{statistics.p90}</strong>
          </div>
          <div className="bg-[#070c18] p-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-slate-500 block">Max</span>
            <strong className="text-rose-400">{statistics.max}</strong>
          </div>
        </div>
      )}

      {/* Layer Opacity Slider */}
      <div className="space-y-1 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>Layer Opacity</span>
          </span>
          <span className="text-slate-200 font-bold">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ScientificLegend;
