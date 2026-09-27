import React from 'react';
import { PointProfileResponse } from '@/types/meteorology';
import { X, Layers } from 'lucide-react';

interface PointSoundingModalProps {
  pointProfile: PointProfileResponse | null;
  onClose: () => void;
  loading?: boolean;
}

export const PointSoundingModal: React.FC<PointSoundingModalProps> = ({
  pointProfile,
  onClose,
}) => {
  if (!pointProfile) return null;

  const { latitude, longitude, lead_time_hours, surface_metrics, ensemble_distribution, vertical_sounding } =
    pointProfile;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#070d1c]/98 border-l border-slate-800 shadow-2xl backdrop-blur-xl p-5 overflow-y-auto space-y-5 text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center space-x-2">
              <span>Point Sounding &amp; Profile</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                +{lead_time_hours}h
              </span>
            </h3>
            <p className="text-[11px] font-mono text-cyan-400">
              📍 {latitude.toFixed(2)}°N, {longitude.toFixed(2)}°E
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Surface Forecast Metrics */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Surface Rainfall &amp; Thermodynamics
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Raw NWP Rainfall</span>
            <strong className="text-rose-400 text-sm">
              {surface_metrics.raw_forecast_precip_mm} mm
            </strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-cyan-800/80 bg-cyan-950/20">
            <span className="text-[10px] text-cyan-400 block">AI Post-Processed</span>
            <strong className="text-cyan-300 text-sm font-black">
              {surface_metrics.ai_postprocessed_precip_mm} mm
            </strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Observed Reference</span>
            <strong className="text-emerald-400">
              {surface_metrics.observed_reference_precip_mm} mm
            </strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">2m Temperature</span>
            <strong className="text-amber-400">{surface_metrics.temperature_2m_c} °C</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">10m Wind Speed</span>
            <strong className="text-slate-200">{surface_metrics.surface_wind_kts} kts ({surface_metrics.wind_direction_deg}°)</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">MSLP</span>
            <strong className="text-slate-200">{surface_metrics.mslp_hpa} hPa</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Surface CAPE</span>
            <strong className="text-purple-400">{surface_metrics.cape_j_kg} J/kg</strong>
          </div>
          <div className="bg-[#040813] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Precipitable Water</span>
            <strong className="text-cyan-400">{surface_metrics.precipitable_water_mm} kg/m²</strong>
          </div>
        </div>
      </div>

      {/* Vertical Atmospheric Sounding Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          Vertical Atmospheric Profile (Sounding)
        </h4>
        <div className="bg-[#040813] border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-[#060c1c] text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-2 px-2.5">Level</th>
                <th className="py-2 px-2.5">Height</th>
                <th className="py-2 px-2.5">Wind</th>
                <th className="py-2 px-2.5 text-right">RH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vertical_sounding.map((lvl) => (
                <tr key={lvl.level_hpa} className="hover:bg-slate-900/60">
                  <td className="py-2 px-2.5 font-bold text-cyan-300">{lvl.level_hpa} hPa</td>
                  <td className="py-2 px-2.5 text-slate-400">{lvl.geopotential_height_gpm} gpm</td>
                  <td className="py-2 px-2.5 text-slate-200">{lvl.wind_speed_kts} kts</td>
                  <td className="py-2 px-2.5 text-right text-emerald-400 font-bold">
                    {lvl.relative_humidity_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ensemble 21-Member Dispersion Box Plot */}
      <div className="space-y-2 bg-[#040813] p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            21-Member Ensemble Spread
          </h4>
          <span className="text-[10px] font-mono text-slate-500">
            σ = ±{ensemble_distribution.std} mm
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
          <div className="bg-[#070c1a] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">P10</span>
            <strong className="text-emerald-400">{ensemble_distribution.p10} mm</strong>
          </div>
          <div className="bg-[#070c1a] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">P50 (Median)</span>
            <strong className="text-cyan-300">{ensemble_distribution.p50} mm</strong>
          </div>
          <div className="bg-[#070c1a] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">P90</span>
            <strong className="text-rose-400">{ensemble_distribution.p90} mm</strong>
          </div>
        </div>

        {/* Members Pill List */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-500 block font-mono">
            All 21 Ensemble Member Outputs (mm):
          </span>
          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
            {ensemble_distribution.members.map((val, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
              >
                M{idx + 1}: {val}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointSoundingModal;
