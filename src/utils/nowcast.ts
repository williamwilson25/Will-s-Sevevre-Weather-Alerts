import type { HourlyPoint } from '../types';

export interface NowcastPoint {
  minutesFromNow: number;
  intensity: number; // 0-100
}

export type NowcastState =
  | { kind: 'raining' }
  | { kind: 'starting'; minutesAway: number }
  | { kind: 'clear' };

// Out of 100 — minimum intensity that counts as "rain" worth a notification.
// NWS's hourly precipitation chance is a coarse per-hour bucket, not a real
// minute-by-minute nowcast, so a low bar here means ordinary hour-to-hour
// forecast noise (e.g. 0% now, 20% next hour) reads as "rain starting soon"
// even when nothing meaningful is actually expected. 40 roughly matches NWS's
// own "likely" wording threshold.
const ONSET_INTENSITY = 40;

/** Short-term precipitation timeline built from the NWS hourly forecast's rain chance. */
export function buildNwsNowcast(hourly: HourlyPoint[]): NowcastPoint[] {
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
