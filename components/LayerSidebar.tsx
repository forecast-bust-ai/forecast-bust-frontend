'use client';

import React, { useState } from 'react';
import {
  CategoryItem,
  LayerMetadataItem,
  MonsoonRegimeResponse,
} from '@/types/meteorology';
import {
  CloudRain,
  Thermometer,
  Wind,
  Gauge,
  Droplets,
  Zap,
  Cloud,
  Globe,
  Cpu,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  Layers,
} from 'lucide-react';

interface LayerSidebarProps {
  categories: CategoryItem[];
  selectedLayerId: string;
  onSelectLayer: (layer: LayerMetadataItem) => void;
  regimeData?: MonsoonRegimeResponse | null;
  pressureLevel: number;
  onPressureLevelChange: (lvl: number) => void;
  threshold: number;
  onThresholdChange: (th: number) => void;
  showVectors: boolean;
  onToggleVectors: (show: boolean) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Precipitation: CloudRain,
  Temperature: Thermometer,
  Wind: Wind,
  'Pressure & Atmosphere': Gauge,
  'Humidity & Moisture': Droplets,
  'Convective & Severe': Zap,
  'Clouds & Radiation': Cloud,
  Monsoon: Globe,
  'Ensemble & Uncertainty': Cpu,
  'AI Post-Processing': Sparkles,
};

export const LayerSidebar: React.FC<LayerSidebarProps> = ({
  categories,
  selectedLayerId,
  onSelectLayer,
  regimeData,
  pressureLevel,
  onPressureLevelChange,
  threshold,
  onThresholdChange,
  showVectors,
  onToggleVectors,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Precipitation: true,
    Monsoon: true,
    'AI Post-Processing': true,
  });

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // Filter categories and layers based on search term
  const filteredCategories = categories.map((cat) => {
    const matchingLayers = cat.layers.filter(
      (l) =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...cat,
      layers: matchingLayers,
    };
  }).filter((cat) => cat.layers.length > 0);

  return (
    <aside className="w-full lg:w-80 xl:w-88 flex flex-col bg-[#080e1e]/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden max-h-[calc(100vh-140px)]">
      {/* 1. Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-[#060b18] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">
              Meteorological Layers
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
            10 Categories
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search layers (e.g. CAPE, rain, Somali Jet)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#040711] border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 font-sans transition-colors"
          />
        </div>

        {/* Live Regime Classification Banner */}
        {regimeData && (
          <div className="bg-gradient-to-r from-[#0b172a] to-[#0d1f38] border border-cyan-900/60 p-2.5 rounded-xl shadow-inner flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                Detected Monsoon Regime
              </span>
              <span className="text-xs font-black text-slate-100 flex items-center space-x-1.5 mt-0.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: regimeData.regime_color }}
                />
                <span>{regimeData.detected_regime}</span>
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-[9px] text-slate-500 block">Confidence</span>
              <span className="text-xs font-extrabold text-emerald-400">
                {regimeData.confidence_pct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Global Streamlines & Vector Toggle */}
      <div className="px-4 py-2.5 bg-[#060b18]/60 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
        <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>Animated Streamlines</span>
        </span>
        <button
          onClick={() => onToggleVectors(!showVectors)}
          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
            showVectors
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
              : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
          }`}
        >
          {showVectors ? 'ACTIVE' : 'OFF'}
        </button>
      </div>

      {/* 2b. Quick Synoptic Controls */}
      {onPressureLevelChange && onThresholdChange && (
        <div className="px-4 py-2 bg-[#040813] border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono shrink-0">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Level:</span>
            <select
              value={pressureLevel ?? 850}
              onChange={(e) => onPressureLevelChange(parseInt(e.target.value, 10))}
              className="bg-[#070c18] border border-slate-800 text-cyan-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
            >
              {[1000, 925, 850, 700, 500, 300, 200].map((p) => (
                <option key={p} value={p}>{p} hPa</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Rain Thresh:</span>
            <select
              value={threshold ?? 10}
              onChange={(e) => onThresholdChange(parseInt(e.target.value, 10))}
              className="bg-[#070c18] border border-slate-800 text-cyan-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
            >
              {[5, 10, 25, 50, 100].map((t) => (
                <option key={t} value={t}>{t} mm</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Layer Accordions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category] || Layers;
          const isOpen = openCategories[cat.category] || searchTerm.length > 0;
          const hasSelected = cat.layers.some((l) => l.id === selectedLayerId);

          return (
            <div
              key={cat.category}
              className={`rounded-xl border transition-all ${
                hasSelected
                  ? 'border-cyan-800/60 bg-[#091124]/90'
                  : 'border-slate-800/70 bg-[#070c1a]/60 hover:border-slate-700'
              }`}
            >
              {/* Category Header Button */}
              <button
                onClick={() => toggleCategory(cat.category)}
                className="w-full flex items-center justify-between p-3 text-left transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      hasSelected
                        ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider truncate ${
                      hasSelected ? 'text-cyan-300 font-extrabold' : 'text-slate-200'
                    }`}
                  >
                    {cat.category}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {cat.layers.length}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Collapsible Layer List */}
              {isOpen && (
                <div className="px-2 pb-2.5 pt-0.5 space-y-1 border-t border-slate-800/60">
                  {cat.layers.map((layer) => {
                    const isSelected = layer.id === selectedLayerId;

                    return (
                      <button
                        key={layer.id}
                        onClick={() => onSelectLayer(layer)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all group ${
                          isSelected
                            ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-700/80 shadow-md font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]'
                                : 'bg-slate-700 group-hover:bg-slate-500'
                            }`}
                          />
                          <span className="text-xs truncate">{layer.name}</span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {layer.units && (
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                              {layer.units}
                            </span>
                          )}
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default LayerSidebar;
