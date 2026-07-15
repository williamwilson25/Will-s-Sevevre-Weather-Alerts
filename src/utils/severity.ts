import type { RiskLevel, SevereRisk } from '../types';

interface RiskInput {
  weatherCode: number;
  windGustsMax: number;
  precipitationProbability: number;
}

const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const HAIL_CODES = new Set([96, 99]);
const HEAVY_SHOWER_CODES = new Set([65, 67, 75, 82, 86]);

export function assessDailyRisk(input: RiskInput): SevereRisk {
  const reasons: string[] = [];
  let score = 0;

  if (THUNDERSTORM_CODES.has(input.weatherCode)) {
    score += 45;
    reasons.push('Thunderstorms expected');
  }
  if (HAIL_CODES.has(input.weatherCode)) {
    score += 20;
    reasons.push('Possible hail');
  }
  if (HEAVY_SHOWER_CODES.has(input.weatherCode)) {
    score += 15;
    reasons.push('Heavy precipitation expected');
  }

  if (input.windGustsMax >= 58) {
    score += 35;
    reasons.push(`Damaging gusts up to ${Math.round(input.windGustsMax)} mph`);
  } else if (input.windGustsMax >= 45) {
    score += 20;
    reasons.push(`Strong gusts up to ${Math.round(input.windGustsMax)} mph`);
  } else if (input.windGustsMax >= 35) {
    score += 8;
    reasons.push(`Gusty winds up to ${Math.round(input.windGustsMax)} mph`);
  }

  if (input.precipitationProbability >= 70) {
    score += 10;
    reasons.push(`${Math.round(input.precipitationProbability)}% chance of precipitation`);
  }

  score = Math.min(100, score);

  let level: RiskLevel = 'low';
  if (score >= 65) level = 'severe';
  else if (score >= 40) level = 'high';
  else if (score >= 18) level = 'moderate';

  if (reasons.length === 0) reasons.push('No significant severe weather signals');

  return { level, score, reasons };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  severe: 'Severe',
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  severe: '#ef4444',
};
