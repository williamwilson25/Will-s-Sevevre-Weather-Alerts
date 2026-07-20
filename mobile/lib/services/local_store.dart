// Mirrors src/hooks/useLocalStorage.ts — a thin SharedPreferences wrapper
// keyed the same as the web app's localStorage keys (though the two stores
// are obviously separate; same key names purely for consistency/clarity).
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../utils/alert_types.dart';

class LocalStore {
  final SharedPreferences _prefs;
  LocalStore(this._prefs);

  static Future<LocalStore> load() async => LocalStore(await SharedPreferences.getInstance());

  List<Location> getLocations() {
    final raw = _prefs.getString('sw_locations');
    if (raw == null) return [_defaultLocation];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      final locs = list.map((e) => Location.fromJson(e as Map<String, dynamic>)).toList();
      return locs.isEmpty ? [_defaultLocation] : locs;
    } catch (_) {
      return [_defaultLocation];
    }
  }

  Future<void> setLocations(List<Location> locations) =>
      _prefs.setString('sw_locations', jsonEncode(locations.map((l) => l.toJson()).toList()));

  String getActiveLocationId() => _prefs.getString('sw_active_location') ?? _defaultLocation.id;
  Future<void> setActiveLocationId(String id) => _prefs.setString('sw_active_location', id);

  List<String> getMutedLocationIds() => _prefs.getStringList('sw_muted_locations') ?? [];
  Future<void> setMutedLocationIds(List<String> ids) =>
      _prefs.setStringList('sw_muted_locations', ids);

  Map<String, bool> getAlertTypePrefs() {
    final raw = _prefs.getString('sw_notify_alert_types');
    if (raw == null) return defaultAlertTypePrefs();
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return map.map((k, v) => MapEntry(k, v as bool));
    } catch (_) {
      return defaultAlertTypePrefs();
    }
  }

  Future<void> setAlertTypePrefs(Map<String, bool> prefs) =>
      _prefs.setString('sw_notify_alert_types', jsonEncode(prefs));

  List<String> getNotifiedAlertIds() => _prefs.getStringList('sw_notified_alert_ids') ?? [];
  Future<void> setNotifiedAlertIds(List<String> ids) =>
      _prefs.setStringList('sw_notified_alert_ids', ids.length > 200 ? ids.sublist(ids.length - 200) : ids);

  bool getNotifyRain() => _prefs.getBool('sw_notify_rain') ?? false;
  Future<void> setNotifyRain(bool v) => _prefs.setBool('sw_notify_rain', v);

  List<Friend> getFriends() {
    final raw = _prefs.getString('sw_friends');
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Friend.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> setFriends(List<Friend> friends) =>
      _prefs.setString('sw_friends', jsonEncode(friends.map((f) => f.toJson()).toList()));

  List<AlertRecord> getAlertHistory() {
    final raw = _prefs.getString('sw_alert_history');
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => AlertRecord.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> setAlertHistory(List<AlertRecord> history) =>
      _prefs.setString('sw_alert_history', jsonEncode(history.map((r) => r.toJson()).toList()));

  String getDiscordWebhookUrl() => _prefs.getString('sw_discord_webhook') ?? '';
  Future<void> setDiscordWebhookUrl(String url) => _prefs.setString('sw_discord_webhook', url);
}

const _defaultLocation = Location(
  id: '4671654',
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.26715,
  longitude: -97.74306,
  timezone: 'America/Chicago',
);

Location get defaultLocation => _defaultLocation;
