'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface TimelineBarProps {
  availableLeadTimes: number[];
  selectedLeadTime: number;
  onSelectLeadTime: (hours: number) => void;
  initializationTime?: string;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  availableLeadTimes = [0, 6, 12, 24, 48, 72, 96, 120, 144, 168, 240],
  selectedLeadTime,
  onSelectLeadTime,
  initializationTime = '2026-09-26T00:00:00Z',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        const currentIdx = availableLeadTimes.indexOf(selectedLeadTime);
        const nextIdx = (currentIdx + 1) % availableLeadTimes.length;
        onSelectLeadTime(availableLeadTimes[nextIdx]);
      }, 1800);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, selectedLeadTime, availableLeadTimes, onSelectLeadTime]);

  const handleStepBack = () => {
    const currentIdx = availableLeadTimes.indexOf(selectedLeadTime);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : availableLeadTimes.length - 1;
    onSelectLeadTime(availableLeadTimes[prevIdx]);
  };

  const handleStepForward = () => {
    const currentIdx = availableLeadTimes.indexOf(selectedLeadTime);
    const nextIdx = (currentIdx + 1) % availableLeadTimes.length;
    onSelectLeadTime(availableLeadTimes[nextIdx]);
  };

  // Valid date calculation
  const formattedValid = React.useMemo(() => {
    const initDate = new Date(initializationTime || '2026-09-26T00:00:00Z');
    const validDate = new Date(initDate.getTime() + selectedLeadTime * 3600 * 1000);
    return validDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [initializationTime, selectedLeadTime]);

  return (
    <div className="bg-[#060b18]/95 border border-slate-800/90 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Play Controls & Step Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleStepBack}
          title="Step Backward"
          className="w-8 h-8 flex items-center justify-center bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Animation' : 'Play Timeline'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold transition-all ${
            isPlaying
              ? 'bg-rose-950 text-rose-300 border border-rose-700 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={handleStepForward}
          title="Step Forward"
          className="w-8 h-8 flex items-center justify-center bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <div className="hidden sm:flex items-center space-x-1.5 pl-2 border-l border-slate-800 font-mono text-[11px]">
          <span className="text-slate-500">Step:</span>
          <span className="text-cyan-400 font-extrabold">+{selectedLeadTime}h</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">{formattedValid}</span>
        </div>
      </div>

      {/* Discrete Lead Time Buttons / Timeline Scrubber */}
      <div className="flex-1 w-full flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none justify-start md:justify-center">
        {availableLeadTimes.map((hours) => {
          const isSelected = hours === selectedLeadTime;
          const day = (hours / 24).toFixed(hours % 24 === 0 ? 0 : 1);

          return (
            <button
              key={hours}
              onClick={() => onSelectLeadTime(hours)}
              className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold whitespace-nowrap transition-all flex flex-col items-center min-w-[48px] ${
                isSelected
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.35)] scale-105'
                  : 'bg-[#080f20] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <span>+{hours}h</span>
              <span className="text-[9px] text-slate-500 font-normal">D{day}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Init Stamp */}
      <div className="hidden lg:flex items-center space-x-1.5 font-mono text-[10px] text-slate-500 shrink-0">
        <Clock className="w-3 h-3 text-slate-600" />
        <span>Init: {initializationTime.slice(0, 10)} 00Z</span>
      </div>
    </div>
  );
};

export default TimelineBar;
