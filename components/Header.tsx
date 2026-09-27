'use client';

import React, { useState } from 'react';
import { Activity, Cpu, Bell, Download, Settings, ChevronDown, Check } from 'lucide-react';
import { HealthResponse } from '@/types/api';
import { Navbar } from './Navbar';

interface HeaderProps {
  health: HealthResponse | null;
  loading: boolean;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  loading,
  selectedModel = 'xgboost',
  onSelectModel = () => {},
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const isHealthy = health?.status === 'ok' && health?.model_loaded;

  const models = [
    { id: 'xgboost', name: 'XGBoost Ensemble v2.4', type: 'Production Baseline' },
    { id: 'cnn', name: 'Spatial CNN ResNet-18', type: 'Deep Learning' },
    { id: 'gfs_raw', name: 'Deterministic GFS Raw', type: 'Uncalibrated NWP' },
  ];

  const currentModelName =
    models.find((m) => m.id === selectedModel)?.name || 'XGBoost Ensemble v2.4';

  return (
    <div className="sticky top-0 z-50">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Organization Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                Forecast Bust AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-950/90 text-cyan-400 border border-cyan-800/60 uppercase tracking-wide">
                SIH #26079
              </span>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                Operational v2.4
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              NCMRWF / Ministry of Earth Sciences (MoES) • Medium-Range NWP Confidence Indicator
            </p>
          </div>
        </div>

        {/* Action Controls & System Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors shadow-inner"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model: <span className="text-cyan-300">{currentModelName}</span></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-xl">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Select Inference Architecture
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-800/70 transition-colors ${
                      selectedModel === m.id ? 'bg-cyan-950/50 text-cyan-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div>{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.type}</div>
                    </div>
                    {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Backend Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                loading
                  ? 'bg-amber-400 animate-ping'
                  : isHealthy
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="font-semibold text-slate-200 text-xs">
              {loading
                ? 'Connecting...'
                : isHealthy
                ? 'FastAPI Backend Online'
                : 'API Disconnected'}
            </span>
            {isHealthy && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 font-mono">
                34ms
              </span>
            )}
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center space-x-1 pl-1">
            <button
              title="System Alerts"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            </button>
            <button
              title="Export Gridded Diagnostics"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              title="Diagnostic Settings"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
    <Navbar />
  </div>
);
};
