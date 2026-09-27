'use client';

import React from 'react';
import { ProviderStatusItem } from '@/types/meteorology';
import {
  Clock,
  MapPin,
  Sparkles,
  Layers,
  BarChart3,
  Calendar,
  Compass,
  ShieldAlert,
} from 'lucide-react';

export type ViewMode = 'bust_prediction' | 'single_layer' | 'ai_comparison' | 'ensemble_analysis';

interface TopNavigationHeaderProps {
  providers: ProviderStatusItem[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  leadTimeHours: number;
  onSelectLeadTime: (hours: number) => void;
  availableLeadTimes: number[];
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  loading?: boolean;
}

const REGIONS: { id: string; name: string; bounds: [number, number, number, number] }[] = [
  { id: 'india', name: '🇮🇳 All India (National Domain)', bounds: [67.0, 6.5, 98.0, 37.5] },
  { id: 'north_india', name: 'North India (Delhi, UP, Punjab, Himalayas)', bounds: [73.0, 26.0, 83.0, 36.0] },
  { id: 'central_india', name: 'Central India (MP, Maharashtra, Monsoon Trough)', bounds: [72.0, 18.0, 84.0, 26.0] },
  { id: 'south_india', name: 'South India & Western Ghats (Kerala, Karnataka, TN)', bounds: [73.0, 8.0, 81.0, 18.0] },
  { id: 'east_india', name: 'East India (Odisha, West Bengal, Bihar)', bounds: [81.0, 18.0, 90.0, 27.0] },
  { id: 'northeast', name: 'Northeast India (Assam, Meghalaya)', bounds: [88.0, 22.0, 97.5, 29.5] },
  { id: 'west_india', name: 'Northwest India (Rajasthan, Gujarat)', bounds: [68.0, 20.0, 77.0, 30.0] },
];

export const TopNavigationHeader: React.FC<TopNavigationHeaderProps> = ({
  providers,
  selectedModel,
  onSelectModel,
  leadTimeHours,
  onSelectLeadTime,
  availableLeadTimes,
  selectedRegion,
  onSelectRegion,
  viewMode,
  onSelectViewMode,
  loading = false,
}) => {
  const currentProvider = providers.find((p) => p.provider_id === selectedModel) || {
    provider_id: selectedModel,
    name: selectedModel.toUpperCase(),
    status: 'OPERATIONAL',
    is_configured: true,
  };

  // Compute Valid Time from now + lead time
  const now = new Date();
  const validDate = new Date(now.getTime() + leadTimeHours * 3600 * 1000);
  const formattedValidTime = `${validDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${validDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`;

  return (
    <header className="border-b border-slate-800 bg-[#060b18]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 shrink-0">
      <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 shadow-[0_0_16px_rgba(6,182,212,0.35)] text-white shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black text-slate-100 tracking-tight flex items-center space-x-2">
                <span>Meteorological Forecast Explorer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                  REGIME-AWARE AI
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Regime-Aware AI Post-Processing &amp; Multi-Model Monsoon Meteorological Analysis
            </p>
          </div>
        </div>

        {/* Center: Controls Bar (Model, Lead Time, Valid Time, Region, Data Source) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* 1. Forecast Model Selector */}
          <div className="flex items-center space-x-1.5 bg-[#091122] border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-slate-500 font-bold">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-cyan-300 font-extrabold focus:outline-none cursor-pointer pr-1"
            >
              {providers.map((p) => (
                <option key={p.provider_id} value={p.provider_id} className="bg-[#0b1222] text-slate-200">
                  {p.provider_id.toUpperCase()} ({p.name.split('(')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Forecast Time Selector */}
          <div className="flex items-center space-x-1.5 bg-[#091122] border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-bold">Time:</span>
            <select
              value={leadTimeHours}
              onChange={(e) => onSelectLeadTime(parseInt(e.target.value))}
              className="bg-transparent text-slate-100 font-extrabold focus:outline-none cursor-pointer pr-1"
            >
              {(availableLeadTimes.length > 0 ? availableLeadTimes : [0, 6, 12, 24, 48, 72, 96, 120, 144, 168, 240]).map((h) => (
                <option key={h} value={h} className="bg-[#0b1222] text-slate-200">
                  +{h}h (Day {(h / 24).toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Valid Time Display */}
          <div className="hidden md:flex items-center space-x-1.5 bg-[#091122] border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-bold">Valid:</span>
            <span className="text-slate-300">{formattedValidTime}</span>
          </div>

          {/* 4. Geographic Region Selector */}
          <div className="flex items-center space-x-1.5 bg-[#091122] border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-bold">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => onSelectRegion(e.target.value)}
              className="bg-transparent text-slate-200 font-extrabold focus:outline-none cursor-pointer pr-1"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0b1222] text-slate-200">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Provider Status Badge */}
          <div className="flex items-center space-x-1.5 bg-[#091122] border border-slate-800 px-2.5 py-1.5 rounded-xl">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'}`} />
            <span className="text-[10px] text-slate-300 font-bold">{loading ? 'SYNCING' : currentProvider.status}</span>
          </div>
        </div>

        {/* Right: View Mode Selector Tabs */}
        <div className="flex items-center space-x-1 bg-[#040813] border border-slate-800/90 p-1 rounded-2xl shadow-xl shrink-0">
          <button
            onClick={() => onSelectViewMode('bust_prediction')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'bust_prediction'
                ? 'bg-rose-950 text-rose-300 border border-rose-700/80 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Forecast Bust AI</span>
          </button>

          <button
            onClick={() => onSelectViewMode('single_layer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'single_layer'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layer Map</span>
          </button>

          <button
            onClick={() => onSelectViewMode('ai_comparison')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'ai_comparison'
                ? 'bg-purple-950 text-purple-300 border border-purple-700/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>6-Map AI Comparison</span>
          </button>

          <button
            onClick={() => onSelectViewMode('ensemble_analysis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'ensemble_analysis'
                ? 'bg-blue-950 text-blue-300 border border-blue-700/80 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ensemble Uncertainty</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavigationHeader;
