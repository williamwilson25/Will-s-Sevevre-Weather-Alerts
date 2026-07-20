import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/storm_reports_service.dart';
import '../theme/app_theme.dart';
import '../widgets/section_card.dart';

class ReportsScreen extends StatefulWidget {
  final User user;
  final bool isOwner;
  const ReportsScreen({super.key, required this.user, required this.isOwner});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  StormReportType _type = StormReportType.tornado;
  final _locationController = TextEditingController();
  final _descController = TextEditingController();
  File? _photo;
  bool _sending = false;
  String _status = '';

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) setState(() => _photo = File(picked.path));
  }

  Future<void> _submit() async {
    if (_locationController.text.trim().isEmpty) return;
    setState(() {
      _sending = true;
      _status = '';
    });
    try {
      await submitStormReport(
        uid: widget.user.uid,
        email: widget.user.email ?? '',
        type: _type,
        locationName: _locationController.text.trim(),
        description: _descController.text.trim(),
        photo: _photo,
      );
      setState(() {
        _status = 'Report submitted — thanks for helping keep everyone informed!';
        _descController.clear();
        _photo = null;
      });
    } catch (e) {
      setState(() => _status = "Couldn't submit — try again in a moment.");
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Storm Reports')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            title: 'Submit a Report',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: StormReportType.values.map((t) {
                    final selected = t == _type;
                    return ChoiceChip(
                      label: Text(t.label),
                      selected: selected,
                      onSelected: (_) => setState(() => _type = t),
                      selectedColor: AppColors.accent,
                      labelStyle: TextStyle(color: selected ? Colors.white : AppColors.textMuted),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Location'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _descController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Details (optional)'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickPhoto,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: Text(_photo == null ? 'Add photo (optional)' : 'Photo attached'),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _sending ? null : _submit,
                  child: Text(_sending ? 'Submitting…' : 'Submit Report'),
                ),
                if (_status.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_status, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  ),
                const SizedBox(height: 4),
                const Text(
                  'Reports are submitted by app users, not verified by the National Weather Service — use official NWS alerts for life-safety decisions.',
                  style: TextStyle(color: AppColors.textFaint, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (widget.isOwner) ...[
            _PendingReportsCard(),
            const SizedBox(height: 14),
          ],
          _ApprovedReportsCard(),
        ],
      ),
    );
  }
}

class _PendingReportsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<StormReport>>(
      stream: watchPendingReports(),
      builder: (context, snapshot) {
        final reports = snapshot.data ?? [];
        if (reports.isEmpty) return const SizedBox.shrink();
        return SectionCard(
          title: 'Pending Approval',
          child: Column(
            children: reports
                .map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(r.type.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(r.locationName, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => moderateStormReport(r.id, StormReportStatus.approved),
                            child: const Text('Approve'),
                          ),
                          TextButton(
                            onPressed: () => moderateStormReport(r.id, StormReportStatus.rejected),
                            child: const Text('Reject', style: TextStyle(color: AppColors.textFaint)),
                          ),
                        ],
                      ),
                    ))
                .toList(),
          ),
        );
      },
    );
  }
}

class _ApprovedReportsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<StormReport>>(
      stream: watchApprovedReports(),
      builder: (context, snapshot) {
        final reports = snapshot.data ?? [];
        return SectionCard(
          title: 'Recent Reports',
          child: reports.isEmpty
              ? const Text('No reports yet.', style: TextStyle(color: AppColors.textFaint))
              : Column(
                  children: reports
                      .map((r) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(r.type.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(r.locationName, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                if (r.description.isNotEmpty) Text(r.description, style: const TextStyle(fontSize: 13)),
                              ],
                            ),
                          ))
                      .toList(),
                ),
        );
      },
    );
  }
}
