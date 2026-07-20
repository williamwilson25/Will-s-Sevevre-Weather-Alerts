// Mirrors src/api/weather.ts exactly — including the multi-station fallback
// fix for the "32°F when the nearest station's reading is null" bug found
// and fixed on the web app.
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';
import '../utils/nws_weather_code.dart';
import '../utils/severity.dart';
import '../utils/sun_times.dart';

const _geocodeUrl = 'https://geocoding-api.open-meteo.com/v1/search';
const _nwsHeaders = {'Accept': 'application/geo+json'};

double _celsiusToFahrenheit(double c) => c * 9 / 5 + 32;
double _kmhToMph(double kmh) => kmh / 1.60934;
double _paToHpa(double pa) => pa / 100;

double _parseWindMph(String? text) {
  if (text == null || text.isEmpty) return 0;
  final matches = RegExp(r'\d+').allMatches(text).map((m) => double.parse(m.group(0)!));
  if (matches.isEmpty) return 0;
  return matches.reduce((a, b) => a > b ? a : b);
}

double? _parseGustMph(String? detailedForecast) {
  if (detailedForecast == null || detailedForecast.isEmpty) return null;
  final match = RegExp(r'gusts?\s*(?:as high as|up to|to)?\s*(\d+)\s*mph', caseSensitive: false)
      .firstMatch(detailedForecast);
  return match != null ? double.parse(match.group(1)!) : null;
}

Future<List<Location>> searchLocations(String query) async {
  final trimmed = query.trim();
  if (trimmed.length < 2) return [];

  final url = Uri.parse(_geocodeUrl).replace(queryParameters: {
    'name': trimmed,
    'count': '6',
    'language': 'en',
    'format': 'json',
  });
  final res = await http.get(url);
  if (res.statusCode != 200) throw Exception('Location search failed (${res.statusCode})');
  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final results = (data['results'] as List<dynamic>? ?? []);

  return results.map((r) {
    final m = r as Map<String, dynamic>;
    return Location(
      id: m['id'].toString(),
      name: m['name'] as String,
      admin1: m['admin1'] as String?,
      country: m['country'] as String? ?? '',
      latitude: (m['latitude'] as num).toDouble(),
      longitude: (m['longitude'] as num).toDouble(),
      timezone: m['timezone'] as String? ?? '',
    );
  }).toList();
}

class NwsPointMeta {
  final String gridId;
  final String forecast;
  final String forecastHourly;
  final String observationStations;
  final String timezone;

  const NwsPointMeta({
    required this.gridId,
    required this.forecast,
    required this.forecastHourly,
    required this.observationStations,
    required this.timezone,
  });
}

Future<NwsPointMeta> fetchPointMeta(Location location) async {
  final res = await http.get(
    Uri.parse('https://api.weather.gov/points/${location.latitude},${location.longitude}'),
    headers: _nwsHeaders,
  );
  if (res.statusCode != 200) throw Exception('NWS point lookup failed (${res.statusCode})');
  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final p = (data['properties'] as Map<String, dynamic>?) ?? {};
  if (p['forecast'] == null || p['forecastHourly'] == null || p['observationStations'] == null) {
    throw Exception('NWS has no forecast coverage for this location');
  }
  return NwsPointMeta(
    gridId: p['gridId'] as String? ?? '',
    forecast: p['forecast'] as String,
    forecastHourly: p['forecastHourly'] as String,
    observationStations: p['observationStations'] as String,
    timezone: p['timeZone'] as String? ?? location.timezone,
  );
}

class ObservedExtras {
  final double? visibilityMeters;
  final double? dewPointF;
  const ObservedExtras({this.visibilityMeters, this.dewPointF});
}

double? _numOrNull(dynamic v) => v == null ? null : (v as num).toDouble();

Future<({CurrentConditions current, ObservedExtras extras})> fetchCurrentConditions(
  String observationStationsUrl,
) async {
  final stationsRes = await http.get(Uri.parse(observationStationsUrl), headers: _nwsHeaders);
  if (stationsRes.statusCode != 200) {
    throw Exception('NWS station lookup failed (${stationsRes.statusCode})');
  }
  final stationsData = jsonDecode(stationsRes.body) as Map<String, dynamic>;
  final features = (stationsData['features'] as List<dynamic>? ?? []);
  final stationIds = features
      .map((f) => ((f as Map<String, dynamic>)['properties']
          as Map<String, dynamic>?)?['stationIdentifier'] as String?)
      .whereType<String>()
      .toList();
  if (stationIds.isEmpty) throw Exception('No NWS observation station found nearby');

  // The nearest station's latest observation sometimes has a null
  // temperature (sensor outage, reporting gap, etc.) — fall through to the
  // next-nearest station instead of silently treating that as 0°C.
  Map<String, dynamic>? p;
  for (final stationId in stationIds.take(5)) {
    final obsRes = await http.get(
      Uri.parse('https://api.weather.gov/stations/$stationId/observations/latest'),
      headers: _nwsHeaders,
    );
    if (obsRes.statusCode != 200) continue;
    final obsData = jsonDecode(obsRes.body) as Map<String, dynamic>;
    final props = (obsData['properties'] as Map<String, dynamic>?) ?? {};
    if ((props['temperature'] as Map<String, dynamic>?)?['value'] != null) {
      p = props;
      break;
    }
  }
  if (p == null) throw Exception('No nearby station has a current temperature reading');

  double val(String key) => _numOrNull((p![key] as Map<String, dynamic>?)?['value']) ?? 0;
  double? valOrNull(String key) => _numOrNull((p![key] as Map<String, dynamic>?)?['value']);

  final temperatureC = val('temperature');
  final heatIndexC = valOrNull('heatIndex');
  final windChillC = valOrNull('windChill');
  final apparentC = heatIndexC ?? windChillC ?? temperatureC;
  final pressurePa = valOrNull('barometricPressure') ?? valOrNull('seaLevelPressure');
  final precipMm = valOrNull('precipitationLastHour');
  final visibilityM = valOrNull('visibility');
  final dewpointC = valOrNull('dewpoint');
  final windSpeedKmh = valOrNull('windSpeed');
  final windGustKmh = valOrNull('windGust');

  final current = CurrentConditions(
    temperature: _celsiusToFahrenheit(temperatureC),
    apparentTemperature: _celsiusToFahrenheit(apparentC),
    humidity: valOrNull('relativeHumidity') ?? 0,
    windSpeed: windSpeedKmh != null ? _kmhToMph(windSpeedKmh) : 0,
    windGusts: windGustKmh != null ? _kmhToMph(windGustKmh) : 0,
    windDirection: valOrNull('windDirection') ?? 0,
    precipitation: precipMm != null ? precipMm / 25.4 : 0,
    weatherCode: mapNwsTextToWeatherCode(p['textDescription'] as String? ?? ''),
    isDay: !(p['icon'] as String? ?? '').contains('/night/'),
    time: p['timestamp'] as String? ?? DateTime.now().toIso8601String(),
    pressure: pressurePa != null ? _paToHpa(pressurePa) : 1013,
  );

  return (
    current: current,
    extras: ObservedExtras(
      visibilityMeters: visibilityM,
      dewPointF: dewpointC != null ? _celsiusToFahrenheit(dewpointC) : null,
    ),
  );
}

Future<List<HourlyPoint>> fetchHourly(String forecastHourlyUrl) async {
  final res = await http.get(Uri.parse(forecastHourlyUrl), headers: _nwsHeaders);
  if (res.statusCode != 200) throw Exception('NWS hourly forecast fetch failed (${res.statusCode})');
  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final periods = (data['properties'] as Map<String, dynamic>?)?['periods'] as List<dynamic>? ?? [];

  final points = periods.map((raw) {
    final p = raw as Map<String, dynamic>;
    final pop = (p['probabilityOfPrecipitation'] as Map<String, dynamic>?)?['value'];
    final dewpoint = (p['dewpoint'] as Map<String, dynamic>?)?['value'];
    final startTime = p['startTime'] as String? ?? '';
    final detailedForecast = p['detailedForecast'] as String? ?? '';
    final windSpeed = p['windSpeed'] as String? ?? '';
    return HourlyPoint(
      time: startTime.isNotEmpty ? DateTime.parse(startTime) : DateTime.now(),
      temperature: _numOrNull(p['temperature']) ?? 0,
      precipitationProbability: _numOrNull(pop) ?? 0,
      weatherCode: mapNwsTextToWeatherCode(p['shortForecast'] as String? ?? ''),
      windGusts: _parseGustMph(detailedForecast) ?? _parseWindMph(windSpeed),
      uvIndex: 0,
      visibility: 0,
      dewPoint: dewpoint != null ? _celsiusToFahrenheit(_numOrNull(dewpoint)!) : 0,
    );
  }).where((p) => true).toList();

  return points.take(24).toList();
}

class _NwsForecastPeriod {
  final String startTime;
  final bool isDaytime;
  final double temperature;
  final String windSpeed;
  final String windDirection;
  final String shortForecast;
  final String detailedForecast;
  final double probabilityOfPrecipitation;

  const _NwsForecastPeriod({
    required this.startTime,
    required this.isDaytime,
    required this.temperature,
    required this.windSpeed,
    required this.windDirection,
    required this.shortForecast,
    required this.detailedForecast,
    required this.probabilityOfPrecipitation,
  });
}

const _windDirToDeg = {
  'N': 0.0, 'NNE': 22.5, 'NE': 45.0, 'ENE': 67.5, 'E': 90.0, 'ESE': 112.5, 'SE': 135.0, 'SSE': 157.5,
  'S': 180.0, 'SSW': 202.5, 'SW': 225.0, 'WSW': 247.5, 'W': 270.0, 'WNW': 292.5, 'NW': 315.0, 'NNW': 337.5,
};

Future<List<DailyForecast>> fetchDaily(String forecastUrl, Location location) async {
  final res = await http.get(Uri.parse(forecastUrl), headers: _nwsHeaders);
  if (res.statusCode != 200) throw Exception('NWS forecast fetch failed (${res.statusCode})');
  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final rawPeriods = (data['properties'] as Map<String, dynamic>?)?['periods'] as List<dynamic>? ?? [];

  final periods = rawPeriods.map((raw) {
    final p = raw as Map<String, dynamic>;
    final pop = (p['probabilityOfPrecipitation'] as Map<String, dynamic>?)?['value'];
    return _NwsForecastPeriod(
      startTime: p['startTime'] as String? ?? '',
      isDaytime: p['isDaytime'] as bool? ?? false,
      temperature: _numOrNull(p['temperature']) ?? 0,
      windSpeed: p['windSpeed'] as String? ?? '',
      windDirection: p['windDirection'] as String? ?? '',
      shortForecast: p['shortForecast'] as String? ?? '',
      detailedForecast: p['detailedForecast'] as String? ?? '',
      probabilityOfPrecipitation: _numOrNull(pop) ?? 0,
    );
  }).toList();

  final byDate = <String, ({_NwsForecastPeriod? day, _NwsForecastPeriod? night})>{};
  for (final period in periods) {
    if (period.startTime.length < 10) continue;
    final date = period.startTime.substring(0, 10);
    final entry = byDate[date] ?? (day: null, night: null);
    byDate[date] = period.isDaytime ? (day: period, night: entry.night) : (day: entry.day, night: period);
  }

  final entries = byDate.entries.take(7);
  final result = <DailyForecast>[];
  for (final entry in entries) {
    final date = entry.key;
    final day = entry.value.day;
    final night = entry.value.night;
    final primary = day ?? night;
    final tempMax = day?.temperature ?? night?.temperature ?? 0;
    final tempMin = night?.temperature ?? day?.temperature ?? 0;
    final windSpeedMax = [_parseWindMph(day?.windSpeed), _parseWindMph(night?.windSpeed)]
        .reduce((a, b) => a > b ? a : b);
    final gustFromText = _parseGustMph(day?.detailedForecast) ?? _parseGustMph(night?.detailedForecast);
    final precipitationProbability =
        [day?.probabilityOfPrecipitation ?? 0, night?.probabilityOfPrecipitation ?? 0]
            .reduce((a, b) => a > b ? a : b);
    final weatherCode = mapNwsTextToWeatherCode(primary?.shortForecast ?? '');
    final windGustsMax = gustFromText ?? windSpeedMax;
    final windDirection = _windDirToDeg[day?.windDirection ?? night?.windDirection ?? 'N'] ?? 0;

    final risk = assessDailyRisk(RiskInput(
      weatherCode: weatherCode,
      windGustsMax: windGustsMax,
      precipitationProbability: precipitationProbability,
    ));

    final noon = DateTime.parse('${date}T12:00:00');
    final sun = computeSunTimes(noon, location.latitude, location.longitude);

    result.add(DailyForecast(
      date: date,
      weatherCode: weatherCode,
      tempMax: tempMax,
      tempMin: tempMin,
      precipitationProbability: precipitationProbability,
      windSpeedMax: windSpeedMax,
      windGustsMax: windGustsMax,
      windDirection: windDirection,
      uvIndexMax: 0,
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      risk: risk,
    ));
  }
  return result;
}

/// Lightweight fetch for glanceable UI (Saved Locations list) — just the
/// current station reading, skipping the hourly/daily forecast fetches.
Future<CurrentConditions> fetchQuickConditions(Location location) async {
  final point = await fetchPointMeta(location);
  final result = await fetchCurrentConditions(point.observationStations);
  return result.current;
}

Future<WeatherSnapshot> fetchWeather(Location location) async {
  final point = await fetchPointMeta(location);

  final results = await Future.wait([
    fetchCurrentConditions(point.observationStations),
    fetchHourly(point.forecastHourly),
    fetchDaily(point.forecast, location),
  ]);

  final currentResult = results[0] as ({CurrentConditions current, ObservedExtras extras});
  final hourly = List<HourlyPoint>.from(results[1] as List<HourlyPoint>);
  final daily = results[2] as List<DailyForecast>;

  // The hourly forecast doesn't carry visibility/dew point — patch the "now"
  // entry with the real station observation, which is more accurate anyway.
  if (hourly.isNotEmpty) {
    final extras = currentResult.extras;
    final first = hourly[0];
    hourly[0] = HourlyPoint(
      time: first.time,
      temperature: first.temperature,
      precipitationProbability: first.precipitationProbability,
      weatherCode: first.weatherCode,
      windGusts: first.windGusts,
      uvIndex: first.uvIndex,
      visibility: extras.visibilityMeters ?? first.visibility,
      dewPoint: extras.dewPointF ?? first.dewPoint,
    );
  }

  return WeatherSnapshot(
    location: location,
    current: currentResult.current,
    hourly: hourly,
    daily: daily,
    fetchedAt: DateTime.now(),
  );
}
