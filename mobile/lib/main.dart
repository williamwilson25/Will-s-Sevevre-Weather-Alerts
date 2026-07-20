import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'firebase_options.dart';
import 'screens/sign_in_screen.dart';
import 'screens/app_shell.dart';
import 'services/local_store.dart';
import 'services/notifications_service.dart';
import 'theme/app_theme.dart';

const ownerEmail = 'williamwilson25@icloud.com';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await initNotifications();
  final store = await LocalStore.load();
  runApp(WillsWeatherAlertsApp(store: store));
}

class WillsWeatherAlertsApp extends StatelessWidget {
  final LocalStore store;
  const WillsWeatherAlertsApp({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Will's Severe Weather Alerts",
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: AuthGate(store: store),
    );
  }
}

class AuthGate extends StatelessWidget {
  final LocalStore store;
  const AuthGate({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final user = snapshot.data;
        if (user == null) return const SignInScreen();
        return AppShell(user: user, store: store);
      },
    );
  }
}
