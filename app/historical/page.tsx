'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useForecastData } from '@/hooks/useForecastData';
import { History, Search } from 'lucide-react';

export default function HistoricalArchivePage() {
  const { health, loading } = useForecastData();
  const [searchTerm, setSearchTerm] = useState('');

  const caseStudies = [
    {
      id: 'case-2024-06',
      date: '2024-06-01',
      event: 'Monsoon Onset Deep Depression Bust',
      basin: 'Bay of Bengal & Gangetic West Bengal',
      leadTime: '+72h (Day 3)',
      gfsForecast: '42.5 mm',
      era5Observed: '98.2 mm',
      error: '+55.7 mm (Underforecast)',
      modelPredictedRisk: '87.4%',
      outcome: 'True Positive Hit',
      summary: 'GFS severely under-predicted convective intensification along the monsoonal trough due to parameterization lag. XGBoost flagged high bust risk at +72h.',
    },
    {
      id: 'case-2024-05',
      date: '2024-05-26',
      event: 'Severe Cyclone Remal Landfall Precipitation',
      basin: 'Odisha & West Bengal Coastal Belt',
      leadTime: '+48h (Day 2)',
      gfsForecast: '115.0 mm',
      era5Observed: '128.4 mm',
      error: '+13.4 mm (Normal error)',
      modelPredictedRisk: '22.1%',
      outcome: 'True Negative (Reliable)',
      summary: 'Deterministic track was accurate; error remained within acceptable tropical cyclone bounds.',
    },
    {
      id: 'case-2023-07',
      event: 'Northwest India Extreme Rainfall Burst',
      date: '2023-07-09',
      basin: 'Himachal & Western Himalayas',
      leadTime: '+96h (Day 4)',
      gfsForecast: '28.0 mm',
      era5Observed: '145.0 mm',
      error: '+117.0 mm (Severe Bust)',
      modelPredictedRisk: '91.8%',
      outcome: 'True Positive Hit',
      summary: 'Orographic interaction combined with Western Disturbance not resolved in 0.25° GFS grid; flagged as severe bust hotspot.',
    },
  ];

  const filtered = caseStudies.filter((c) =>
    c.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.basin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between">
      <div>
        <Header health={health} loading={loading} />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Top Banner */}
          <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50 shadow-inner">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
                  <span>Historical Bust Case Studies & Verification Archive</span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono">
                    ERA5 Reanalysis Ground Truth
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Comprehensive post-event evaluation comparing GFS medium-range predictions against ERA5 ground truth observations.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search event or basin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#070c18] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500 w-56 sm:w-64"
              />
            </div>
          </div>

          {/* Case Studies Cards */}
          <div className="space-y-3.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-mono">
                        {item.date}
                      </span>
                      <h2 className="text-sm font-extrabold text-slate-100">{item.event}</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.basin}</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      item.outcome.includes('True Positive')
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        : 'bg-blue-950/80 text-blue-300 border-blue-800/80'
                    }`}
                  >
                    {item.outcome}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Lead Time Horizon</span>
                    <strong className="text-slate-200 font-mono">{item.leadTime}</strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">GFS vs ERA5 Observed</span>
                    <strong className="text-cyan-300 font-mono">{item.gfsForecast} / {item.era5Observed}</strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Absolute Forecast Error</span>
                    <strong className="text-rose-400 font-mono">{item.error}</strong>
                  </div>

                  <div className="bg-[#070c18] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">AI Bust Risk Probability</span>
                    <strong className="text-amber-400 font-mono">{item.modelPredictedRisk}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#070c18]/60 p-3 rounded-xl border border-slate-800/60">
                  <strong className="text-cyan-400 font-semibold">Diagnostic Summary:</strong> {item.summary}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-900/90 bg-[#040711] py-3 mt-6">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          Historical Verification Archive • Forecast Bust AI • NCMRWF
        </div>
      </footer>
    </div>
  );
}
