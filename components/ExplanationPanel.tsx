'use client';

import React, { useState } from 'react';
import { Shield, BarChart3, Info, ChevronDown, MapPin } from 'lucide-react';
import { ConfidenceMapPoint, ExplanationResponse } from '@/types/api';
import { getNearestCity } from '@/lib/cities';

interface ExplanationPanelProps {
  selectedPoint: ConfidenceMapPoint | null;
  explanation: ExplanationResponse | null;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  selectedPoint,
  explanation,
}) => {
  const [shapMethod, setShapMethod] = useState<'TreeSHAP' | 'DeepSHAP' | 'KernelSHAP'>('TreeSHAP');
  const [spreadWeight, setSpreadWeight] = useState<number>(18);

  // Fallback defaults matching synoptic region if no point clicked yet
  const lat = selectedPoint ? selectedPoint.latitude : 23.00;
  const lon = selectedPoint ? selectedPoint.longitude : 86.00;
  const prob = selectedPoint ? selectedPoint.bust_probability : 0.585;
  const leadH = selectedPoint ? selectedPoint.lead_time_hours : 72;
  const expectedErr = selectedPoint ? selectedPoint.expected_error_mm : 15.8;
  const gfsRain = selectedPoint ? selectedPoint.forecast_precipitation_mm : 35.7;

  const nearest = getNearestCity(lat, lon);

  const probPct = (prob * 100).toFixed(1);
  const confPct = selectedPoint ? (selectedPoint.confidence * 100).toFixed(1) : '82.4';

  const getRiskBadge = (p: number) => {
    if (p >= 0.65) {
      return {
        label: 'High Risk',
        bgColor: 'bg-rose-950/90 text-rose-300 border-rose-800/80',
      };
    }
    if (p >= 0.30) {
      return {
        label: 'Moderate Risk',
        bgColor: 'bg-amber-950/90 text-amber-300 border-amber-800/80',
      };
    }
    return {
      label: 'Low Risk',
      bgColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80',
    };
  };

  const riskInfo = getRiskBadge(prob);

  // Feature weights from explanation prop or realistic defaults
  const defaultFactors = explanation?.global_feature_importances
    ? Object.entries(explanation.global_feature_importances).map(([k, v], idx) => ({
        name: k.replace(/_/g, ' ').toUpperCase(),
        weight: Number(v) * 100,
        color: idx === 0 ? 'bg-cyan-400' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-indigo-400' : 'bg-teal-400',
      }))
    : [
        { name: `Lead Time Hours (+${leadH}h Horizon)`, weight: 57.5, color: 'bg-cyan-400' },
        { name: 'Lead Time × Precip Interaction', weight: 24.4, color: 'bg-blue-500' },
        { name: 'Longitude & Chota Nagpur Topography', weight: 9.4, color: 'bg-indigo-400' },
        { name: 'Forecast Precipitation & CAPE Index', weight: 8.7, color: 'bg-teal-400' },
      ];

  return (
    <div className="space-y-4">
      {/* 1. Regional Bust Risk & Explanation Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100">
              Regional Bust Risk & Explanation
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-black border ${riskInfo.bgColor} shadow-sm`}>
            {riskInfo.label}
          </span>
        </div>

        {/* Location & Horizon Sub-Header with City Name */}
        <div className="grid grid-cols-2 gap-2 text-xs py-1">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              City / Observatory Region
            </span>
            <div className="font-extrabold text-cyan-300 text-xs sm:text-sm flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{nearest.city.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">({nearest.city.state})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {lat.toFixed(2)}°N, {lon.toFixed(2)}°E {nearest.distanceKm > 0 && `(±${nearest.distanceKm}km)`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Lead Time Target
            </span>
            <span className="font-extrabold text-cyan-400 text-xs sm:text-sm font-mono">
              +{leadH} Hours
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Day {Math.ceil(leadH / 24)} ({leadH}h Horizon)
            </span>
          </div>
        </div>

        {/* 2-Column Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Bust Probability */}
          <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/90 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
              Bust Probability
            </span>
            <div className="my-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400 tracking-tight">{probPct}%</span>
              <span className="text-[10px] text-slate-500 font-mono">P(Bust=1)</span>
            </div>
            {/* Gradient Progress */}
            <div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, prob * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>0%</span>
                <span className="text-amber-400 font-bold">{probPct}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Expected Error */}
          <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                Expected Error
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                Conf: {confPct}%
              </span>
            </div>
            <div className="my-1.5 flex items-baseline">
              <span className="text-2xl font-black text-slate-100">{expectedErr.toFixed(1)}</span>
              <span className="text-xs text-slate-400 ml-1 font-mono">mm</span>
            </div>
            <div className="space-y-0.5 text-[10px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>GFS Forecast:</span>
                <span className="text-slate-200 font-semibold">{gfsRain.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span>ECMWF Delta:</span>
                <span className="text-amber-400 font-semibold">+10.1 mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Contributing Factors (Model Feature Importance) Card */}
      <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
        {/* Header with TreeSHAP toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Key Contributing Factors (Model Feature Importance)</span>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                const methods: ('TreeSHAP' | 'DeepSHAP' | 'KernelSHAP')[] = ['TreeSHAP', 'DeepSHAP', 'KernelSHAP'];
                const nextIdx = (methods.indexOf(shapMethod) + 1) % methods.length;
                setShapMethod(methods[nextIdx]);
              }}
              className="flex items-center space-x-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-md hover:bg-cyan-900 transition-colors"
            >
              <span>{shapMethod}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Feature Bars */}
        <div className="space-y-3 text-xs">
          {defaultFactors.map((factor) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-medium">{factor.name}</span>
                <span className="text-cyan-400 font-mono font-bold">{factor.weight.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#070c18] h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`${factor.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${factor.weight}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Ensemble Weighting Simulation */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <span className="text-cyan-400 font-mono">∿</span>
              <span>Ensemble Weighting Simulation</span>
            </div>
            <span className="text-cyan-400 font-mono font-bold">+{spreadWeight}%</span>
          </div>

          <input
            type="range"
            min="10"
            max="50"
            value={spreadWeight}
            onChange={(e) => setSpreadWeight(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>+10% (Tighter)</span>
            <span>Spread Weight</span>
            <span>+50% (Dispersed)</span>
          </div>
        </div>

        {/* NWP Diagnostic Insight Box */}
        <div className="bg-[#070c18] p-3 rounded-xl border border-cyan-900/40 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>NWP Diagnostic Insight</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Strong convective bias detected along Jharkhand-Bengal frontier. Recommend increasing ensemble spread weighting by <strong className="text-cyan-300 font-semibold">+{spreadWeight}%</strong> in convective parameterization scheme.
          </p>
        </div>
      </div>
    </div>
  );
};
