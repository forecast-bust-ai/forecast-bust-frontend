/**
 * Meteorological Forecast Explorer Frontend API Client.
 */

import {
  CategoryItem,
  LayerDataResponse,
  VectorFieldResponse,
  PointProfileResponse,
  MonsoonRegimeResponse,
  EnsembleAnalysisResponse,
  AiComparisonResponse,
  ProviderStatusItem,
} from '@/types/meteorology';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Network response was not ok');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProviders(): Promise<ProviderStatusItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/models`, { cache: 'no-store' });
  return handleResponse<ProviderStatusItem[]>(res);
}

export async function fetchLeadTimes(model: string = 'gefs'): Promise<number[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/times?model=${model}`, { cache: 'no-store' });
  return handleResponse<number[]>(res);
}

export async function fetchLayerCategories(): Promise<CategoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/layers`, { cache: 'no-store' });
  return handleResponse<CategoryItem[]>(res);
}

export async function fetchLayerData(
  layerId: string,
  leadTimeHours: number = 24,
  levelHpa: number = 850,
  thresholdMm: number = 25.0,
  model: string = 'gefs',
  stride: number = 1
): Promise<LayerDataResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    level_hpa: levelHpa.toString(),
    threshold_mm: thresholdMm.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/layer/${layerId}?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<LayerDataResponse>(res);
}

export async function fetchVectorField(
  vectorId: string = 'wind_850hpa',
  leadTimeHours: number = 24,
  levelHpa: number = 850,
  model: string = 'gefs',
  stride: number = 2
): Promise<VectorFieldResponse> {
  const params = new URLSearchParams({
    vector_id: vectorId,
    lead_time_hours: leadTimeHours.toString(),
    level_hpa: levelHpa.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/vectors/${vectorId}?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<VectorFieldResponse>(res);
}

export async function fetchPointProfile(
  latitude: number,
  longitude: number,
  leadTimeHours: number = 24,
  model: string = 'gefs'
): Promise<PointProfileResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    lead_time_hours: leadTimeHours.toString(),
    model,
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/point-profile?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<PointProfileResponse>(res);
}

export async function fetchMonsoonRegime(
  leadTimeHours: number = 24,
  model: string = 'gefs'
): Promise<MonsoonRegimeResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/regime?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<MonsoonRegimeResponse>(res);
}

export async function fetchEnsembleAnalysis(
  leadTimeHours: number = 24,
  thresholdMm: number = 25.0,
  model: string = 'gefs',
  stride: number = 2
): Promise<EnsembleAnalysisResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    threshold_mm: thresholdMm.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/ensemble?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<EnsembleAnalysisResponse>(res);
}

export async function fetchAiComparison(
  leadTimeHours: number = 24,
  model: string = 'gefs',
  stride: number = 2
): Promise<AiComparisonResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/ai-comparison?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<AiComparisonResponse>(res);
}

export async function fetchForecastConfidence(
  leadTimeHours: number = 24,
  model: string = 'gefs',
  stride: number = 2
): Promise<import('@/types/meteorology').ForecastConfidenceResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/confidence?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<import('@/types/meteorology').ForecastConfidenceResponse>(res);
}

export async function fetchBustProbability(
  leadTimeHours: number = 24,
  model: string = 'gefs',
  stride: number = 2
): Promise<import('@/types/meteorology').BustProbabilityResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/bust-probability?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<import('@/types/meteorology').BustProbabilityResponse>(res);
}

export async function fetchExpectedError(
  leadTimeHours: number = 24,
  model: string = 'gefs',
  stride: number = 2
): Promise<import('@/types/meteorology').ExpectedErrorResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/error?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<import('@/types/meteorology').ExpectedErrorResponse>(res);
}

export async function fetchModelDisagreement(
  leadTimeHours: number = 24,
  model: string = 'gefs',
  stride: number = 2
): Promise<import('@/types/meteorology').ModelDisagreementResponse> {
  const params = new URLSearchParams({
    lead_time_hours: leadTimeHours.toString(),
    model,
    stride: stride.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/model-disagreement?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<import('@/types/meteorology').ModelDisagreementResponse>(res);
}

export async function fetchExplanation(
  latitude: number = 21.5,
  longitude: number = 78.5,
  leadTimeHours: number = 24,
  model: string = 'gefs'
): Promise<import('@/types/meteorology').ForecastExplanationResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    lead_time_hours: leadTimeHours.toString(),
    model,
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/forecast/explanation?${params.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<import('@/types/meteorology').ForecastExplanationResponse>(res);
}

