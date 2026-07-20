// Local/foreground notifications — used for the same "rain starting soon"
// and in-app severe-alert polling paths the web app's src/utils/notify.ts
// covers, plus showing a banner when an FCM message arrives while the app
// is already open (iOS doesn't do this automatically).
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
int _notificationId = 0;

Future<void> initNotifications() async {
  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosInit = DarwinInitializationSettings();
  await _plugin.initialize(
    const InitializationSettings(android: androidInit, iOS: iosInit),
  );
}

Future<void> showLocalNotification(String title, String body) async {
  const androidDetails = AndroidNotificationDetails(
    'severe_weather_alerts',
    'Severe Weather Alerts',
    channelDescription: 'Storm alerts and rain notifications',
    importance: Importance.high,
    priority: Priority.high,
  );
  const iosDetails = DarwinNotificationDetails();
  await _plugin.show(
    _notificationId++,
    title,
    body,
    const NotificationDetails(android: androidDetails, iOS: iosDetails),
  );
}
