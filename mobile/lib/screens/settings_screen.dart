import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../services/local_store.dart';
import '../services/push_service.dart' as push;
import '../theme/app_theme.dart';
import '../widgets/section_card.dart';

class SettingsScreen extends StatefulWidget {
  final User user;
  final LocalStore store;
  const SettingsScreen({super.key, required this.user, required this.store});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushBusy = false;
  bool _pushEnabled = false;
  String _pushError = '';

  @override
  void initState() {
    super.initState();
    push.pushPermissionGranted().then((v) => setState(() => _pushEnabled = v));
  }

  Future<void> _togglePush(bool enabled) async {
    setState(() {
      _pushBusy = true;
      _pushError = '';
    });
    try {
      if (enabled) {
        await push.subscribeToPush(
          widget.user.uid,
          locations: widget.store.getLocations(),
          mutedLocationIds: widget.store.getMutedLocationIds(),
          alertTypePrefs: widget.store.getAlertTypePrefs(),
        );
      } else {
        await push.unsubscribeFromPush(widget.user.uid);
      }
      setState(() => _pushEnabled = enabled);
    } catch (e) {
      setState(() => _pushError = e.toString());
    } finally {
      if (mounted) setState(() => _pushBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          SectionCard(
            child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.person_outline),
                  title: Text(widget.user.email ?? ''),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  secondary: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Always-On Alerts'),
                  subtitle: const Text('Get severe weather alerts even when the app is closed.'),
                  value: _pushEnabled,
                  onChanged: _pushBusy ? null : _togglePush,
                ),
                if (_pushError.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(_pushError, style: const TextStyle(color: AppColors.accent, fontSize: 12)),
                  ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.people_outline),
                  title: const Text('Invite Friends'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Share.share(
                    "Get free severe weather alerts for your area — check out Will's Severe Weather Alerts.",
                  ),
                ),
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.dark_mode_outlined),
                  title: Text('App Theme'),
                  trailing: Text('Dark', style: TextStyle(color: AppColors.textMuted)),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.logout, color: AppColors.accent),
                  title: const Text('Logout', style: TextStyle(color: AppColors.accent)),
                  onTap: () => FirebaseAuth.instance.signOut(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
