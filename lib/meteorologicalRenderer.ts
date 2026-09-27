/**
 * Meteorological Canvas Raster & Particle Rendering Utility.
 * Converts gridded scalar fields into geo-referenced raster images,
 * and executes real-time particle animation for vector wind fields.
 */

import { LayerDataResponse, LayerMetadataItem, VectorFieldResponse } from '@/types/meteorology';

/**
 * Color mapping table for scientific colormaps.
 */
function getRGBAForValue(val: number, palette: string, min: number, max: number): [number, number, number, number] {
  if (palette === 'wind_jet') {
    // Wind Speed Palette (kts)
    if (val < 6) return [6, 182, 212, 190];      // Cyan
    if (val < 14) return [59, 130, 246, 210];    // Blue
    if (val < 22) return [139, 92, 246, 225];    // Violet
    if (val < 32) return [236, 72, 153, 240];    // Magenta
    if (val < 45) return [244, 63, 94, 250];     // Rose Red
    return [225, 29, 72, 255];                   // Deep Crimson
  } else if (palette === 'rain' || palette === 'convective') {
    // Precipitation Palette (mm/day)
    if (val < 1.0) return [0, 0, 0, 0];          // Transparent for dry
    if (val < 5.0) return [56, 189, 248, 180];   // Light Sky Blue
    if (val < 15.0) return [34, 197, 94, 200];   // Emerald Green
    if (val < 35.0) return [250, 204, 21, 220];  // Amber Yellow
    if (val < 70.0) return [249, 115, 22, 235];  // Orange
    if (val < 120.0) return [239, 68, 68, 250];  // Red
    return [217, 70, 239, 255];                  // Fuchsia
  } else if (palette === 'thermal') {
    // 2m Temperature Palette (°C)
    if (val < 18) return [2, 132, 199, 200];     // Cool Blue
    if (val < 26) return [34, 197, 94, 200];     // Green
    if (val < 32) return [234, 179, 8, 220];     // Yellow
    if (val < 38) return [234, 88, 12, 235];     // Orange
    if (val < 44) return [220, 38, 38, 250];     // Hot Red
    return [168, 85, 247, 255];                  // Extreme Purple
  } else if (palette === 'cape') {
    // CAPE Instability (J/kg)
    if (val < 300) return [30, 41, 59, 120];     // Stable slate
    if (val < 1200) return [34, 197, 94, 200];   // Marginal green
    if (val < 2200) return [250, 204, 21, 225];  // Moderate yellow
    if (val < 3200) return [249, 115, 22, 240];  // High orange
    return [217, 70, 239, 255];                  // Severe fuchsia
  } else if (palette === 'pressure') {
    // MSLP (hPa)
    if (val < 998) return [76, 29, 149, 240];    // Low pressure deep violet
    if (val < 1004) return [37, 99, 235, 220];   // Blue
    if (val < 1008) return [6, 182, 212, 200];   // Cyan
    if (val < 1012) return [34, 197, 94, 200];   // Green
    if (val < 1016) return [234, 179, 8, 200];   // Yellow
    return [220, 38, 38, 220];                   // High pressure red
  } else if (palette === 'probability') {
    // Probability (%)
    if (val < 10) return [0, 0, 0, 0];
    if (val < 30) return [16, 185, 129, 180];    // Emerald
    if (val < 60) return [250, 204, 21, 210];    // Amber
    if (val < 85) return [249, 115, 22, 235];    // Orange
    return [225, 29, 72, 255];                   // High risk red
  } else if (palette.startsWith('diverging')) {
    // Anomaly fields
    if (val < -4) return [37, 99, 235, 220];     // Strong negative blue
    if (val < -1) return [147, 197, 253, 180];   // Light blue
    if (val <= 1) return [148, 163, 184, 80];    // Neutral gray
    if (val < 4) return [252, 165, 165, 180];    // Light red
    return [220, 38, 38, 220];                   // Strong positive red
  }

  // Linear fallback
  const norm = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
  return [
    Math.round(255 * norm),
    Math.round(255 * (1 - Math.abs(norm - 0.5) * 2)),
    Math.round(255 * (1 - norm)),
    200,
  ];
}

export interface RasterResult {
  url: string;
  coordinates: [[number, number], [number, number], [number, number], [number, number]];
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  width: number;
  height: number;
}

/**
 * Generate a geo-referenced raster image (Data URL + coordinates) from the 2D gridded points.
 */
export function generateMeteorologicalRaster(
  layerData: LayerDataResponse,
  layerMetadata: LayerMetadataItem
): RasterResult | null {
  if (typeof window === 'undefined' || !layerData || !layerData.points || layerData.points.length === 0) {
    return null;
  }

  const lats = Array.from(new Set(layerData.points.map((p) => p.latitude))).sort((a, b) => b - a); // North to South
  const lons = Array.from(new Set(layerData.points.map((p) => p.longitude))).sort((a, b) => a - b); // West to East

  const height = lats.length;
  const width = lons.length;
  if (height === 0 || width === 0) return null;

  const maxLat = lats[0];
  const minLat = lats[lats.length - 1];
  const minLon = lons[0];
  const maxLon = lons[lons.length - 1];

  // Build 2D grid lookup
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
  for (const pt of layerData.points) {
    const r = lats.indexOf(pt.latitude);
    const c = lons.indexOf(pt.longitude);
    if (r !== -1 && c !== -1) {
      grid[r][c] = pt.value;
    }
  }

  // Create High-Res Offscreen Canvas (upsampled x4 for smooth bilinear interpolation)
  const scale = 4;
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(canvasWidth, canvasHeight);
  const data = imgData.data;

  const palette = layerMetadata.palette || 'turbo';
  const min = layerData.statistics?.min ?? layerMetadata.min;
  const max = layerData.statistics?.max ?? layerMetadata.max;

  for (let y = 0; y < canvasHeight; y++) {
    const srcY = (y / (canvasHeight - 1)) * (height - 1);
    const y0 = Math.floor(srcY);
    const y1 = Math.min(height - 1, y0 + 1);
    const dy = srcY - y0;

    for (let x = 0; x < canvasWidth; x++) {
      const srcX = (x / (canvasWidth - 1)) * (width - 1);
      const x0 = Math.floor(srcX);
      const x1 = Math.min(width - 1, x0 + 1);
      const dx = srcX - x0;

      // Bilinear interpolation of grid value
      const v00 = grid[y0][x0];
      const v10 = grid[y0][x1];
      const v01 = grid[y1][x0];
      const v11 = grid[y1][x1];

      const vTop = v00 * (1 - dx) + v10 * dx;
      const vBottom = v01 * (1 - dx) + v11 * dx;
      const val = vTop * (1 - dy) + vBottom * dy;

      const [r, g, b, a] = getRGBAForValue(val, palette, min, max);

      const pxIdx = (y * canvasWidth + x) * 4;
      data[pxIdx] = r;
      data[pxIdx + 1] = g;
      data[pxIdx + 2] = b;
      data[pxIdx + 3] = a;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const url = canvas.toDataURL('image/png');

  return {
    url,
    coordinates: [
      [minLon, maxLat], // top-left
      [maxLon, maxLat], // top-right
      [maxLon, minLat], // bottom-right
      [minLon, minLat], // bottom-left
    ],
    minLat,
    maxLat,
    minLon,
    maxLon,
    width,
    height,
  };
}

/**
 * Particle Particle Vector Animator Class.
 */
export interface Particle {
  lon: number;
  lat: number;
  age: number;
  maxAge: number;
}

export class WindParticleEngine {
  private particles: Particle[] = [];
  private numParticles: number = 2500;
  private uGrid: number[][] = [];
  private vGrid: number[][] = [];
  private lats: number[] = [];
  private lons: number[] = [];
  private minLon: number = 60.0;
  private maxLon: number = 100.0;
  private minLat: number = 0.0;
  private maxLat: number = 40.0;

  constructor(vectorData: VectorFieldResponse, numParticles: number = 2500) {
    this.numParticles = numParticles;
    this.initGrid(vectorData);
    this.spawnParticles();
  }

  private initGrid(vectorData: VectorFieldResponse) {
    if (!vectorData || !vectorData.vectors || vectorData.vectors.length === 0) return;

    this.lats = Array.from(new Set(vectorData.vectors.map((v) => v.latitude))).sort((a, b) => a - b);
    this.lons = Array.from(new Set(vectorData.vectors.map((v) => v.longitude))).sort((a, b) => a - b);

    if (this.lats.length === 0 || this.lons.length === 0) return;

    // Strict India geographic bounding box (6.5°N–37.5°N, 67.0°E–98.0°E)
    this.minLat = Math.max(6.5, this.lats[0]);
    this.maxLat = Math.min(37.5, this.lats[this.lats.length - 1]);
    this.minLon = Math.max(67.0, this.lons[0]);
    this.maxLon = Math.min(98.0, this.lons[this.lons.length - 1]);

    this.uGrid = Array.from({ length: this.lats.length }, () => Array(this.lons.length).fill(0));
    this.vGrid = Array.from({ length: this.lats.length }, () => Array(this.lons.length).fill(0));

    for (const vec of vectorData.vectors) {
      const r = this.lats.indexOf(vec.latitude);
      const c = this.lons.indexOf(vec.longitude);
      if (r !== -1 && c !== -1) {
        this.uGrid[r][c] = vec.u;
        this.vGrid[r][c] = vec.v;
      }
    }
  }

  private spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        lon: this.minLon + Math.random() * (this.maxLon - this.minLon),
        lat: this.minLat + Math.random() * (this.maxLat - this.minLat),
        age: Math.floor(Math.random() * 80),
        maxAge: 40 + Math.floor(Math.random() * 60),
      });
    }
  }

  public interpolateVector(lon: number, lat: number): [number, number] {
    if (this.lats.length < 2 || this.lons.length < 2) return [0, 0];
    if (lon < this.minLon || lon > this.maxLon || lat < this.minLat || lat > this.maxLat) {
      return [0, 0];
    }

    const dLat = (this.maxLat - this.minLat) / (this.lats.length - 1);
    const dLon = (this.maxLon - this.minLon) / (this.lons.length - 1);

    const x = (lon - this.minLon) / dLon;
    const y = (lat - this.minLat) / dLat;

    const x0 = Math.floor(x);
    const x1 = Math.min(this.lons.length - 1, x0 + 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(this.lats.length - 1, y0 + 1);

    const dx = x - x0;
    const dy = y - y0;

    const u00 = this.uGrid[y0][x0];
    const u10 = this.uGrid[y0][x1];
    const u01 = this.uGrid[y1][x0];
    const u11 = this.uGrid[y1][x1];
    const u = (u00 * (1 - dx) + u10 * dx) * (1 - dy) + (u01 * (1 - dx) + u11 * dx) * dy;

    const v00 = this.vGrid[y0][x0];
    const v10 = this.vGrid[y0][x1];
    const v01 = this.vGrid[y1][x0];
    const v11 = this.vGrid[y1][x1];
    const v = (v00 * (1 - dx) + v10 * dx) * (1 - dy) + (v01 * (1 - dx) + v11 * dx) * dy;

    return [u, v];
  }

  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    projectFn: (lon: number, lat: number) => { x: number; y: number },
    opacity: number = 0.85
  ) {
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    const speedScale = 0.014;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.age >= p.maxAge) {
        // Respawn particle
        p.lon = this.minLon + Math.random() * (this.maxLon - this.minLon);
        p.lat = this.minLat + Math.random() * (this.maxLat - this.minLat);
        p.age = 0;
        p.maxAge = 40 + Math.floor(Math.random() * 60);
        continue;
      }

      const [u, v] = this.interpolateVector(p.lon, p.lat);
      const spd = Math.sqrt(u * u + v * v);

      const oldPt = projectFn(p.lon, p.lat);

      // Advance in geographical coordinates
      p.lon += u * speedScale;
      p.lat += v * speedScale;
      p.age++;

      // Check bounds
      if (p.lon < this.minLon || p.lon > this.maxLon || p.lat < this.minLat || p.lat > this.maxLat) {
        p.age = p.maxAge;
        continue;
      }

      const newPt = projectFn(p.lon, p.lat);

      // Draw particle line segment
      const lifeRatio = 1.0 - Math.abs((p.age / p.maxAge) * 2 - 1);
      const alpha = Math.max(0.1, lifeRatio * opacity);

      // Color by speed: cyan -> blue -> violet -> pink
      let color = `rgba(56, 189, 248, ${alpha})`;
      if (spd > 20) color = `rgba(236, 72, 153, ${alpha})`;
      else if (spd > 12) color = `rgba(168, 85, 247, ${alpha})`;
      else if (spd > 6) color = `rgba(59, 130, 246, ${alpha})`;

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(oldPt.x, oldPt.y);
      ctx.lineTo(newPt.x, newPt.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Convert meteorological wind degrees (0-360°) into 16-point cardinal compass string.
 */
export function formatWindDirection(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Returns wind direction flow arrow unicode character for visual map display.
 */
export function getWindDirectionArrow(deg: number): string {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return arrows[index];
}


