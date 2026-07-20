import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../services/discord_service.dart';
import '../services/local_store.dart';
import '../services/weather_service.dart';
import '../theme/app_theme.dart';
import '../utils/alerts.dart';
import '../widgets/section_card.dart';

class ComposeScreen extends StatefulWidget {
  final User user;
  final LocalStore store;
  const ComposeScreen({super.key, required this.user, required this.store});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  List<DailyForecast> _daily = [];
  DailyForecast? _selectedDay;
  AlertSeverity _severity = AlertSeverity.advisory;
  final _noteController = TextEditingController();
  final Set<String> _recipientIds = {};
  bool _loading = true;
  bool _sending = false;
  String _sentFlash = '';
  late List<Friend> _friends;
  late Location _location;

  @override
  void initState() {
    super.initState();
    _friends = widget.store.getFriends();
    final locations = widget.store.getLocations();
    final activeId = widget.store.getActiveLocationId();
    _location = locations.firstWhere((l) => l.id == activeId, orElse: () => locations.first);
    _loadForecast();
  }

  Future<void> _loadForecast() async {
    try {
      final point = await fetchPointMeta(_location);
      final daily = await fetchDaily(point.forecast, _location);
      if (!mounted) return;
      setState(() {
        _daily = daily;
        _selectedDay = daily.isNotEmpty ? daily[0] : null;
        _severity = _selectedDay != null ? _riskToSeverity(_selectedDay!.risk.level) : AlertSeverity.advisory;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  AlertSeverity _riskToSeverity(RiskLevel level) {
    switch (level) {
      case RiskLevel.high:
        return AlertSeverity.emergency;
      case RiskLevel.moderate:
        return AlertSeverity.warning;
      case RiskLevel.enhanced:
        return AlertSeverity.watch;
      default:
        return AlertSeverity.advisory;
    }
  }

  Future<void> _send() async {
    if (_selectedDay == null) return;
    final textFriends = _friends.where((f) => f.deliveryMethod != DeliveryMethod.discord).toList();
    final recipients = textFriends.where((f) => _recipientIds.contains(f.id)).toList();
    final discordUrl = widget.store.getDiscordWebhookUrl();
    final willPostDiscord = discordUrl.isNotEmpty;
    if (recipients.isEmpty && !willPostDiscord) return;

    setState(() => _sending = true);
    final result = buildAlertMessage(_location.displayName, _selectedDay!, _severity, _noteController.text, null);

    for (final friend in recipients) {
      final uri = Uri.parse(buildSmsUri(friend.phone, result.body));
      await launchUrl(uri);
    }

    if (willPostDiscord) {
      try {
        await postToDiscord(discordUrl, result.headline, result.body, severityColor[_severity]!);
      } catch (_) {}
    }

    final record = AlertRecord(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      createdAt: DateTime.now(),
      recipientIds: recipients.map((f) => f.id).toList(),
      severity: _severity,
      headline: result.headline,
      message: result.body,
      locationName: _location.displayName,
    );
    final history = widget.store.getAlertHistory();
    await widget.store.setAlertHistory([record, ...history]);

    if (mounted) {
      setState(() {
        _sending = false;
        _sentFlash = 'Alert sent to ${recipients.length} friend(s)${willPostDiscord ? ' + Discord' : ''}.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final textFriends = _friends.where((f) => f.deliveryMethod != DeliveryMethod.discord).toList();
    return Scaffold(
      appBar: AppBar(
        leading: TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        leadingWidth: 80,
        title: const Text('Create Alert'),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _selectedDay == null
              ? const Center(child: Text('No forecast available.'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    SectionCard(
                      title: 'Compose Alert',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          DropdownButtonFormField<DailyForecast>(
                            value: _selectedDay,
                            decoration: const InputDecoration(labelText: 'Day'),
                            items: _daily
                                .map((d) => DropdownMenuItem(
                                      value: d,
                                      child: Text(
                                        '${DateFormat('EEE, MMM d').format(DateTime.parse(d.date))} — ${d.risk.level.label} risk',
                                      ),
                                    ))
                                .toList(),
                            onChanged: (d) => setState(() {
                              _selectedDay = d;
                              if (d != null) _severity = _riskToSeverity(d.risk.level);
                            }),
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<AlertSeverity>(
                            value: _severity,
                            decoration: const InputDecoration(labelText: 'Severity'),
                            items: AlertSeverity.values
                                .map((s) => DropdownMenuItem(value: s, child: Text(severityLabel[s]!)))
                                .toList(),
                            onChanged: (s) => setState(() => _severity = s ?? _severity),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _noteController,
                            maxLines: 2,
                            decoration: const InputDecoration(labelText: 'Personal note (optional)'),
                          ),
                          const SizedBox(height: 12),
                          if (textFriends.isEmpty)
                            const Text('Add friends first to select recipients.', style: TextStyle(color: AppColors.textFaint))
                          else
                            Wrap(
                              spacing: 8,
                              children: textFriends.map((f) {
                                final selected = _recipientIds.contains(f.id);
                                return FilterChip(
                                  label: Text(f.name),
                                  selected: selected,
                                  onSelected: (v) => setState(() {
                                    if (v) {
                                      _recipientIds.add(f.id);
                                    } else {
                                      _recipientIds.remove(f.id);
                                    }
                                  }),
                                );
                              }).toList(),
                            ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _sending ? null : _send,
                            child: Text(_sending ? 'Sending…' : 'SEND ALERT'),
                          ),
                          if (_sentFlash.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(_sentFlash, style: const TextStyle(color: Colors.lightGreenAccent)),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
