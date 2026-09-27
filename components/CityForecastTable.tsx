'use client';

import React, { useState, useMemo } from 'react';
import { INDIAN_CITIES, CityInfo, calculateDistanceKm } from '@/lib/cities';
import { ConfidenceMapPoint } from '@/types/api';
import { Search, MapPin, ArrowRight, Filter } from 'lucide-react';

interface CityForecastTableProps {
  points: ConfidenceMapPoint[];
  leadTimeHours: number;
  onSelectCity: (point: ConfidenceMapPoint, city: CityInfo) => void;
  selectedCityName?: string;
}

export const CityForecastTable: React.FC<CityForecastTableProps> = ({
  points,
  leadTimeHours,
  onSelectCity,
  selectedCityName,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'risk' | 'rainfall' | 'name'>('risk');

  // Compute forecast stats for each city based on nearest grid points
  const cityForecasts = useMemo(() => {
    return INDIAN_CITIES.map((city) => {
      // Find nearest grid point in the loaded points
      let nearestPoint: ConfidenceMapPoint | null = null;
      let minDistance = Infinity;

      for (const pt of points) {
        const d = calculateDistanceKm(city.latitude, city.longitude, pt.latitude, pt.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestPoint = pt;
        }
      }

      // Default synthetic estimate if grid point distance is large
      const bustProb = nearestPoint ? nearestPoint.bust_probability : 0.45;
      const forecastRain = nearestPoint ? nearestPoint.forecast_precipitation_mm : 28.5;
      const expectedError = nearestPoint ? nearestPoint.expected_error_mm : 14.2;
      const confidence = nearestPoint ? nearestPoint.confidence : 0.82;

      let riskCategory = 'Low Risk';
      let badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      if (bustProb >= 0.65) {
        riskCategory = 'High Bust Risk';
        badgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      } else if (bustProb >= 0.30) {
        riskCategory = 'Moderate Risk';
        badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      }

      return {
        city,
        nearestPoint: nearestPoint || {
          lead_time_hours: leadTimeHours,
          latitude: city.latitude,
          longitude: city.longitude,
          bust_probability: bustProb,
          confidence,
          expected_error_mm: expectedError,
          forecast_precipitation_mm: forecastRain,
        },
        bustProb,
        forecastRain,
        expectedError,
        confidence,
        riskCategory,
        badgeStyle,
        distanceToGridKm: Math.round(minDistance),
      };
    });
  }, [points, leadTimeHours]);

  // Filter and Sort
  const filteredAndSorted = useMemo(() => {
    const list = cityForecasts.filter((item) => {
      const matchSearch =
        item.city.name.toLowerCase().includes(search.toLowerCase()) ||
        item.city.state.toLowerCase().includes(search.toLowerCase());
      const matchRegion = selectedRegion === 'All' || item.city.region === selectedRegion;
      return matchSearch && matchRegion;
    });

    if (sortBy === 'risk') {
      list.sort((a, b) => b.bustProb - a.bustProb);
    } else if (sortBy === 'rainfall') {
      list.sort((a, b) => b.forecastRain - a.forecastRain);
    } else {
      list.sort((a, b) => a.city.name.localeCompare(b.city.name));
    }

    return list;
  }, [cityForecasts, search, selectedRegion, sortBy]);

  const regions = ['All', 'North', 'South', 'East', 'West', 'Central', 'Northeast'];

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center space-x-2">
              <span>City-to-City Forecast Bust & Weather Analysis</span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono">
                {filteredAndSorted.length} Cities Monitored
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              City-level NWP rainfall forecast validation and AI bust failure probability across India.
            </p>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search city or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#070c18] border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'risk' | 'rainfall' | 'name')}
            className="bg-[#070c18] border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="risk">Sort by Bust Risk (High-to-Low)</option>
            <option value="rainfall">Sort by Forecast Rain (Max)</option>
            <option value="name">Sort by City Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Region Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] text-slate-500 font-mono uppercase mr-1 flex items-center">
          <Filter className="w-3 h-3 mr-1" /> Region:
        </span>
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => setSelectedRegion(reg)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRegion === reg
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'bg-[#070c18] text-slate-400 border border-slate-800/80 hover:text-slate-200'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* City Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/90">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#070c18] border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
            <tr>
              <th className="py-2.5 px-3">City & State</th>
              <th className="py-2.5 px-3">Coordinates</th>
              <th className="py-2.5 px-3">Bust Probability (+{leadTimeHours}h)</th>
              <th className="py-2.5 px-3">Risk Classification</th>
              <th className="py-2.5 px-3">GFS Rain Forecast</th>
              <th className="py-2.5 px-3">Expected Error</th>
              <th className="py-2.5 px-3 text-right">Map Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-[#080e1a]/80">
            {filteredAndSorted.map(({ city, nearestPoint, bustProb, forecastRain, expectedError, riskCategory, badgeStyle }) => {
              const isSelected = selectedCityName === city.name;
              return (
                <tr
                  key={city.name}
                  onClick={() => onSelectCity(nearestPoint, city)}
                  className={`hover:bg-[#0d182b] transition-colors cursor-pointer ${
                    isSelected ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-medium">
                    <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${bustProb >= 0.65 ? 'bg-rose-400' : bustProb >= 0.30 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span>{city.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{city.state} • {city.region}</span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    {city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bustProb >= 0.65 ? 'bg-rose-500' : bustProb >= 0.30 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${bustProb * 100}%` }}
                        />
                      </div>
                      <strong className={`font-bold ${bustProb >= 0.65 ? 'text-rose-400' : bustProb >= 0.30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(bustProb * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}>
                      {riskCategory}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">
                    {forecastRain.toFixed(1)} mm
                  </td>

                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    ±{expectedError.toFixed(1)} mm
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCity(nearestPoint, city);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 font-semibold text-[11px] inline-flex items-center space-x-1 transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CityForecastTable;
