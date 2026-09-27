import { useState, useEffect, useCallback } from 'react';
import {
  ConfidenceMapResponse,
  ForecastMapResponse,
  ExplanationResponse,
  HealthResponse,
  ConfidenceMapPoint,
} from '@/types/api';
import {
  fetchHealth,
  fetchConfidenceMap,
  fetchForecastLayer,
  fetchExplanation,
} from '@/lib/api';

export function useForecastData() {
  const [leadTimeHours, setLeadTimeHours] = useState<number>(24);
  const [selectedPoint, setSelectedPoint] = useState<ConfidenceMapPoint | null>(null);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [confidenceMap, setConfidenceMap] = useState<ConfidenceMapResponse | null>(null);
  const [forecastMap, setForecastMap] = useState<ForecastMapResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Health
      const healthRes = await fetchHealth().catch(() => null);
      setHealth(healthRes);

      // 2. Fetch Explanation
      const explanationRes = await fetchExplanation().catch(() => null);
      setExplanation(explanationRes);

      // 3. Fetch Confidence Map & Forecast Layer for current lead time
      const [confRes, fcstRes] = await Promise.all([
        fetchConfidenceMap(leadTimeHours, 4),
        fetchForecastLayer(leadTimeHours, 4).catch(() => null),
      ]);

      setConfidenceMap(confRes);
      setForecastMap(fcstRes);

      // Auto-select initial hotspot point if none selected
      if (confRes && confRes.points && confRes.points.length > 0) {
        const sortedByRisk = [...confRes.points].sort(
          (a, b) => b.bust_probability - a.bust_probability
        );
        setSelectedPoint(sortedByRisk[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Forecast Bust AI backend.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [leadTimeHours]);

  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (!isMounted) return;
      await loadData();
    };
    execute();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  return {
    leadTimeHours,
    setLeadTimeHours,
    selectedPoint,
    setSelectedPoint,
    health,
    confidenceMap,
    forecastMap,
    explanation,
    loading,
    error,
    refetch: loadData,
  };
}
