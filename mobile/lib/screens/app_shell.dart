import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../main.dart' show ownerEmail;
import '../services/local_store.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'radar_screen.dart';
import 'more_screen.dart';
import 'alerts_screen.dart';
import 'compose_screen.dart';

/// Top-level navigation shell — mirrors the web app's bottom nav:
/// Dashboard / Alerts / [+] / Radar / More for the owner,
/// Dashboard / Radar / More for everyone else.
class AppShell extends StatefulWidget {
  final User user;
  final LocalStore store;
  const AppShell({super.key, required this.user, required this.store});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  bool get _isOwner => (widget.user.email ?? '').toLowerCase() == ownerEmail.toLowerCase();

  void _openCompose() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ComposeScreen(user: widget.user, store: widget.store),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      DashboardScreen(user: widget.user, store: widget.store, isOwner: _isOwner),
      if (_isOwner) AlertsScreen(user: widget.user, store: widget.store),
      const RadarScreen(),
      MoreScreen(user: widget.user, store: widget.store, isOwner: _isOwner),
    ];

    final navItems = <BottomNavigationBarItem>[
      const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Dashboard'),
      if (_isOwner)
        const BottomNavigationBarItem(
          icon: Icon(Icons.notifications_outlined),
          activeIcon: Icon(Icons.notifications),
          label: 'Alerts',
        ),
      const BottomNavigationBarItem(icon: Icon(Icons.radar_outlined), activeIcon: Icon(Icons.radar), label: 'Radar'),
      const BottomNavigationBarItem(icon: Icon(Icons.more_horiz), label: 'More'),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: tabs),
      floatingActionButton: _isOwner
          ? FloatingActionButton(
              onPressed: _openCompose,
              backgroundColor: AppColors.accent,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: navItems,
      ),
    );
  }
}
