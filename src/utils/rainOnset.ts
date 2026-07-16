import type { HourlyPoint } from '../types';

export interface RainOnset {
  hour: HourlyPoint;
  hoursAway: number;
}

const ONSET_THRESHOLD = 50;
const ALREADY_RAINING_THRESHOLD = 40;
const LOOKAHEAD_HOURS = 4;

/**
 * Looks for a near-term jump in precipitation chance — i.e. it isn't raining/about to rain
 * right now, but within the next few hours the chance crosses ONSET_THRESHOLD. Returns the
 * first such hour, or null if it's already raining-soon or no onset is coming.
 */
export function detectRainOnset(hourly: HourlyPoint[]): RainOnset | null {
  if (hourly.length === 0) return null;
  if (hourly[0].precipitationProbability >= ALREADY_RAINING_THRESHOLD) return null;

  for (let i = 1; i < Math.min(hourly.length, LOOKAHEAD_HOURS + 1); i++) {
    if (hourly[i].precipitationProbability >= ONSET_THRESHOLD) {
      return { hour: hourly[i], hoursAway: i };
    }
  }
  return null;
}

export function formatOnsetTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
