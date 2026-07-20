// Mirrors src/utils/alerts.ts.
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:intl/intl.dart';
import '../models/models.dart';

const Map<AlertSeverity, String> severityLabel = {
  AlertSeverity.advisory: 'Weather Advisory',
  AlertSeverity.watch: 'Severe Weather Watch',
  AlertSeverity.warning: 'Severe Weather Warning',
  AlertSeverity.emergency: 'Weather Emergency',
};

const Map<AlertSeverity, int> severityColor = {
  AlertSeverity.advisory: 0xFF38BDF8,
  AlertSeverity.watch: 0xFFEAB308,
  AlertSeverity.warning: 0xFFF97316,
  AlertSeverity.emergency: 0xFFEF4444,
};

({String headline, String body}) buildAlertMessage(
  String locationName,
  DailyForecast day,
  AlertSeverity severity,
  String customNote,
  String? typeLabel,
) {
  final date = DateTime.parse(day.date);
  final dateLabel = DateFormat('EEEE, MMM d').format(date);

  final headline =
      '${(typeLabel != null && typeLabel.isNotEmpty) ? typeLabel : severityLabel[severity]} for $locationName — $dateLabel';

  final lines = <String>[headline];
  final note = customNote.trim();
  if (note.isNotEmpty) {
    lines.addAll(['', 'Note: $note']);
  }
  lines.addAll(['', "Sent via Will's Severe Weather Alerts"]);

  return (headline: headline, body: lines.join('\n'));
}

/// sms: URIs differ by platform — iOS uses "&body=", Android uses "?body=".
String buildSmsUri(String phone, String body) {
  final encoded = Uri.encodeComponent(body);
  final separator = (!kIsWeb && Platform.isIOS) ? '&' : '?';
  return 'sms:$phone$separator' 'body=$encoded';
}
