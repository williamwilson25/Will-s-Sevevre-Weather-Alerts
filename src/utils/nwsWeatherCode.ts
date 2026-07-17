// Maps NWS's free-text forecast/observation descriptions to the same WMO-style
// weather codes the rest of the app (icons, risk scoring) was already built around,
// so switching the data source doesn't require touching every consumer.
const KEYWORD_CODES: [RegExp, number][] = [
  [/tornado/i, 99],
  [/severe\s+thunderstorm|thunderstorm.*hail|hail.*thunderstorm/i, 96],
  [/thunderstorm|tstorm/i, 95],
  [/blizzard|heavy snow/i, 75],
  [/snow showers/i, 85],
  [/light snow/i, 71],
  [/snow/i, 73],
  [/freezing rain|ice storm|sleet/i, 66],
  [/freezing drizzle/i, 56],
  [/heavy rain/i, 65],
  [/rain showers|showers/i, 80],
  [/light rain|chance rain|slight chance/i, 61],
  [/rain|shower/i, 63],
  [/drizzle/i, 51],
  [/fog|mist|haze|smoke/i, 45],
  [/overcast|cloudy/i, 3],
  [/partly sunny|partly cloudy|mostly cloudy/i, 2],
  [/mostly clear|mostly sunny/i, 1],
  [/clear|sunny|fair/i, 0],
];

export function mapNwsTextToWeatherCode(text: string): number {
  for (const [pattern, code] of KEYWORD_CODES) {
    if (pattern.test(text)) return code;
  }
  return 3;
}
