// Mirrors src/api/weatherDesk.ts and src/utils/weatherDeskSuggestion.ts.
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class WeatherDeskMessage {
  final String message;
  final DateTime updatedAt;
  const WeatherDeskMessage({required this.message, required this.updatedAt});
}

final _docRef = FirebaseFirestore.instance.collection('siteContent').doc('weatherDesk');

Stream<WeatherDeskMessage?> watchWeatherDesk() {
  return _docRef.snapshots().map((snap) {
    if (!snap.exists) return null;
    final data = snap.data()!;
    final updatedAt = data['updatedAt'];
    return WeatherDeskMessage(
      message: data['message'] as String? ?? '',
      updatedAt: updatedAt is Timestamp ? updatedAt.toDate() : DateTime.now(),
    );
  }).handleError((_) {});
}

Future<void> updateWeatherDesk(String message) async {
  await _docRef.set({'message': message, 'updatedAt': FieldValue.serverTimestamp()});
}

/// Mirrors src/utils/weatherDeskSuggestion.ts exactly.
String suggestWeatherDeskMessage(String locationName, SevereRisk risk) {
  switch (risk.level) {
    case RiskLevel.marginal:
      return 'No significant storm risk today for $locationName — should be a calm one. Enjoy!';
    case RiskLevel.slight:
      return 'A few isolated storms are possible today near $locationName. Nothing widespread expected, but keep an eye on the sky.';
    case RiskLevel.enhanced:
      return 'Scattered storms possible today for $locationName — a few could turn strong. Stay weather aware and keep your phone handy.';
    case RiskLevel.moderate:
      return 'Elevated risk of severe storms today for $locationName — damaging wind and large hail are possible. Make sure notifications are on.';
    case RiskLevel.high:
      return 'High risk of severe weather today for $locationName — tornadoes, damaging wind, and large hail are all possible. Know your safe place and stay alert.';
  }
}
