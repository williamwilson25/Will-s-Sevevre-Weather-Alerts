import type { AlertSeverity, DailyForecast, Friend } from '../types';
import { describeWeatherCode } from './weatherCode';
import { spcOutlookImageUrl, spcThunderstormImageUrl } from '../api/spcOutlook';

export const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  advisory: 'Weather Advisory',
  watch: 'Severe Weather Watch',
  warning: 'Severe Weather Warning',
  emergency: 'Weather Emergency',
};

export const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  advisory: '#38bdf8',
  watch: '#eab308',
  warning: '#f97316',
  emergency: '#ef4444',
};

export function buildAlertMessage(
  locationName: string,
  day: DailyForecast,
  severity: AlertSeverity,
  customNote: string,
  dayIndex = 0,
): { headline: string; body: string; imageUrl: string | null } {
  const { label } = describeWeatherCode(day.weatherCode);
  const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const headline = `${SEVERITY_LABEL[severity]} for ${locationName} — ${dateLabel}`;
  const spcDay = dayIndex + 1;
  const imageUrl =
    spcDay === 1
      ? spcThunderstormImageUrl() ?? spcOutlookImageUrl(1)
      : spcDay <= 3
        ? spcOutlookImageUrl(spcDay as 2 | 3)
        : null;

  const lines = [
    headline,
    '',
    `Forecast: ${label}, high ${Math.round(day.tempMax)}°F / low ${Math.round(day.tempMin)}°F`,
    `Chance of severe weather: ${day.risk.score}% (${day.risk.level.toUpperCase()})`,
    `Wind gusts up to ${Math.round(day.windGustsMax)} mph, ${Math.round(day.precipitationProbability)}% chance of precipitation`,
  ];

  if (day.risk.reasons.length) {
    lines.push('', `Why: ${day.risk.reasons.join('; ')}`);
  }
  if (customNote.trim()) {
    lines.push('', `Note from your friend: ${customNote.trim()}`);
  }
  if (imageUrl) {
    lines.push('', `Storm chance map: ${imageUrl}`);
  }
  lines.push('', "Sent via Will's Severe Weather Alerts");

  return { headline, body: lines.join('\n'), imageUrl };
}

function encodeParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

export function buildMailtoLink(friends: Friend[], subject: string, body: string): string | null {
  const emails = friends.map((f) => f.email).filter(Boolean) as string[];
  if (emails.length === 0) return null;
  return `mailto:${emails.join(',')}?${encodeParams({ subject, body })}`;
}

export function buildSmsLink(friend: Friend, body: string): string | null {
  if (!friend.phone) return null;
  return `sms:${friend.phone}?${encodeParams({ body })}`;
}
