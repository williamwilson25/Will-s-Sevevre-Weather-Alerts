// Native counterpart to src/api/pushSubscriptions.ts — mobile uses FCM
// tokens instead of raw Web Push subscriptions, so it writes an `fcmToken`
// field into the same pushSubscriptions/{uid} doc rather than `subscription`.
// The scheduled Cloud Function (functions/index.js) sends to whichever
// field(s) are present, so one doc can even hold both if a user signs in on
// web and mobile.
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../models/models.dart';

Future<bool> pushPermissionGranted() async {
  final settings = await FirebaseMessaging.instance.getNotificationSettings();
  return settings.authorizationStatus == AuthorizationStatus.authorized ||
      settings.authorizationStatus == AuthorizationStatus.provisional;
}

Future<String?> currentFcmToken() => FirebaseMessaging.instance.getToken();

Future<void> subscribeToPush(
  String uid, {
  required List<Location> locations,
  required List<String> mutedLocationIds,
  required Map<String, bool> alertTypePrefs,
}) async {
  final settings = await FirebaseMessaging.instance.requestPermission(alert: true, badge: true, sound: true);
  if (settings.authorizationStatus == AuthorizationStatus.denied) {
    throw Exception('Notifications were denied — enable them in system settings to use this.');
  }
  final token = await FirebaseMessaging.instance.getToken();
  if (token == null) throw Exception('Could not get a push token for this device.');

  await FirebaseFirestore.instance.collection('pushSubscriptions').doc(uid).set({
    'fcmToken': token,
    'locations': locations.map((l) => l.toJson()).toList(),
    'mutedLocationIds': mutedLocationIds,
    'alertTypePrefs': alertTypePrefs,
    'updatedAt': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));
}

Future<void> unsubscribeFromPush(String uid) async {
  await FirebaseMessaging.instance.deleteToken();
  await FirebaseFirestore.instance.collection('pushSubscriptions').doc(uid).set({
    'fcmToken': FieldValue.delete(),
    'updatedAt': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));
}

Future<void> syncPushPrefs(
  String uid, {
  required List<Location> locations,
  required List<String> mutedLocationIds,
  required Map<String, bool> alertTypePrefs,
}) async {
  await FirebaseFirestore.instance.collection('pushSubscriptions').doc(uid).set({
    'locations': locations.map((l) => l.toJson()).toList(),
    'mutedLocationIds': mutedLocationIds,
    'alertTypePrefs': alertTypePrefs,
    'updatedAt': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));
}
