// Mirrors src/types.ts from the web app one-to-one so the two clients stay
// in sync conceptually, even though they're separate codebases.

class Location {
  final String id;
  final String name;
  final String? admin1;
  final String country;
  final double latitude;
  final double longitude;
  final String timezone;

  const Location({
    required this.id,
    required this.name,
    this.admin1,
    required this.country,
    required this.latitude,
    required this.longitude,
    required this.timezone,
  });

  factory Location.fromJson(Map<String, dynamic> json) => Location(
        id: json['id'].toString(),
        name: json['name'] as String,
        admin1: json['admin1'] as String?,
        country: json['country'] as String? ?? '',
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        timezone: json['timezone'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'admin1': admin1,
        'country': country,
        'latitude': latitude,
        'longitude': longitude,
        'timezone': timezone,
      };

  String get displayName => admin1 != null && admin1!.isNotEmpty ? '$name, $admin1' : name;
}

class CurrentConditions {
  final double temperature;
  final double apparentTemperature;
  final double humidity;
  final double windSpeed;
  final double windGusts;
  final double windDirection;
  final double precipitation;
  final int weatherCode;
  final bool isDay;
  final String time;
  final double pressure;

  const CurrentConditions({
    required this.temperature,
    required this.apparentTemperature,
    required this.humidity,
    required this.windSpeed,
    required this.windGusts,
    required this.windDirection,
    required this.precipitation,
    required this.weatherCode,
    required this.isDay,
    required this.time,
    required this.pressure,
  });
}

class HourlyPoint {
  final DateTime time;
  final double temperature;
  final double precipitationProbability;
  final int weatherCode;
  final double windGusts;
  final double uvIndex;
  final double visibility;
  final double dewPoint;

  const HourlyPoint({
    required this.time,
    required this.temperature,
    required this.precipitationProbability,
    required this.weatherCode,
    required this.windGusts,
    required this.uvIndex,
    required this.visibility,
    required this.dewPoint,
  });
}

/// Matches NOAA SPC's real 5-tier categorical outlook naming/ordering.
enum RiskLevel { marginal, slight, enhanced, moderate, high }

extension RiskLevelX on RiskLevel {
  String get label => switch (this) {
        RiskLevel.marginal => 'Marginal',
        RiskLevel.slight => 'Slight',
        RiskLevel.enhanced => 'Enhanced',
        RiskLevel.moderate => 'Moderate',
        RiskLevel.high => 'High',
      };

  int get number => switch (this) {
        RiskLevel.marginal => 1,
        RiskLevel.slight => 2,
        RiskLevel.enhanced => 3,
        RiskLevel.moderate => 4,
        RiskLevel.high => 5,
      };
}

class SevereRisk {
  final RiskLevel level;
  final double score;
  final List<String> reasons;

  const SevereRisk({required this.level, required this.score, required this.reasons});
}

class DailyForecast {
  final String date;
  final int weatherCode;
  final double tempMax;
  final double tempMin;
  final double precipitationProbability;
  final double windSpeedMax;
  final double windGustsMax;
  final double windDirection;
  final double uvIndexMax;
  final DateTime sunrise;
  final DateTime sunset;
  final SevereRisk risk;

  const DailyForecast({
    required this.date,
    required this.weatherCode,
    required this.tempMax,
    required this.tempMin,
    required this.precipitationProbability,
    required this.windSpeedMax,
    required this.windGustsMax,
    required this.windDirection,
    required this.uvIndexMax,
    required this.sunrise,
    required this.sunset,
    required this.risk,
  });
}

class WeatherSnapshot {
  final Location location;
  final CurrentConditions current;
  final List<HourlyPoint> hourly;
  final List<DailyForecast> daily;
  final DateTime fetchedAt;

  const WeatherSnapshot({
    required this.location,
    required this.current,
    required this.hourly,
    required this.daily,
    required this.fetchedAt,
  });
}

class Subscriber {
  final String uid;
  final String email;
  final String phone;
  final Location location;

  const Subscriber({
    required this.uid,
    required this.email,
    required this.phone,
    required this.location,
  });
}

enum DeliveryMethod { text, discord }

class Friend {
  final String id;
  final String name;
  final String phone;
  final DeliveryMethod deliveryMethod;
  final Location? location;
  final String? uid;

  const Friend({
    required this.id,
    required this.name,
    required this.phone,
    this.deliveryMethod = DeliveryMethod.text,
    this.location,
    this.uid,
  });

  factory Friend.fromJson(Map<String, dynamic> json) => Friend(
        id: json['id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String? ?? '',
        deliveryMethod:
            json['deliveryMethod'] == 'discord' ? DeliveryMethod.discord : DeliveryMethod.text,
        location: json['location'] != null
            ? Location.fromJson(json['location'] as Map<String, dynamic>)
            : null,
        uid: json['uid'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'deliveryMethod': deliveryMethod == DeliveryMethod.discord ? 'discord' : 'text',
        'location': location?.toJson(),
        'uid': uid,
      };
}

enum AlertSeverity { advisory, watch, warning, emergency }

extension AlertSeverityX on AlertSeverity {
  String get label => switch (this) {
        AlertSeverity.advisory => 'Advisory',
        AlertSeverity.watch => 'Watch',
        AlertSeverity.warning => 'Warning',
        AlertSeverity.emergency => 'Emergency',
      };
}

class AlertRecord {
  final String id;
  final DateTime createdAt;
  final List<String> recipientIds;
  final AlertSeverity severity;
  final String headline;
  final String message;
  final String locationName;

  const AlertRecord({
    required this.id,
    required this.createdAt,
    required this.recipientIds,
    required this.severity,
    required this.headline,
    required this.message,
    required this.locationName,
  });

  factory AlertRecord.fromJson(Map<String, dynamic> json) => AlertRecord(
        id: json['id'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        recipientIds: (json['recipientIds'] as List).map((e) => e.toString()).toList(),
        severity: AlertSeverity.values.firstWhere(
          (s) => s.name == json['severity'],
          orElse: () => AlertSeverity.advisory,
        ),
        headline: json['headline'] as String,
        message: json['message'] as String,
        locationName: json['locationName'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'createdAt': createdAt.toIso8601String(),
        'recipientIds': recipientIds,
        'severity': severity.name,
        'headline': headline,
        'message': message,
        'locationName': locationName,
      };
}

enum StormReportType { tornado, hail, wind, flooding, powerOutage, other }

extension StormReportTypeX on StormReportType {
  String get wireValue => switch (this) {
        StormReportType.tornado => 'tornado',
        StormReportType.hail => 'hail',
        StormReportType.wind => 'wind',
        StormReportType.flooding => 'flooding',
        StormReportType.powerOutage => 'power_outage',
        StormReportType.other => 'other',
      };

  String get label => switch (this) {
        StormReportType.tornado => 'Tornado',
        StormReportType.hail => 'Hail',
        StormReportType.wind => 'Wind Damage',
        StormReportType.flooding => 'Flooding',
        StormReportType.powerOutage => 'Power Outage',
        StormReportType.other => 'Other',
      };
}

enum StormReportStatus { pending, approved, rejected }

class StormReport {
  final String id;
  final StormReportType type;
  final String locationName;
  final String description;
  final String? photoUrl;
  final StormReportStatus status;
  final String submittedByUid;
  final String submittedByEmail;
  final DateTime createdAt;

  const StormReport({
    required this.id,
    required this.type,
    required this.locationName,
    required this.description,
    this.photoUrl,
    required this.status,
    required this.submittedByUid,
    required this.submittedByEmail,
    required this.createdAt,
  });
}

class NwsAlert {
  final String id;
  final String event;
  final String severity;
  final String urgency;
  final String headline;
  final String description;
  final String instruction;
  final String areaDesc;
  final String senderName;
  final String effective;
  final String expires;

  const NwsAlert({
    required this.id,
    required this.event,
    required this.severity,
    required this.urgency,
    required this.headline,
    required this.description,
    required this.instruction,
    required this.areaDesc,
    required this.senderName,
    required this.effective,
    required this.expires,
  });
}
