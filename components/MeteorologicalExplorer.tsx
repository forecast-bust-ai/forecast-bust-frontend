'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CategoryItem,
  LayerMetadataItem,
  LayerDataResponse,
  VectorFieldResponse,
  PointProfileResponse,
  MonsoonRegimeResponse,
  EnsembleAnalysisResponse,
  AiComparisonResponse,
  ProviderStatusItem,
  ForecastConfidenceResponse,
  BustProbabilityResponse,
  ExpectedErrorResponse,
  ModelDisagreementResponse,
  ForecastExplanationResponse,
} from '@/types/meteorology';
import {
  fetchProviders,
  fetchLeadTimes,
  fetchLayerCategories,
  fetchLayerData,
  fetchVectorField,
  fetchPointProfile,
  fetchMonsoonRegime,
  fetchEnsembleAnalysis,
  fetchAiComparison,
  fetchForecastConfidence,
  fetchBustProbability,
  fetchExpectedError,
  fetchModelDisagreement,
  fetchExplanation,
} from '@/lib/meteorologyApi';
import { TopNavigationHeader, ViewMode } from '@/components/TopNavigationHeader';
import { LayerSidebar } from '@/components/LayerSidebar';
import { MeteorologicalMapLibre } from '@/components/MeteorologicalMapLibre';
import { ScientificLegend } from '@/components/ScientificLegend';
import { TimelineBar } from '@/components/TimelineBar';
import { AiComparisonGrid } from '@/components/AiComparisonGrid';
import { EnsembleUncertaintyPanel } from '@/components/EnsembleUncertaintyPanel';
import { ForecastBustDashboardPanel } from '@/components/ForecastBustDashboardPanel';
import { PointSoundingModal } from '@/components/PointSoundingModal';
import { AlertTriangle, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';

const BUST_PROB_METADATA: LayerMetadataItem = {
  id: 'bust_probability',
  name: 'Forecast Bust Probability',
  category: 'AI Analysis',
  units: '%',
  palette: 'probability',
  min: 0,
  max: 100,
  description: 'Calibrated probability of NWP model forecast failure exceeding operational tolerance threshold.',
};

const CONFIDENCE_METADATA: LayerMetadataItem = {
  id: 'forecast_confidence',
  name: 'Forecast Confidence Map',
  category: 'AI Analysis',
  units: '%',
  palette: 'skill_score',
  min: 0,
  max: 100,
  description: 'Multi-factor forecast reliability index factoring ensemble spread, model disagreement, and regime stability.',
};

export const MeteorologicalExplorer: React.FC = () => {
  // Global State
  const [providers, setProviders] = useState<ProviderStatusItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gefs');
  const [availableLeadTimes, setAvailableLeadTimes] = useState<number[]>([
    0, 6, 12, 24, 48, 72, 96, 120, 144, 168, 240,
  ]);
  const [leadTimeHours, setLeadTimeHours] = useState<number>(48);
  const [selectedRegion, setSelectedRegion] = useState<string>('india');
  const [viewMode, setViewMode] = useState<ViewMode>('bust_prediction');

  // Meteorological Layers State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerMetadataItem>({
    id: 'wind_500hpa',
    name: '500 hPa Wind',
    category: 'Wind',
    units: 'kts',
    palette: 'wind_jet',
    min: 0,
    max: 50,
    description: 'Mid-tropospheric steering wind speed at 500 hPa.',
  });

  // Layer Rendering Options
  const [opacity, setOpacity] = useState<number>(0.85);
  const [pressureLevel, setPressureLevel] = useState<number>(500);
  const [threshold, setThreshold] = useState<number>(25);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [bustDisplayMode, setBustDisplayMode] = useState<'bust_prob' | 'confidence'>('bust_prob');

  // Core Data Payloads
  const [layerData, setLayerData] = useState<LayerDataResponse | null>(null);
  const [vectorData, setVectorData] = useState<VectorFieldResponse | null>(null);
  const [regimeData, setRegimeData] = useState<MonsoonRegimeResponse | null>(null);
  const [ensembleData, setEnsembleData] = useState<EnsembleAnalysisResponse | null>(null);
  const [aiComparisonData, setAiComparisonData] = useState<AiComparisonResponse | null>(null);

  // Bust Prediction Payloads
  const [confidenceData, setConfidenceData] = useState<ForecastConfidenceResponse | null>(null);
  const [bustData, setBustData] = useState<BustProbabilityResponse | null>(null);
  const [expectedErrorData, setExpectedErrorData] = useState<ExpectedErrorResponse | null>(null);
  const [modelDisagreementData, setModelDisagreementData] = useState<ModelDisagreementResponse | null>(null);
  const [explanationData, setExplanationData] = useState<ForecastExplanationResponse | null>(null);

  // Point Inspection Sounding State
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lon: number } | null>({
    lat: 21.5,
    lon: 78.5,
  });
  const [pointProfile, setPointProfile] = useState<PointProfileResponse | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // In-memory Layer Cache
  const layerCacheRef = React.useRef<Map<string, LayerDataResponse>>(new Map());

  // 1. Initial Load: Providers & Categories
  useEffect(() => {
    async function initExplorer() {
      try {
        setLoading(true);
        const [provList, catList, timesList] = await Promise.all([
          fetchProviders().catch(() => []),
          fetchLayerCategories().catch(() => []),
          fetchLeadTimes('gefs').catch(() => [0, 6, 12, 24, 48, 72, 96, 120, 144, 168, 240]),
        ]);

        if (provList.length > 0) setProviders(provList);
        if (catList.length > 0) setCategories(catList);
        if (timesList.length > 0) setAvailableLeadTimes(timesList);
        setError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize meteorological data feed';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    initExplorer();
  }, []);

  // 2. Fetch Active Layer Data
  const loadActiveLayerData = useCallback(async () => {
    try {
      setLoading(true);
      const cacheKey = `${selectedModel}_${selectedLayer.id}_${leadTimeHours}_${pressureLevel}_${threshold}`;

      let data: LayerDataResponse;
      if (layerCacheRef.current.has(cacheKey)) {
        data = layerCacheRef.current.get(cacheKey)!;
      } else {
        data = await fetchLayerData(
          selectedLayer.id,
          leadTimeHours,
          pressureLevel,
          threshold,
          selectedModel,
          1
        );
        layerCacheRef.current.set(cacheKey, data);
      }

      setLayerData(data);
      setError(null);
    } catch (err: unknown) {
      console.error('Layer data fetch error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Layer fetch error for '${selectedLayer.name}': ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [selectedModel, selectedLayer, leadTimeHours, pressureLevel, threshold]);

  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (!isMounted) return;
      await loadActiveLayerData();
    };
    execute();
    return () => {
      isMounted = false;
    };
  }, [loadActiveLayerData]);

  // 3. Fetch Forecast Bust & Confidence Payloads
  useEffect(() => {
    async function loadBustPredictionData() {
      try {
        const lat = selectedCoord?.lat ?? 21.5;
        const lon = selectedCoord?.lon ?? 78.5;

        const [conf, bust, errField, mdi, expl, reg] = await Promise.all([
          fetchForecastConfidence(leadTimeHours, selectedModel, 2).catch(() => null),
          fetchBustProbability(leadTimeHours, selectedModel, 2).catch(() => null),
          fetchExpectedError(leadTimeHours, selectedModel, 2).catch(() => null),
          fetchModelDisagreement(leadTimeHours, selectedModel, 2).catch(() => null),
          fetchExplanation(lat, lon, leadTimeHours, selectedModel).catch(() => null),
          fetchMonsoonRegime(leadTimeHours, selectedModel).catch(() => null),
        ]);

        if (conf) setConfidenceData(conf);
        if (bust) setBustData(bust);
        if (errField) setExpectedErrorData(errField);
        if (mdi) setModelDisagreementData(mdi);
        if (expl) setExplanationData(expl);
        if (reg) setRegimeData(reg);
      } catch (err) {
        console.error('Bust prediction fetch error:', err);
      }
    }

    loadBustPredictionData();
  }, [leadTimeHours, selectedModel, selectedCoord]);

  // 4. Fetch Vector Field for Atmospheric Flow
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        const vectorVar = selectedLayer.id.startsWith('wind_')
          ? selectedLayer.id
          : `wind_${pressureLevel}hpa`;

        if (showVectors) {
          const vec = await fetchVectorField(vectorVar, leadTimeHours, pressureLevel, selectedModel, 2).catch(() => null);
          if (vec) setVectorData(vec);
        }
      } catch (err) {
        console.error('Vector data error:', err);
      }
    }

    loadAuxiliaryData();
  }, [selectedModel, selectedLayer, leadTimeHours, pressureLevel, showVectors]);

  // 5. Fetch Additional View Mode Data
  useEffect(() => {
    if (viewMode === 'ai_comparison') {
      fetchAiComparison(leadTimeHours, selectedModel, 2)
        .then((res) => setAiComparisonData(res))
        .catch((err) => console.error('AI comparison fetch error:', err));
    } else if (viewMode === 'ensemble_analysis') {
      fetchEnsembleAnalysis(leadTimeHours, threshold, selectedModel, 2)
        .then((res) => setEnsembleData(res))
        .catch((err) => console.error('Ensemble fetch error:', err));
    }
  }, [viewMode, leadTimeHours, threshold, selectedModel]);

  // 6. Fetch Point Sounding Profile
  useEffect(() => {
    if (selectedCoord) {
      fetchPointProfile(selectedCoord.lat, selectedCoord.lon, leadTimeHours, selectedModel)
        .then((res) => setPointProfile(res))
        .catch((err) => console.error('Point profile error:', err));
    }
  }, [selectedCoord, leadTimeHours, selectedModel]);

  // Synthetic LayerData for MapLibre in Forecast Bust mode
  const bustMapLayerData: LayerDataResponse | null = useMemo(() => {
    if (bustDisplayMode === 'bust_prob' && bustData) {
      const vals = bustData.points.map((p) => p.bust_probability_pct);
      return {
        layer_id: 'bust_probability',
        title: 'Calibrated Forecast Bust Probability',
        units: '%',
        palette: 'probability',
        lead_time_hours: leadTimeHours,
        level_hpa: pressureLevel,
        initialization_time: '2026-09-26T00:00:00Z',
        valid_time: '2026-09-28T00:00:00Z',
        grid_resolution_deg: bustData.grid_resolution_deg,
        bounding_box: { south: 0.0, north: 40.0, west: 60.0, east: 100.0 },
        statistics: {
          min: Math.min(...vals),
          max: Math.max(...vals),
          mean: bustData.mean_bust_probability_pct,
          p90: Math.round(Math.max(...vals) * 0.9),
        },
        total_points: bustData.total_points,
        points: bustData.points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          value: p.bust_probability_pct,
        })),
      };
    } else if (bustDisplayMode === 'confidence' && confidenceData) {
      const vals = confidenceData.points.map((p) => p.confidence_pct);
      return {
        layer_id: 'forecast_confidence',
        title: 'Forecast Confidence Index',
        units: '%',
        palette: 'skill_score',
        lead_time_hours: leadTimeHours,
        level_hpa: pressureLevel,
        initialization_time: '2026-09-26T00:00:00Z',
        valid_time: '2026-09-28T00:00:00Z',
        grid_resolution_deg: confidenceData.grid_resolution_deg,
        bounding_box: { south: 0.0, north: 40.0, west: 60.0, east: 100.0 },
        statistics: {
          min: Math.min(...vals),
          max: Math.max(...vals),
          mean: confidenceData.mean_confidence_pct,
          p90: Math.round(Math.max(...vals) * 0.9),
        },
        total_points: confidenceData.total_points,
        points: confidenceData.points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          value: p.confidence_pct,
        })),
      };
    }
    return layerData;
  }, [bustDisplayMode, bustData, confidenceData, layerData, leadTimeHours, pressureLevel]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#040813] text-slate-100 overflow-hidden font-sans">
      {/* 1. Top Operations Bar */}
      <TopNavigationHeader
        providers={providers}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        leadTimeHours={leadTimeHours}
        onSelectLeadTime={setLeadTimeHours}
        availableLeadTimes={availableLeadTimes}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        loading={loading}
      />

      {/* 2. Error Banner */}
      {error && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadActiveLayerData()}
            className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white font-mono flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 3. Main Operational Workspace */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Sidebar: Collapsible Meteorological Layers (in layer map view) */}
        {viewMode === 'single_layer' && (
          <LayerSidebar
            categories={categories}
            selectedLayerId={selectedLayer.id}
            onSelectLayer={(l) => {
              setSelectedLayer(l);
              const match = l.id.match(/(\d+)hpa/);
              if (match && match[1]) {
                setPressureLevel(parseInt(match[1], 10));
              }
            }}
            regimeData={regimeData}
            pressureLevel={pressureLevel}
            onPressureLevelChange={setPressureLevel}
            threshold={threshold}
            onThresholdChange={setThreshold}
            showVectors={showVectors}
            onToggleVectors={setShowVectors}
          />
        )}

        {/* Center Canvas: Interactive Map / Multi-Map Suites */}
        <main className="flex-1 flex flex-col min-w-0 space-y-3 overflow-y-auto">
          {viewMode === 'bust_prediction' ? (
            <div className="relative flex-1 w-full min-h-[480px]">
              {/* Primary Map: Forecast Bust / Confidence */}
              <MeteorologicalMapLibre
                layerData={bustMapLayerData}
                layerMetadata={bustDisplayMode === 'bust_prob' ? BUST_PROB_METADATA : CONFIDENCE_METADATA}
                vectorData={vectorData}
                showVectors={showVectors}
                opacity={opacity}
                selectedCoord={selectedCoord}
                onSelectCoord={setSelectedCoord}
                region={selectedRegion}
                loading={loading}
              />

              {/* Primary Bust/Confidence Floating Switcher (Top Center) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-[#0b1222]/90 border border-slate-800 rounded-2xl p-1 shadow-2xl backdrop-blur-md font-mono text-xs">
                <button
                  onClick={() => setBustDisplayMode('bust_prob')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    bustDisplayMode === 'bust_prob'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/80 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Bust Probability</span>
                </button>
                <button
                  onClick={() => setBustDisplayMode('confidence')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    bustDisplayMode === 'confidence'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Confidence Map</span>
                </button>
              </div>

              {/* Dynamic Scientific Legend Overlay (Bottom Right) */}
              <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <ScientificLegend
                  layer={bustDisplayMode === 'bust_prob' ? BUST_PROB_METADATA : CONFIDENCE_METADATA}
                  statistics={bustMapLayerData?.statistics}
                  opacity={opacity}
                  onOpacityChange={setOpacity}
                  pressureLevel={pressureLevel}
                  onPressureLevelChange={setPressureLevel}
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                />
              </div>
            </div>
          ) : viewMode === 'single_layer' ? (
            <div className="relative flex-1 w-full min-h-[480px]">
              {/* Interactive Layer Map */}
              <MeteorologicalMapLibre
                layerData={layerData}
                layerMetadata={selectedLayer}
                vectorData={vectorData}
                showVectors={showVectors}
                opacity={opacity}
                selectedCoord={selectedCoord}
                onSelectCoord={setSelectedCoord}
                region={selectedRegion}
                loading={loading}
              />

              {/* Dynamic Scientific Legend Overlay */}
              <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <ScientificLegend
                  layer={selectedLayer}
                  statistics={layerData?.statistics}
                  opacity={opacity}
                  onOpacityChange={setOpacity}
                  pressureLevel={pressureLevel}
                  onPressureLevelChange={setPressureLevel}
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                />
              </div>
            </div>
          ) : viewMode === 'ai_comparison' ? (
            <AiComparisonGrid comparisonData={aiComparisonData} loading={loading} />
          ) : (
            <EnsembleUncertaintyPanel
              ensembleData={ensembleData}
              leadTimeHours={leadTimeHours}
              threshold={threshold}
              onThresholdChange={setThreshold}
              loading={loading}
            />
          )}

          {/* Interactive Bottom Timeline Bar */}
          <div className="shrink-0">
            <TimelineBar
              availableLeadTimes={availableLeadTimes}
              selectedLeadTime={leadTimeHours}
              onSelectLeadTime={setLeadTimeHours}
              initializationTime={layerData?.initialization_time || '2026-09-26T00:00:00Z'}
            />
          </div>
        </main>

        {/* Right Sidebar: Dedicated Forecast Bust & Explainability Panel (in bust prediction mode) */}
        {viewMode === 'bust_prediction' && (
          <ForecastBustDashboardPanel
            confidenceData={confidenceData}
            bustData={bustData}
            expectedErrorData={expectedErrorData}
            modelDisagreementData={modelDisagreementData}
            explanationData={explanationData}
            regimeData={regimeData}
            selectedCoord={selectedCoord}
            leadTimeHours={leadTimeHours}
            loading={loading}
          />
        )}
      </div>

      {/* Point Sounding & Profile Side Modal */}
      {selectedCoord && (
        <PointSoundingModal
          pointProfile={pointProfile}
          onClose={() => setSelectedCoord(null)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default MeteorologicalExplorer;
