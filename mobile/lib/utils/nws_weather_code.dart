// Mirrors src/utils/nwsWeatherCode.ts — maps NWS free-text descriptions to
// the same WMO-style codes the icons/risk-scoring logic is built around.
final List<(RegExp, int)> _keywordCodes = [
  (RegExp(r'tornado', caseSensitive: false), 99),
  (RegExp(r'severe\s+thunderstorm|thunderstorm.*hail|hail.*thunderstorm', caseSensitive: false), 96),
  (RegExp(r'thunderstorm|tstorm', caseSensitive: false), 95),
  (RegExp(r'blizzard|heavy snow', caseSensitive: false), 75),
  (RegExp(r'snow showers', caseSensitive: false), 85),
  (RegExp(r'light snow', caseSensitive: false), 71),
  (RegExp(r'snow', caseSensitive: false), 73),
  (RegExp(r'freezing rain|ice storm|sleet', caseSensitive: false), 66),
  (RegExp(r'freezing drizzle', caseSensitive: false), 56),
  (RegExp(r'heavy rain', caseSensitive: false), 65),
  (RegExp(r'rain showers|showers', caseSensitive: false), 80),
  (RegExp(r'light rain|chance rain|slight chance', caseSensitive: false), 61),
  (RegExp(r'rain|shower', caseSensitive: false), 63),
  (RegExp(r'drizzle', caseSensitive: false), 51),
  (RegExp(r'fog|mist|haze|smoke', caseSensitive: false), 45),
  (RegExp(r'overcast|cloudy', caseSensitive: false), 3),
  (RegExp(r'partly sunny|partly cloudy|mostly cloudy', caseSensitive: false), 2),
  (RegExp(r'mostly clear|mostly sunny', caseSensitive: false), 1),
  (RegExp(r'clear|sunny|fair', caseSensitive: false), 0),
];

int mapNwsTextToWeatherCode(String text) {
  for (final (pattern, code) in _keywordCodes) {
    if (pattern.hasMatch(text)) return code;
  }
  return 3;
}
