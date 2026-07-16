export interface RadarFrame {
  time: number;
  path: string;
}

export interface RadarData {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[];
}

const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export async function fetchRadarData(): Promise<RadarData> {
  const res = await fetch(RAINVIEWER_URL);
  if (!res.ok) throw new Error(`Radar fetch failed (${res.status})`);
  const data = await res.json();
  return {
    host: data.host,
    past: data.radar?.past ?? [],
    nowcast: data.radar?.nowcast ?? [],
  };
}

export function radarTileUrl(host: string, frame: RadarFrame): string {
  // size 256, color scheme 2 (Universal Blue), smoothing + snow enabled
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}
