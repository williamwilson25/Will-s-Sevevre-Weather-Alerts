import type { AlertSeverity, DailyForecast, Friend } from '../types';

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
  day: DailyForecast,
  severity: AlertSeverity,
  customNote: string,
  typeLabel?: string,
): { headline: string; body: string } {
  const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const headline = `${typeLabel || SEVERITY_LABEL[severity]} for your current location — ${dateLabel}`;

  const lines = [headline];

  if (customNote.trim()) {
    lines.push('', `Note: ${customNote.trim()}`);
  }
  lines.push('', "Sent via Will's Severe Weather Alerts");

  return { headline, body: lines.join('\n') };
}

function encodeParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

export function buildSmsLink(friend: Friend, body: string): string {
  return `sms:${friend.phone}?${encodeParams({ body })}`;
}
