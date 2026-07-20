import 'dart:math' as math;

/// NWS doesn't publish sunrise/sunset — computed locally via the standard
/// sunrise equation, mirroring src/utils/sunTimes.ts exactly.
class SunTimes {
  final DateTime sunrise;
  final DateTime sunset;
  const SunTimes({required this.sunrise, required this.sunset});
}

double _toRadians(double deg) => deg * math.pi / 180;
double _toDegrees(double rad) => rad * 180 / math.pi;

SunTimes computeSunTimes(DateTime date, double latitude, double longitude) {
  final julianDate = date.toUtc().millisecondsSinceEpoch / 86400000 + 2440587.5;
  final n = (julianDate - 2451545.0 + 0.0008).floorToDouble();

  final meanSolarTime = n - longitude / 360;
  final solarMeanAnomalyDeg = (357.5291 + 0.98560028 * meanSolarTime) % 360;
  final m = _toRadians(solarMeanAnomalyDeg);
  final c = 1.9148 * math.sin(m) + 0.02 * math.sin(2 * m) + 0.0003 * math.sin(3 * m);
  final eclipticLongDeg = (solarMeanAnomalyDeg + c + 180 + 102.9372) % 360;
  final lambda = _toRadians(eclipticLongDeg);

  final solarTransitJulian =
      2451545.0 + meanSolarTime + 0.0053 * math.sin(m) - 0.0069 * math.sin(2 * lambda);

  final declination = math.asin(math.sin(lambda) * math.sin(_toRadians(23.44)));
  final latRad = _toRadians(latitude);
  final cosHourAngle = (math.sin(_toRadians(-0.83)) - math.sin(latRad) * math.sin(declination)) /
      (math.cos(latRad) * math.cos(declination));

  DateTime julianToDate(double jd) =>
      DateTime.fromMillisecondsSinceEpoch(((jd - 2440587.5) * 86400000).round(), isUtc: true);

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    final transit = julianToDate(solarTransitJulian);
    return SunTimes(sunrise: transit, sunset: transit);
  }

  final hourAngle = _toDegrees(math.acos(cosHourAngle));
  return SunTimes(
    sunrise: julianToDate(solarTransitJulian - hourAngle / 360),
    sunset: julianToDate(solarTransitJulian + hourAngle / 360),
  );
}
