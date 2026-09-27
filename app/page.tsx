'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { LeadTimeSelector } from '@/components/LeadTimeSelector';
import { StatsOverview } from '@/components/StatsOverview';
import { WeatherMap } from '@/components/WeatherMap';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { CityForecastTable } from '@/components/CityForecastTable';
import { useForecastData } from '@/hooks/useForecastData';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string>('xgboost');

  const {
    leadTimeHours,
    setLeadTimeHours,
    selectedPoint,
    setSelectedPoint,
    health,
    confidenceMap,
    explanation,
    loading,
    error,
    refetch,
  } = useForecastData();

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <Header
          health={health}
          loading={loading}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* Main Content Area */}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          {/* Error Alert Box */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-4 rounded-2xl shadow-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">Backend API Connection Error</h3>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
                <p className="text-[11px] text-rose-400/80 mt-1">
                  Make sure the FastAPI backend is running locally on{' '}
                  <code className="bg-rose-900/50 px-1 py-0.5 rounded text-white">
                    http://127.0.0.1:8000
                  </code>
                </p>
              </div>
              <button
                onClick={refetch}
                className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* 1. Lead Time Window Selector */}
          <LeadTimeSelector
            selectedHours={leadTimeHours}
            onSelectLeadTime={setLeadTimeHours}
          />

          {/* 2. Key Summary Stats Overview (4 Cards) */}
          <StatsOverview
            confidenceMap={confidenceMap}
            leadTimeHours={leadTimeHours}
          />

          {/* 3. Main Grid Layout (Left: Map Area, Right: Explanation Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Map Column (7 cols on 12-col grid) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <WeatherMap
                points={confidenceMap?.points || []}
                selectedPoint={selectedPoint}
                onSelectPoint={setSelectedPoint}
                loading={loading}
                leadTimeHours={leadTimeHours}
              />
            </div>

            {/* Explanation & SHAP Insights Column (5 cols on 12-col grid) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <ExplanationPanel
                selectedPoint={selectedPoint}
                explanation={explanation}
              />
            </div>
          </div>

          {/* 4. City-to-City Forecast Bust Analysis Table */}
          <CityForecastTable
            points={confidenceMap?.points || []}
            leadTimeHours={leadTimeHours}
            onSelectCity={(pt) => setSelectedPoint(pt)}
          />
        </main>
      </div>

      {/* Modern Meteorology Mission-Control Footer */}
      <footer className="border-t border-slate-900/90 bg-[#040711] py-3.5 mt-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
          <p>
            © 2026 Forecast Bust AI • National Centre for Medium Range Weather Forecasting (NCMRWF)
          </p>
          <div className="flex items-center space-x-4">
            <span>Ensemble Members: <strong className="text-slate-300">21</strong></span>
            <span className="text-slate-700">|</span>
            <span>Loss: <strong className="text-slate-300">0.142 log-loss</strong></span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>Sync: Real-Time</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
