// Mirrors src/utils/alertTypes.ts exactly, including the "Other NWS
// Warnings" catch-all so nothing in the Warning tier goes silently
// unnotifiable. Also mirrored again server-side in functions/index.js.
import '../models/models.dart';

class AlertTypeConfig {
  final String key;
  final String label;
  final bool defaultEnabled;
  final bool Function(String event) match;

  const AlertTypeConfig({
    required this.key,
    required this.label,
    required this.defaultEnabled,
    required this.match,
  });
}

final List<AlertTypeConfig> alertTypeConfigs = [
  AlertTypeConfig(
    key: 'tornado_warning',
    label: 'Tornado Warnings',
    defaultEnabled: true,
    match: (event) => event == 'Tornado Warning',
  ),
  AlertTypeConfig(
    key: 'severe_tstorm_warning',
    label: 'Severe Thunderstorm Warnings',
    defaultEnabled: true,
    match: (event) => event == 'Severe Thunderstorm Warning',
  ),
  AlertTypeConfig(
    key: 'flash_flood_warning',
    label: 'Flash Flood Warnings',
    defaultEnabled: true,
    match: (event) => event == 'Flash Flood Warning',
  ),
  AlertTypeConfig(
    key: 'tornado_watch',
    label: 'Tornado Watches',
    defaultEnabled: true,
    match: (event) => event == 'Tornado Watch',
  ),
  AlertTypeConfig(
    key: 'severe_tstorm_watch',
    label: 'Severe Thunderstorm Watches',
    defaultEnabled: true,
    match: (event) => event == 'Severe Thunderstorm Watch',
  ),
  AlertTypeConfig(
    key: 'high_wind_warning',
    label: 'High Wind Warnings',
    defaultEnabled: false,
    match: (event) => event == 'High Wind Warning',
  ),
  AlertTypeConfig(
    key: 'winter_weather',
    label: 'Winter Weather Alerts',
    defaultEnabled: false,
    match: (event) => RegExp(r'winter|snow|ice|freez|blizzard', caseSensitive: false).hasMatch(event),
  ),
  AlertTypeConfig(
    key: 'other_warnings',
    label: 'Other NWS Warnings',
    defaultEnabled: true,
    match: (event) => RegExp(r'\bwarning$', caseSensitive: false).hasMatch(event),
  ),
];

Map<String, bool> defaultAlertTypePrefs() => {
      for (final c in alertTypeConfigs) c.key: c.defaultEnabled,
    };

String? alertTypeKeyFor(String event) {
  for (final config in alertTypeConfigs) {
    if (config.match(event)) return config.key;
  }
  return null;
}

bool isAlertNotifiable(NwsAlert alert, Map<String, bool> prefs) {
  final key = alertTypeKeyFor(alert.event);
  if (key == null) return false;
  return prefs[key] ?? false;
}
