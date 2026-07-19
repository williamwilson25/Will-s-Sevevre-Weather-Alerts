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

  let level: RiskLevel = 'marginal';
  if (score >= 70) level = 'high';
  else if (score >= 50) level = 'moderate';
  else if (score >= 30) level = 'enhanced';
  else if (score >= 15) level = 'slight';

  if (reasons.length === 0) reasons.push('No significant severe weather signals');

  return { level, score, reasons };
}

// Ordered 1-5 to match SPC's own categorical outlook numbering.
export const RISK_LABEL: Record<RiskLevel, string> = {
  marginal: 'Marginal',
  slight: 'Slight',
  enhanced: 'Enhanced',
  moderate: 'Moderate',
  high: 'High',
};

export const RISK_NUMBER: Record<RiskLevel, number> = {
  marginal: 1,
  slight: 2,
  enhanced: 3,
  moderate: 4,
  high: 5,
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  marginal: '#4ade80',
  slight: '#eab308',
  enhanced: '#f97316',
  moderate: '#ef4444',
  high: '#d946ef',
};
