'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { useForecastData } from '@/hooks/useForecastData';
import { predictBust } from '@/lib/api';
import { PredictionResponse } from '@/types/api';
import { FlaskConical, Play, Sparkles, ShieldCheck } from 'lucide-react';

export default function PredictLabPage() {
  const { health, loading } = useForecastData();

  const [leadTime, setLeadTime] = useState<number>(72);
  const [lat, setLat] = useState<number>(23.0);
  const [lon, setLon] = useState<number>(86.0);
  const [forecastPrecip, setForecastPrecip] = useState<number>(35.5);
  const [modelType, setModelType] = useState<'xgboost' | 'cnn'>('xgboost');

  const [result, setResult] = useState<PredictionResponse | null>({
    bust_probability: 0.585,
    confidence: 0.824,
    is_bust_predicted: true,
    risk_category: 'Moderate Risk',
    threshold_applied_mm: 11.053,
    timestamp: new Date().toISOString(),
  });
  const [predicting, setPredicting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setError(null);
    try {
      const res = await predictBust(
        {
          lead_time_hours: leadTime,
          latitude: lat,
          longitude: lon,
          forecast_precipitation: forecastPrecip,
        },
        modelType
      );
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inference request failed');
    } finally {
      setPredicting(false);
    }
  };

  const presetLocations = [
    { name: 'Purulia / Bankura Belt', lat: 23.0, lon: 86.0, precip: 35.5, lead: 72 },
    { name: 'Mumbai / Konkan Coast', lat: 19.07, lon: 72.87, precip: 85.0, lead: 48 },
    { name: 'Cherrapunji / Meghalaya', lat: 25.27, lon: 91.73, precip: 120.0, lead: 24 },
    { name: 'Bhubaneswar / Odisha Basin', lat: 20.29, lon: 85.82, precip: 45.0, lead: 96 },
    { name: 'New Delhi / Gangetic Plain', lat: 28.61, lon: 77.20, precip: 15.0, lead: 120 },
  ];

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between">
      <div>
        <Header health={health} loading={loading} />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Header Bar */}
          <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50 shadow-inner">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
                  <span>Interactive Forecaster Prediction Lab</span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono">
                    Real-Time Point Inference
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Simulate ad-hoc numerical weather forecasts across India and obtain real-time bust risk classifications.
                </p>
              </div>
            </div>

            {/* Presets dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Preset Hotspots:</span>
              <select
                onChange={(e) => {
                  const loc = presetLocations[parseInt(e.target.value, 10)];
                  if (loc) {
                    setLat(loc.lat);
                    setLon(loc.lon);
                    setForecastPrecip(loc.precip);
                    setLeadTime(loc.lead);
                  }
                }}
                className="bg-[#070c18] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {presetLocations.map((loc, idx) => (
                  <option key={loc.name} value={idx}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Lab Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Input Form Column (6 cols) */}
            <form
              onSubmit={handleRunInference}
              className="lg:col-span-6 bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Forecast Parameters</span>
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">NWP Input Schema</span>
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block font-mono">
                  Model Architecture
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModelType('xgboost')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      modelType === 'xgboost'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-[#070c18] text-slate-400 border-slate-800'
                    }`}
                  >
                    XGBoost Baseline (Production)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('cnn')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      modelType === 'cnn'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-[#070c18] text-slate-400 border-slate-800'
                    }`}
                  >
                    Spatial CNN ResNet (Deep)
                  </button>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-mono">
                    Latitude (°N) [0° to 40°]
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="40"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full bg-[#070c18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-mono">
                    Longitude (°E) [60° to 100°]
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="60"
                    max="100"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value))}
                    className="w-full bg-[#070c18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Precipitation & Lead Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-mono">
                    Forecast Rainfall (mm/24h)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    value={forecastPrecip}
                    onChange={(e) => setForecastPrecip(parseFloat(e.target.value))}
                    className="w-full bg-[#070c18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-mono">
                    Lead Time (Hours)
                  </label>
                  <select
                    value={leadTime}
                    onChange={(e) => setLeadTime(parseInt(e.target.value, 10))}
                    className="w-full bg-[#070c18] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {[24, 48, 72, 96, 120, 144, 168, 192, 216, 240].map((h) => (
                      <option key={h} value={h}>
                        +{h}h (Day {Math.ceil(h / 24)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={predicting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
              >
                <Play className={`w-4 h-4 fill-current ${predicting ? 'animate-spin' : ''}`} />
                <span>{predicting ? 'Computing Inference...' : 'Execute Bust Risk Inference'}</span>
              </button>
            </form>

            {/* Results Column (6 cols) */}
            <div className="lg:col-span-6 bg-[#0b1222]/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Model Output</span>
                </h2>
                {result && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black border ${
                      result.bust_probability >= 0.6
                        ? 'bg-rose-950/80 text-rose-400 border-rose-800/80'
                        : result.bust_probability >= 0.3
                        ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                    }`}
                  >
                    {result.risk_category}
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-mono">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Probability Hero */}
                  <div className="bg-[#070c18] p-4 rounded-xl border border-slate-800 text-center space-y-1">
                    <span className="text-xs text-slate-400 uppercase font-mono block">Forecast Bust Probability</span>
                    <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono">
                      {(result.bust_probability * 100).toFixed(1)}%
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Model Decision: {result.is_bust_predicted ? '⚠️ Potential Bust Expected' : '✅ Reliable Forecast'}
                    </span>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Certainty / Confidence</span>
                      <strong className="text-cyan-300 text-lg font-mono">
                        {(result.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="bg-[#070c18] p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Applied Threshold</span>
                      <strong className="text-slate-200 text-lg font-mono">
                        {result.threshold_applied_mm.toFixed(2)} mm
                      </strong>
                    </div>
                  </div>

                  {/* JSON Output Viewer */}
                  <div className="bg-[#040711] p-3 rounded-xl border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
                      <span>API Response Payload</span>
                      <span className="text-emerald-400">200 OK</span>
                    </div>
                    <pre className="text-cyan-300/90">{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-900/90 bg-[#040711] py-3 mt-6">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          Prediction Lab • REST API `/api/v1/predict` • NCMRWF
        </div>
      </footer>
    </div>
  );
}
