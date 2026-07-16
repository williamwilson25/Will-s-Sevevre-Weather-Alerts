export interface SpcFeatureProps {
  label: string;
  labelFull: string;
  fill: string;
  stroke: string;
}

export interface SpcFeature {
  properties: SpcFeatureProps;
  geometry: GeoJSON.Geometry;
}

const LABEL_RANK: Record<string, number> = {
  TSTM: 0,
  MRGL: 1,
  SLGT: 2,
  ENH: 3,
  MDT: 4,
  HIGH: 5,
};

const LABEL_NAME: Record<string, string> = {
  TSTM: 'Thunderstorm',
  MRGL: 'Marginal',
  SLGT: 'Slight',
  ENH: 'Enhanced',
  MDT: 'Moderate',
  HIGH: 'High',
};

function pick(props: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = props[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

/** SPC's Day 1-3 Convective Outlook graphic — categorical risk areas with % probability contour lines. */
export function spcOutlookImageUrl(day: 1 | 2 | 3): string {
  return `https://www.spc.noaa.gov/products/outlook/day${day}otlk.gif`;
}

export async function fetchConvectiveOutlook(day: 1 | 2 | 3): Promise<SpcFeature[]> {
  const url = `https://www.spc.noaa.gov/products/outlook/day${day}otlk_cat.nolyr.geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SPC outlook fetch failed (${res.status})`);
  const data = await res.json();
  const features: Array<{ properties: Record<string, unknown>; geometry: GeoJSON.Geometry }> =
    data.features ?? [];

  return features
    .map((f) => {
      const label = pick(f.properties, ['LABEL', 'Label', 'label']) ?? 'TSTM';
      const labelFull =
        pick(f.properties, ['LABEL2', 'Label2', 'label2']) ?? LABEL_NAME[label] ?? label;
      const fill = pick(f.properties, ['fill', 'FILL', 'fillColor']) ?? '#888888';
      const stroke = pick(f.properties, ['stroke', 'STROKE', 'strokeColor']) ?? fill;
      return { properties: { label, labelFull, fill, stroke }, geometry: f.geometry };
    })
    .filter((f) => f.properties.label !== 'TSTM')
    .sort((a, b) => (LABEL_RANK[a.properties.label] ?? 0) - (LABEL_RANK[b.properties.label] ?? 0));
}

export function legendFor(features: SpcFeature[]): SpcFeatureProps[] {
  const seen = new Map<string, SpcFeatureProps>();
  features.forEach((f) => seen.set(f.properties.label, f.properties));
  return Array.from(seen.values()).sort(
    (a, b) => (LABEL_RANK[b.label] ?? 0) - (LABEL_RANK[a.label] ?? 0),
  );
}
