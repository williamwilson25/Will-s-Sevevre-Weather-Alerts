import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/local_store.dart';
import '../services/nws_alerts_service.dart';
import '../services/weather_desk_service.dart';
import '../services/weather_service.dart';
import '../theme/app_theme.dart';
import '../utils/severity.dart';
import '../widgets/section_card.dart';
import '../widgets/storm_risk_meter.dart';
import '../widgets/weather_icon.dart';

class DashboardScreen extends StatefulWidget {
  final User user;
  final LocalStore store;
  final bool isOwner;
  const DashboardScreen({super.key, required this.user, required this.store, required this.isOwner});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late List<Location> _locations;
  late String _activeId;
  WeatherSnapshot? _snapshot;
  bool _loading = true;
  String _error = '';
  List<NwsAlert> _activeAlerts = [];
  Timer? _refreshTimer;

  Location get _activeLocation =>
      _locations.firstWhere((l) => l.id == _activeId, orElse: () => _locations.first);

  @override
  void initState() {
    super.initState();
    _locations = widget.store.getLocations();
    _activeId = widget.store.getActiveLocationId();
    _load();
    _refreshTimer = Timer.periodic(const Duration(minutes: 5), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final snapshot = await fetchWeather(_activeLocation);
      final alerts = await fetchActiveAlerts(_activeLocation);
      if (!mounted) return;
      setState(() {
        _snapshot = snapshot;
        _activeAlerts = alerts;
        _loading = false;
        _error = '';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (!silent) _error = e.toString();
      });
    }
  }

  void _selectLocation(String id) {
    setState(() => _activeId = id);
    widget.store.setActiveLocationId(id);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Will's Severe Weather Alerts")),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error.isNotEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text("Couldn't load weather: $_error", textAlign: TextAlign.center),
                      ),
                    )
                  : _snapshot == null
                      ? const SizedBox.shrink()
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            _CurrentConditionsCard(snapshot: _snapshot!),
                            const SizedBox(height: 14),
                            if (_snapshot!.daily.isNotEmpty) ...[
                              SectionCard(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text("Today's Outlook", style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                                    Row(
                                      children: [
                                        Text(
                                          '${_snapshot!.daily[0].risk.level.label} Risk',
                                          style: TextStyle(
                                            color: riskColor(_snapshot!.daily[0].risk.level),
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: riskColor(_snapshot!.daily[0].risk.level).withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(999),
                                          ),
                                          child: Text('${_snapshot!.daily[0].risk.level.number}/5',
                                              style: TextStyle(color: riskColor(_snapshot!.daily[0].risk.level), fontSize: 12, fontWeight: FontWeight.w700)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 14),
                              SectionCard(
                                title: 'Storm Risk Meter',
                                child: StormRiskMeter(risk: _snapshot!.daily[0].risk),
                              ),
                              const SizedBox(height: 14),
                            ],
                            if (_activeAlerts.isNotEmpty) ...[
                              _ActiveAlertsCard(alerts: _activeAlerts),
                              const SizedBox(height: 14),
                            ],
                            _HourlyStrip(hourly: _snapshot!.hourly),
                            const SizedBox(height: 14),
                            if (_locations.length > 1) ...[
                              _SavedLocationsCard(
                                locations: _locations,
                                activeId: _activeId,
                                onSelect: _selectLocation,
                              ),
                              const SizedBox(height: 14),
                            ],
                            _WeatherDeskCard(isOwner: widget.isOwner, locationName: _activeLocation.displayName, risk: _snapshot!.daily.isNotEmpty ? _snapshot!.daily[0].risk : null),
                          ],
                        ),
        ),
      ),
    );
  }
}

class _CurrentConditionsCard extends StatelessWidget {
  final WeatherSnapshot snapshot;
  const _CurrentConditionsCard({required this.snapshot});

  @override
  Widget build(BuildContext context) {
    final c = snapshot.current;
    final today = snapshot.daily.isNotEmpty ? snapshot.daily[0] : null;
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.place_outlined, size: 16, color: AppColors.textFaint),
              const SizedBox(width: 4),
              Expanded(
                child: Text(snapshot.location.displayName,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(weatherIconFor(c.weatherCode, isDay: c.isDay), size: 56, color: AppColors.text),
              const SizedBox(width: 12),
              Text('${c.temperature.round()}°',
                  style: const TextStyle(fontSize: 56, fontWeight: FontWeight.w200)),
            ],
          ),
          Text('Feels like ${c.apparentTemperature.round()}°', style: const TextStyle(color: AppColors.textMuted)),
          if (today != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'H:${today.tempMax.round()}°  L:${today.tempMin.round()}°',
                style: const TextStyle(color: AppColors.textMuted),
              ),
            ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.9,
            children: [
              _StatTile('Humidity', '${c.humidity.round()}%'),
              _StatTile('Wind', '${c.windSpeed.round()} mph'),
              _StatTile('Gusts', '${c.windGusts.round()} mph'),
              _StatTile('Pressure', '${c.pressure.round()} hPa'),
              _StatTile('Rain', '${(c.precipitation).toStringAsFixed(2)}"'),
              if (today != null) _StatTile('Rain Chance', '${today.precipitationProbability.round()}%'),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  const _StatTile(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(color: AppColors.textFaint, fontSize: 9, fontWeight: FontWeight.w700)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ],
      ),
    );
  }
}

class _ActiveAlertsCard extends StatelessWidget {
  final List<NwsAlert> alerts;
  const _ActiveAlertsCard({required this.alerts});

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Active NWS Alerts',
      child: Column(
        children: alerts.map((alert) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
              border: const Border(left: BorderSide(color: AppColors.accent, width: 3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppColors.accent, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(alert.event, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(alert.senderName, style: const TextStyle(color: AppColors.textFaint, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _HourlyStrip extends StatelessWidget {
  final List<HourlyPoint> hourly;
  const _HourlyStrip({required this.hourly});

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Next 24 Hours',
      child: SizedBox(
        height: 100,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: hourly.length,
          itemBuilder: (context, i) {
            final h = hourly[i];
            return Container(
              width: 60,
              margin: const EdgeInsets.only(right: 12),
              child: Column(
                children: [
                  Text(i == 0 ? 'Now' : '${h.time.hour % 12 == 0 ? 12 : h.time.hour % 12}${h.time.hour >= 12 ? 'PM' : 'AM'}',
                      style: const TextStyle(color: AppColors.textFaint, fontSize: 11)),
                  const SizedBox(height: 6),
                  Icon(weatherIconFor(h.weatherCode), size: 22),
                  const SizedBox(height: 6),
                  Text('${h.temperature.round()}°', style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (h.precipitationProbability > 0)
                    Text('${h.precipitationProbability.round()}%',
                        style: const TextStyle(color: Colors.lightBlueAccent, fontSize: 10)),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SavedLocationsCard extends StatelessWidget {
  final List<Location> locations;
  final String activeId;
  final void Function(String) onSelect;
  const _SavedLocationsCard({required this.locations, required this.activeId, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Saved Locations',
      child: Column(
        children: locations.map((loc) {
          final active = loc.id == activeId;
          return ListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            leading: Icon(Icons.place, size: 18, color: active ? AppColors.accent : AppColors.textFaint),
            title: Text(loc.displayName, style: TextStyle(fontWeight: active ? FontWeight.w800 : FontWeight.w500)),
            onTap: () => onSelect(loc.id),
          );
        }).toList(),
      ),
    );
  }
}

class _WeatherDeskCard extends StatefulWidget {
  final bool isOwner;
  final String locationName;
  final SevereRisk? risk;
  const _WeatherDeskCard({required this.isOwner, required this.locationName, required this.risk});

  @override
  State<_WeatherDeskCard> createState() => _WeatherDeskCardState();
}

class _WeatherDeskCardState extends State<_WeatherDeskCard> {
  WeatherDeskMessage? _msg;
  bool _editing = false;
  final _controller = TextEditingController();
  StreamSubscription<WeatherDeskMessage?>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = watchWeatherDesk().listen((m) => setState(() => _msg = m));
  }

  @override
  void dispose() {
    _sub?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if ((_msg == null || _msg!.message.isEmpty) && !widget.isOwner) return const SizedBox.shrink();

    return SectionCard(
      title: "Will's Weather Desk",
      trailing: widget.isOwner && !_editing
          ? TextButton(
              onPressed: () {
                _controller.text = _msg?.message ?? '';
                setState(() => _editing = true);
              },
              child: const Text('Edit'),
            )
          : null,
      child: _editing
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: _controller, maxLines: 4, decoration: const InputDecoration(hintText: "Good morning! Here's what to expect today…")),
                if (widget.risk != null)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => setState(() =>
                          _controller.text = suggestWeatherDeskMessage(widget.locationName, widget.risk!)),
                      child: const Text('Suggest message for today'),
                    ),
                  ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(onPressed: () => setState(() => _editing = false), child: const Text('Cancel')),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () async {
                        await updateWeatherDesk(_controller.text.trim());
                        if (mounted) setState(() => _editing = false);
                      },
                      child: const Text('Save'),
                    ),
                  ],
                ),
              ],
            )
          : Text(
              (_msg?.message.isNotEmpty ?? false) ? _msg!.message : 'Nothing posted yet — tap Edit to write today\'s message.',
              style: TextStyle(color: (_msg?.message.isNotEmpty ?? false) ? AppColors.text : AppColors.textFaint),
            ),
    );
  }
}
