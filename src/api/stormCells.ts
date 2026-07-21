export interface StormCell {
  id: string;
  distanceMi: number | null;
  bearing: string | null;
  speedMph: number | null;
  etaMinutes: number | null;
  hailProbability: number | null;
  hailSizeIn: number | null;
  rotation: boolean;
}

const STORM_CELLS_URL = 'https://us-central1-wills-severe-weather-alerts.cloudfunctions.net/getStormCells';

// Backed by the getStormCells Cloud Function (functions/index.js), which
// proxies Xweather's storm-cells API — never called directly from the
// client since it needs a client_id/secret that must stay server-side.
// Fails soft (empty array) so a slow/unavailable upstream never blocks the
// rest of the dashboard, matching how RainNowcast/NwsForecastCard degrade.
export async function fetchNearbyStormCells(latitude: number, longitude: number): Promise<StormCell[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${STORM_CELLS_URL}?lat=${latitude}&lon=${longitude}`, {
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.cells) ? data.cells : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
