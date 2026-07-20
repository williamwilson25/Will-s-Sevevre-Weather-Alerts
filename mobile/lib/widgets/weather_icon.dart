import 'package:flutter/material.dart';

/// Simplified icon mapping for the WMO-style codes used throughout the app
/// (src/components/WeatherIcon.tsx has the full custom-SVG version on web;
/// this is the native equivalent using Material icons).
IconData weatherIconFor(int code, {bool isDay = true}) {
  if (code == 99) return Icons.storm; // tornado — no dedicated icon, storm is closest
  if (code == 96) return Icons.thunderstorm; // severe t-storm w/ hail
  if (code == 95) return Icons.thunderstorm;
  if (code >= 71 && code <= 86) return Icons.ac_unit; // snow
  if (code == 66 || code == 56) return Icons.severe_cold;
  if (code >= 61 && code <= 65) return Icons.water_drop;
  if (code >= 80 && code <= 82) return Icons.grain;
  if (code == 51) return Icons.grain;
  if (code == 45) return Icons.foggy;
  if (code == 3) return Icons.cloud;
  if (code == 2) return isDay ? Icons.wb_cloudy : Icons.nights_stay;
  if (code == 1) return isDay ? Icons.wb_sunny : Icons.nightlight_round;
  return isDay ? Icons.wb_sunny : Icons.nightlight_round; // 0 = clear
}
