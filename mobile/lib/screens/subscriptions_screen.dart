import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/local_store.dart';
import '../services/weather_service.dart';
import '../theme/app_theme.dart';
import '../utils/alert_types.dart';
import '../widgets/section_card.dart';

class SubscriptionsScreen extends StatefulWidget {
  final LocalStore store;
  const SubscriptionsScreen({super.key, required this.store});

  @override
  State<SubscriptionsScreen> createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen> {
  late List<Location> _locations;
  late List<String> _muted;
  late Map<String, bool> _alertTypePrefs;
  final _searchController = TextEditingController();
  List<Location> _searchResults = [];
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _locations = widget.store.getLocations();
    _muted = widget.store.getMutedLocationIds();
    _alertTypePrefs = widget.store.getAlertTypePrefs();
  }

  Future<void> _search(String query) async {
    if (query.trim().length < 2) {
      setState(() => _searchResults = []);
      return;
    }
    setState(() => _searching = true);
    try {
      final results = await searchLocations(query);
      if (mounted) setState(() => _searchResults = results);
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _addLocation(Location loc) {
    if (_locations.any((l) => l.id == loc.id)) return;
    setState(() {
      _locations = [..._locations, loc];
      _searchResults = [];
      _searchController.clear();
    });
    widget.store.setLocations(_locations);
  }

  void _removeLocation(String id) {
    if (_locations.length <= 1) return;
    setState(() => _locations = _locations.where((l) => l.id != id).toList());
    widget.store.setLocations(_locations);
  }

  void _toggleMuted(String id, bool muted) {
    setState(() {
      _muted = muted ? [..._muted, id] : _muted.where((m) => m != id).toList();
    });
    widget.store.setMutedLocationIds(_muted);
  }

  void _toggleAlertType(String key, bool enabled) {
    setState(() => _alertTypePrefs = {..._alertTypePrefs, key: enabled});
    widget.store.setAlertTypePrefs(_alertTypePrefs);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Subscriptions')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            title: 'My Counties',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ...(_locations.map((loc) {
                  final muted = _muted.contains(loc.id);
                  return Row(
                    children: [
                      const Icon(Icons.place_outlined, size: 16, color: AppColors.textFaint),
                      const SizedBox(width: 6),
                      Expanded(child: Text(loc.displayName, style: const TextStyle(fontWeight: FontWeight.w600))),
                      Switch(value: !muted, onChanged: (v) => _toggleMuted(loc.id, !v)),
                      if (_locations.length > 1)
                        IconButton(
                          icon: const Icon(Icons.close, size: 18, color: AppColors.textFaint),
                          onPressed: () => _removeLocation(loc.id),
                        ),
                    ],
                  );
                })),
                const SizedBox(height: 8),
                TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(hintText: 'Add a city, e.g. Dallas, TX'),
                  onChanged: _search,
                ),
                if (_searching) const Padding(padding: EdgeInsets.only(top: 8), child: Text('Searching…')),
                ..._searchResults.map((loc) => ListTile(
                      dense: true,
                      title: Text(loc.name),
                      subtitle: Text([loc.admin1, loc.country].where((s) => s != null && s.isNotEmpty).join(', ')),
                      onTap: () => _addLocation(loc),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SectionCard(
            title: 'Notifications',
            child: Column(
              children: alertTypeConfigs.map((config) {
                return SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(config.label),
                  value: _alertTypePrefs[config.key] ?? config.defaultEnabled,
                  onChanged: (v) => _toggleAlertType(config.key, v),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
