// Mirrors src/api/nwsAlerts.ts.
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

const _nwsAlertsUrl = 'https://api.weather.gov/alerts/active';

Future<List<NwsAlert>> fetchActiveAlerts(Location location) async {
  final url = Uri.parse(_nwsAlertsUrl).replace(queryParameters: {
    'point': '${location.latitude},${location.longitude}',
    'status': 'actual',
    'message_type': 'alert,update',
  });
  final res = await http.get(url, headers: {'Accept': 'application/geo+json'});
  if (res.statusCode != 200) throw Exception('NWS alerts fetch failed (${res.statusCode})');
  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final features = (data['features'] as List<dynamic>? ?? []);

  return features
      .map((f) {
        final feature = f as Map<String, dynamic>;
        final p = (feature['properties'] as Map<String, dynamic>?) ?? {};
        return NwsAlert(
          id: (feature['id'] ?? p['id'] ?? '').toString(),
          event: p['event'] as String? ?? 'Weather Alert',
          severity: p['severity'] as String? ?? 'Unknown',
          urgency: p['urgency'] as String? ?? 'Unknown',
          headline: p['headline'] as String? ?? p['event'] as String? ?? '',
          description: p['description'] as String? ?? '',
          instruction: p['instruction'] as String? ?? '',
          areaDesc: p['areaDesc'] as String? ?? '',
          senderName: p['senderName'] as String? ?? 'National Weather Service',
          effective: p['effective'] as String? ?? p['onset'] as String? ?? '',
          expires: p['expires'] as String? ?? p['ends'] as String? ?? '',
        );
      })
      .where((a) => a.id.isNotEmpty)
      .toList();
}
