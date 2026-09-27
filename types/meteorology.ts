/**
 * TypeScript Interfaces for Meteorological Forecast Explorer.
 */

export interface LayerMetadataItem {
  id: string;
  name: string;
  category: string;
  units: string;
  palette: string;
  min: number;
  max: number;
  description: string;
  has_levels?: boolean;
  icon?: string;
}

export interface CategoryItem {
  category: string;
  count: number;
  layers: LayerMetadataItem[];
}

export interface SpatialPoint {
  latitude: number;
  longitude: number;
  value: number;
}

export interface LayerDataResponse {
  layer_id: string;
  title: string;
  units: string;
  palette: string;
  lead_time_hours: number;
  level_hpa: number;
  initialization_time: string;
  valid_time: string;
  grid_resolution_deg: number;
  bounding_box: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  statistics: {
    min: number;
    max: number;
    mean: number;
    p90: number;
  };
  total_points: number;
  points: SpatialPoint[];
}

export interface VectorItem {
  latitude: number;
  longitude: number;
  u: number;
  v: number;
  speed_mps: number;
  speed_kts: number;
  direction_deg: number;
}

export interface VectorFieldResponse {
  vector_id: string;
  lead_time_hours: number;
  level_hpa: number;
  units: string;
  total_vectors: number;
  vectors: VectorItem[];
}

export interface SoundingLevel {
  level_hpa: number;
  geopotential_height_gpm: number;
  u_wind_mps: number;
  v_wind_mps: number;
  wind_speed_kts: number;
  relative_humidity_pct: number;
}

export interface PointProfileResponse {
  latitude: number;
  longitude: number;
  lead_time_hours: number;
  surface_metrics: {
    raw_forecast_precip_mm: number;
    ai_postprocessed_precip_mm: number;
    observed_reference_precip_mm: number;
    temperature_2m_c: number;
    surface_wind_kts: number;
    wind_direction_deg: number;
    mslp_hpa: number;
    cape_j_kg: number;
    cin_j_kg: number;
    precipitable_water_mm: number;
    cloud_cover_pct: number;
  };
  ensemble_distribution: {
    mean: number;
    std: number;
    p10: number;
    p50: number;
    p90: number;
    members: number[];
  };
  vertical_sounding: SoundingLevel[];
}

export interface RegimeIndicator {
  name: string;
  value: string;
  status: string;
}

export interface MonsoonRegimeResponse {
  lead_time_hours: number;
  detected_regime: string;
  confidence_pct: number;
  regime_color: string;
  description: string;
  webster_yang_index_mps: number;
  central_india_mean_rain_mm: number;
  bay_of_bengal_depression_prob_pct: number;
  mean_olr_w_m2: number;
  indicators: RegimeIndicator[];
}

export interface EnsemblePoint {
  latitude: number;
  longitude: number;
  mean: number;
  spread: number;
  p10: number;
  p50: number;
  p90: number;
  prob_exceedance: number;
}

export interface EnsembleAnalysisResponse {
  lead_time_hours: number;
  threshold_mm: number;
  total_members: number;
  overall_mean: number;
  overall_spread: number;
  total_points: number;
  points: EnsemblePoint[];
}

export interface ComparisonPoint {
  latitude: number;
  longitude: number;
  raw_forecast: number;
  ai_forecast: number;
  observed: number;
  raw_bias: number;
  corrected_bias: number;
  error_reduction_pct: number;
}

export interface AiComparisonResponse {
  lead_time_hours: number;
  metrics: {
    raw_mae_mm: number;
    ai_corrected_mae_mm: number;
    overall_error_reduction_pct: number;
    bias_reduction_pct: number;
  };
  total_points: number;
  points: ComparisonPoint[];
}

export interface ProviderStatusItem {
  provider_id: string;
  name: string;
  status: string;
  is_configured: boolean;
  initialization_time?: string;
  domain?: string;
  members?: number;
  resolution_deg?: number;
  vertical_levels_hpa?: number[];
}

export interface ForecastConfidencePoint {
  latitude: number;
  longitude: number;
  confidence_pct: number;
  bust_probability_pct: number;
  expected_error_mm: number;
  is_error_prone: boolean;
  category: string;
}

export interface ForecastConfidenceResponse {
  lead_time_hours: number;
  lead_day: number;
  mean_confidence_pct: number;
  high_confidence_area_pct: number;
  error_prone_area_pct: number;
  total_points: number;
  grid_resolution_deg: number;
  points: ForecastConfidencePoint[];
}

export interface BustProbabilityPoint {
  latitude: number;
  longitude: number;
  bust_probability_pct: number;
  risk_category: string;
  ensemble_spread_mm: number;
  model_disagreement_index: number;
}

export interface BustProbabilityResponse {
  lead_time_hours: number;
  lead_day: number;
  mean_bust_probability_pct: number;
  high_risk_points_count: number;
  total_points: number;
  grid_resolution_deg: number;
  points: BustProbabilityPoint[];
}

export interface ExpectedErrorPoint {
  latitude: number;
  longitude: number;
  expected_error_mm: number;
  forecast_precipitation_mm: number;
  ensemble_std_mm: number;
}

export interface ExpectedErrorResponse {
  lead_time_hours: number;
  lead_day: number;
  mean_expected_error_mm: number;
  max_expected_error_mm: number;
  units: string;
  total_points: number;
  points: ExpectedErrorPoint[];
}

export interface ModelDisagreementPoint {
  latitude: number;
  longitude: number;
  disagreement_index: number;
  gfs_ecmwf_diff_mm: number;
  max_model_spread_mm: number;
}

export interface ModelDisagreementResponse {
  lead_time_hours: number;
  lead_day: number;
  mean_disagreement_index: number;
  high_disagreement_area_pct: number;
  models_compared: string[];
  total_points: number;
  points: ModelDisagreementPoint[];
}

export interface ForecastExplanationResponse {
  latitude: number;
  longitude: number;
  lead_time_hours: number;
  lead_day: number;
  confidence_category: string;
  confidence_color: string;
  confidence_pct: number;
  bust_probability_pct: number;
  weather_regime: string;
  feature_attributions: Record<string, number>;
  meteorological_reasons: string[];
}

