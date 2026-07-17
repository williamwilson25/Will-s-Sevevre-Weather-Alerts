import type { Location } from '../types';

const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active';

export type NwsSeverity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';

export interface NwsAlert {
  id: string;
  event: string;
  severity: NwsSeverity;
  urgency: string;
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  senderName: string;
  effective: string;
  expires: string;
}

export async function fetchActiveAlerts(location: Location): Promise<NwsAlert[]> {
  const url = new URL(NWS_ALERTS_URL);
  url.searchParams.set('point', `${location.latitude},${location.longitude}`);
  url.searchParams.set('status', 'actual');
  url.searchParams.set('message_type', 'alert,update');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/geo+json' },
  });
  if (!res.ok) throw new Error(`NWS alerts fetch failed (${res.status})`);
  const data = await res.json();
  const features: unknown[] = data.features ?? [];

  return features
    .map((f) => {
      const feature = f as { id?: string; properties?: Record<string, unknown> };
      const p = feature.properties ?? {};
      return {
        id: String(feature.id ?? p.id ?? ''),
        event: String(p.event ?? 'Weather Alert'),
        severity: (p.severity as NwsSeverity) ?? 'Unknown',
        urgency: String(p.urgency ?? 'Unknown'),
        headline: String(p.headline ?? p.event ?? ''),
        description: String(p.description ?? ''),
        instruction: String(p.instruction ?? ''),
        areaDesc: String(p.areaDesc ?? ''),
        senderName: String(p.senderName ?? 'National Weather Service'),
        effective: String(p.effective ?? p.onset ?? ''),
        expires: String(p.expires ?? p.ends ?? ''),
      };
    })
    .filter((alert) => alert.id);
}
