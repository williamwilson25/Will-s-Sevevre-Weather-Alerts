import { fetchRadarData } from '../api/radar';
import type { HourlyPoint, Location } from '../types';

export interface NowcastPoint {
  minutesFromNow: number;
  intensity: number; // 0-100
}

export type NowcastState =
  | { kind: 'raining' }
  | { kind: 'starting'; minutesAway: number }
  | { kind: 'clear' };

const ZOOM = 8; // RainViewer's radar tiles don't support deeper native zoom than this
const ONSET_INTENSITY = 14; // out of 100 — minimum sampled intensity that counts as "rain"

interface TileLocation {
  z: number;
  x: number;
  y: number;
  px: number;
  py: number;
}

function locateTile(lat: number, lon: number, zoom: number): TileLocation {
  const scale = 256 * 2 ** zoom;
  const sinLat = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  const worldX = scale * (0.5 + lon / 360);
  const worldY = scale * (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI));
  const x = Math.floor(worldX / 256);
  const y = Math.floor(worldY / 256);
  return {
    z: zoom,
    x,
    y,
    px: Math.min(255, Math.max(0, Math.floor(worldX - x * 256))),
    py: Math.min(255, Math.max(0, Math.floor(worldY - y * 256))),
  };
}

function sampleTileAlpha(url: string, px: number, py: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(px, py, 1, 1);
        resolve(data[3]);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to read radar tile'));
      }
    };
    img.onerror = () => reject(new Error('Radar tile failed to load'));
    img.src = url;
  });
}

/**
 * Builds a short-term precipitation timeline by sampling the actual pixel under the
 * given coordinates on live radar frames (most recent past frame + all nowcast/
 * extrapolated frames). This is the same technique minute-by-minute rain forecasts
 * are built on. Throws if radar data or tile reads are unavailable so the caller can
 * fall back to a coarser hourly-forecast-based estimate.
 */
export async function buildRadarNowcast(location: Location): Promise<NowcastPoint[]> {
  const data = await fetchRadarData();
  const frames = [...data.past.slice(-1), ...data.nowcast];
  if (frames.length === 0) throw new Error('No radar frames available');

  const tile = locateTile(location.latitude, location.longitude, ZOOM);
  const nowSeconds = Date.now() / 1000;

  const settled = await Promise.allSettled(
    frames.map(async (frame) => {
      const url = `${data.host}${frame.path}/256/${tile.z}/${tile.x}/${tile.y}/2/1_1.png`;
      const alpha = await sampleTileAlpha(url, tile.px, tile.py);
      const point: NowcastPoint = {
        minutesFromNow: Math.round((frame.time - nowSeconds) / 60),
        intensity: Math.round((alpha / 255) * 100),
      };
      return point;
    }),
  );

  const points = settled
    .filter((r): r is PromiseFulfilledResult<NowcastPoint> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => a.minutesFromNow - b.minutesFromNow);

  if (points.length < 2) throw new Error('Not enough radar samples to build a nowcast');
  return points;
}

/** Coarse fallback built from hourly rain-chance data when radar sampling isn't available. */
export function buildHourlyNowcast(hourly: HourlyPoint[]): NowcastPoint[] {
  const a = hourly[0]?.precipitationProbability ?? 0;
  const b = hourly[1]?.precipitationProbability ?? a;
  const steps = 6;
  return Array.from({ length: steps }, (_, i) => {
    const t = steps > 1 ? i / (steps - 1) : 0;
    return { minutesFromNow: i * 10, intensity: Math.round(a + (b - a) * t) };
  });
}

export function summarizeNowcast(points: NowcastPoint[]): NowcastState {
  const sorted = [...points].sort((a, b) => a.minutesFromNow - b.minutesFromNow);
  const current = sorted.find((p) => p.minutesFromNow >= 0) ?? sorted[0];
  if (current && current.intensity >= ONSET_INTENSITY) {
    return { kind: 'raining' };
  }
  const onset = sorted.find((p) => p.minutesFromNow > 0 && p.intensity >= ONSET_INTENSITY);
  if (onset) {
    return { kind: 'starting', minutesAway: onset.minutesFromNow };
  }
  return { kind: 'clear' };
}
