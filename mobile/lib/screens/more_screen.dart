import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../services/local_store.dart';
import 'outlook_screen.dart';
import 'reports_screen.dart';
import 'subscriptions_screen.dart';
import 'settings_screen.dart';

class MoreScreen extends StatelessWidget {
  final User user;
  final LocalStore store;
  final bool isOwner;
  const MoreScreen({super.key, required this.user, required this.store, required this.isOwner});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.map_outlined),
            title: const Text('Storm Outlook'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OutlookScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined),
            title: const Text('Storm Reports'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ReportsScreen(user: user, isOwner: isOwner)),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.location_on_outlined),
            title: const Text('My Subscriptions'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => SubscriptionsScreen(store: store)),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Settings'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => SettingsScreen(user: user, store: store)),
            ),
          ),
        ],
      ),
    );
  }
}
