import type { NwsAlert } from '../api/nwsAlerts';

export interface AlertTypeConfig {
  key: string;
  label: string;
  defaultEnabled: boolean;
  match: (event: string) => boolean;
}

export const ALERT_TYPE_CONFIGS: AlertTypeConfig[] = [
  {
    key: 'tornado_warning',
    label: 'Tornado Warnings',
    defaultEnabled: true,
    match: (event) => event === 'Tornado Warning',
  },
  {
    key: 'severe_tstorm_warning',
    label: 'Severe Thunderstorm Warnings',
    defaultEnabled: true,
    match: (event) => event === 'Severe Thunderstorm Warning',
  },
  {
    key: 'flash_flood_warning',
    label: 'Flash Flood Warnings',
    defaultEnabled: true,
    match: (event) => event === 'Flash Flood Warning',
  },
  {
    key: 'tornado_watch',
    label: 'Tornado Watches',
    defaultEnabled: true,
    match: (event) => event === 'Tornado Watch',
  },
  {
    key: 'severe_tstorm_watch',
    label: 'Severe Thunderstorm Watches',
    defaultEnabled: true,
    match: (event) => event === 'Severe Thunderstorm Watch',
  },
  {
    key: 'high_wind_warning',
    label: 'High Wind Warnings',
    defaultEnabled: false,
    match: (event) => event === 'High Wind Warning',
  },
  {
    key: 'winter_weather',
    label: 'Winter Weather Alerts',
    defaultEnabled: false,
    match: (event) => /winter|snow|ice|freez|blizzard/i.test(event),
  },
  {
    key: 'other_warnings',
    label: 'Other NWS Warnings',
    defaultEnabled: true,
    // Catch-all for every other "Warning"-tier NWS alert (Extreme Wind,
    // Flood, Excessive Heat, Dust Storm, Severe Weather Statement, etc.) —
    // "Warning" is NWS's highest-urgency tier ("occurring or imminent"), so
    // none of them should be silently unnotifiable just for lacking a
    // dedicated toggle above.
    match: (event) => /\bwarning$/i.test(event),
  },
];

export const DEFAULT_ALERT_TYPE_PREFS: Record<string, boolean> = Object.fromEntries(
  ALERT_TYPE_CONFIGS.map((c) => [c.key, c.defaultEnabled]),
);

export function alertTypeKeyFor(event: string): string | null {
  const config = ALERT_TYPE_CONFIGS.find((c) => c.match(event));
  return config ? config.key : null;
}

export function isAlertNotifiable(alert: NwsAlert, prefs: Record<string, boolean>): boolean {
  const key = alertTypeKeyFor(alert.event);
  if (!key) return false;
  return prefs[key] ?? false;
}
