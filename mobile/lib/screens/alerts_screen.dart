import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/local_store.dart';
import '../theme/app_theme.dart';
import '../utils/alerts.dart';
import '../widgets/section_card.dart';

class AlertsScreen extends StatefulWidget {
  final User user;
  final LocalStore store;
  const AlertsScreen({super.key, required this.user, required this.store});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  late List<Friend> _friends;
  late List<AlertRecord> _history;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  DeliveryMethod _deliveryMethod = DeliveryMethod.text;
  String _historyFilter = 'all';

  @override
  void initState() {
    super.initState();
    _friends = widget.store.getFriends();
    _history = widget.store.getAlertHistory();
  }

  void _addFriend() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    final friend = Friend(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      phone: _phoneController.text.trim(),
      deliveryMethod: _deliveryMethod,
    );
    setState(() {
      _friends = [..._friends, friend];
      _nameController.clear();
      _phoneController.clear();
    });
    widget.store.setFriends(_friends);
  }

  void _removeFriend(String id) {
    setState(() => _friends = _friends.where((f) => f.id != id).toList());
    widget.store.setFriends(_friends);
  }

  List<AlertRecord> get _filteredHistory {
    final sorted = [..._history]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    if (_historyFilter == 'all') return sorted;
    if (_historyFilter == 'warnings') {
      return sorted.where((r) => r.severity == AlertSeverity.warning || r.severity == AlertSeverity.emergency).toList();
    }
    if (_historyFilter == 'watches') return sorted.where((r) => r.severity == AlertSeverity.watch).toList();
    return sorted.where((r) => r.severity == AlertSeverity.advisory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final thisWeek = _history.where((r) => DateTime.now().difference(r.createdAt).inDays < 7).length;
    return Scaffold(
      appBar: AppBar(title: const Text('Alerts')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            title: 'Overview',
            child: Row(
              children: [
                _StatBox('${_history.length}', 'Alerts Sent'),
                _StatBox('$thisWeek', 'This Week'),
                _StatBox('${_friends.length}', 'Friends'),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SectionCard(
            title: 'Friends',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ..._friends.map((f) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(child: Text(f.name.isNotEmpty ? f.name[0].toUpperCase() : '?')),
                      title: Text(f.name),
                      subtitle: Text(f.deliveryMethod == DeliveryMethod.discord ? 'Discord' : f.phone),
                      trailing: IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => _removeFriend(f.id),
                      ),
                    )),
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name')),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Text'),
                        selected: _deliveryMethod == DeliveryMethod.text,
                        onSelected: (_) => setState(() => _deliveryMethod = DeliveryMethod.text),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Discord'),
                        selected: _deliveryMethod == DeliveryMethod.discord,
                        onSelected: (_) => setState(() => _deliveryMethod = DeliveryMethod.discord),
                      ),
                    ),
                  ],
                ),
                if (_deliveryMethod == DeliveryMethod.text) ...[
                  const SizedBox(height: 8),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Phone'),
                  ),
                ],
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _addFriend, child: const Text('Add friend')),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SectionCard(
            title: 'Sent Alerts',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  spacing: 6,
                  children: [
                    _FilterChip('All', 'all', _historyFilter, (v) => setState(() => _historyFilter = v)),
                    _FilterChip('Warnings', 'warnings', _historyFilter, (v) => setState(() => _historyFilter = v)),
                    _FilterChip('Watches', 'watches', _historyFilter, (v) => setState(() => _historyFilter = v)),
                    _FilterChip('Others', 'others', _historyFilter, (v) => setState(() => _historyFilter = v)),
                  ],
                ),
                const SizedBox(height: 8),
                if (_filteredHistory.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No alerts sent yet.', style: TextStyle(color: AppColors.textFaint)),
                  )
                else
                  ..._filteredHistory.map((r) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border(left: BorderSide(color: Color(severityColor[r.severity]!), width: 3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(severityLabel[r.severity]!,
                                style: TextStyle(color: Color(severityColor[r.severity]!), fontWeight: FontWeight.w700, fontSize: 12)),
                            Text(r.headline, style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                      )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String value;
  final String label;
  const _StatBox(this.value, this.label);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text(label.toUpperCase(), style: const TextStyle(color: AppColors.textFaint, fontSize: 10)),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String current;
  final void Function(String) onSelect;
  const _FilterChip(this.label, this.value, this.current, this.onSelect);

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: current == value,
      onSelected: (_) => onSelect(value),
      selectedColor: AppColors.accent,
      labelStyle: TextStyle(color: current == value ? Colors.white : AppColors.textMuted, fontSize: 12),
    );
  }
}
