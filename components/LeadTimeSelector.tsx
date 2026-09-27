'use client';

import React, { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

interface LeadTimeSelectorProps {
  selectedHours: number;
  onSelectLeadTime: (hours: number) => void;
}

export const LeadTimeSelector: React.FC<LeadTimeSelectorProps> = ({
  selectedHours,
  onSelectLeadTime,
}) => {
  const [showExtended, setShowExtended] = useState<boolean>(false);

  const mainDays = [
    {
      day: 'DAY 1',
      hours: 24,
      forecast: '+24h Forecast',
      risk: 'Risk: Low (18%)',
      riskColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 border-emerald-800/30',
    },
    {
      day: 'DAY 2',
      hours: 48,
      forecast: '+48h Forecast',
      risk: 'Risk: Moderate (34%)',
      riskColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 border-emerald-800/30',
    },
    {
      day: 'DAY 3',
      hours: 72,
      forecast: '+72h Forecast',
      risk: 'Risk: Elevated (58.5%)',
      riskColor: 'text-amber-400',
      badgeBg: 'bg-amber-950/50 border-amber-800/50',
    },
    {
      day: 'DAY 4',
      hours: 96,
      forecast: '+96h Forecast',
      risk: 'Risk: High (71%)',
      riskColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40 border-rose-800/30',
    },
    {
      day: 'DAY 5',
      hours: 120,
      forecast: '+120h Forecast',
      risk: 'Risk: Critical (84%)',
      riskColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40 border-rose-800/30',
    },
  ];

  const extendedDays = [
    { day: 'DAY 6', hours: 144, forecast: '+144h Forecast', risk: 'Risk: 88%', riskColor: 'text-rose-400' },
    { day: 'DAY 7', hours: 168, forecast: '+168h Forecast', risk: 'Risk: 91%', riskColor: 'text-rose-400' },
    { day: 'DAY 8', hours: 192, forecast: '+192h Forecast', risk: 'Risk: 93%', riskColor: 'text-rose-400' },
    { day: 'DAY 9', hours: 216, forecast: '+216h Forecast', risk: 'Risk: 94%', riskColor: 'text-rose-400' },
    { day: 'DAY 10', hours: 240, forecast: '+240h Forecast', risk: 'Risk: 96%', riskColor: 'text-rose-400' },
  ];

  const currentDayIndex = Math.max(0, mainDays.findIndex((d) => d.hours === selectedHours));

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/70">
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2 text-slate-200">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-bold tracking-tight">
              Forecast Lead-Time Window
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              (Evaluation Cycle: 00Z)
            </span>
          </div>

          <div className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[11px] font-semibold text-cyan-400">
            Select lead-time to simulate forecast evolution
          </div>
        </div>

        {/* Lead Time Scrubber & Extended Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-[11px] font-mono">Scrubber:</span>
            <input
              type="range"
              min="0"
              max={showExtended ? 9 : 4}
              step="1"
              value={
                showExtended
                  ? [...mainDays, ...extendedDays].findIndex((d) => d.hours === selectedHours) >= 0
                    ? [...mainDays, ...extendedDays].findIndex((d) => d.hours === selectedHours)
                    : 0
                  : currentDayIndex >= 0
                  ? currentDayIndex
                  : 0
              }
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                const list = showExtended ? [...mainDays, ...extendedDays] : mainDays;
                if (list[idx]) {
                  onSelectLeadTime(list[idx].hours);
                }
              }}
              className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowExtended(!showExtended)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1 font-semibold group"
          >
            <span>{showExtended ? 'Collapse to Day 1–5' : 'Expand to Day 10 (Experimental)'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transform transition-transform group-hover:translate-x-0.5 ${
                showExtended ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Days Grid (Day 1 - 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {mainDays.map((item) => {
          const isSelected = selectedHours === item.hours;
          return (
            <div key={item.hours} className="relative">
              {isSelected && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-lg shadow-cyan-500/50">
                    Active Focus
                  </span>
                </div>
              )}
              <button
                onClick={() => onSelectLeadTime(item.hours)}
                className={`w-full h-full flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#0b2138] to-[#081729] border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400 scale-[1.02]'
                    : 'bg-[#080e1a] text-slate-300 border-slate-800/90 hover:border-slate-700 hover:bg-[#0c1424]'
                }`}
              >
                <span className="text-xs sm:text-sm font-extrabold tracking-wide">
                  {item.day}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {item.forecast}
                </span>
                <div
                  className={`mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeBg} ${item.riskColor}`}
                >
                  {item.risk}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Extended Days Row (Day 6 - 10) */}
      {showExtended && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {extendedDays.map((item) => {
              const isSelected = selectedHours === item.hours;
              return (
                <button
                  key={item.hours}
                  onClick={() => onSelectLeadTime(item.hours)}
                  className={`w-full flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400'
                      : 'bg-[#080e1a]/80 text-slate-400 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{item.day}</span>
                  <span className="text-[10px] text-slate-500">{item.forecast}</span>
                  <span className={`text-[10px] font-semibold mt-1 ${item.riskColor}`}>
                    {item.risk}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
