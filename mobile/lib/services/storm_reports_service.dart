// Mirrors src/api/stormReports.ts.
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/models.dart';

const _collection = 'stormReports';

StormReport _fromDoc(String id, Map<String, dynamic> data) {
  final createdAt = data['createdAt'];
  return StormReport(
    id: id,
    type: StormReportType.values.firstWhere(
      (t) => t.wireValue == data['type'],
      orElse: () => StormReportType.other,
    ),
    locationName: data['locationName'] as String? ?? '',
    description: data['description'] as String? ?? '',
    photoUrl: data['photoUrl'] as String?,
    status: StormReportStatus.values.firstWhere(
      (s) => s.name == data['status'],
      orElse: () => StormReportStatus.pending,
    ),
    submittedByUid: data['submittedByUid'] as String? ?? '',
    submittedByEmail: data['submittedByEmail'] as String? ?? '',
    createdAt: createdAt is Timestamp ? createdAt.toDate() : DateTime.now(),
  );
}

Future<void> submitStormReport({
  required String uid,
  required String email,
  required StormReportType type,
  required String locationName,
  required String description,
  File? photo,
}) async {
  String? photoUrl;
  if (photo != null) {
    final path = 'storm-reports/$uid/${DateTime.now().millisecondsSinceEpoch}-${photo.uri.pathSegments.last}';
    final ref = FirebaseStorage.instance.ref(path);
    await ref.putFile(photo);
    photoUrl = await ref.getDownloadURL();
  }

  await FirebaseFirestore.instance.collection(_collection).add({
    'type': type.wireValue,
    'locationName': locationName,
    'description': description,
    'photoUrl': photoUrl,
    'status': 'pending',
    'submittedByUid': uid,
    'submittedByEmail': email,
    'createdAt': FieldValue.serverTimestamp(),
  });
}

Stream<List<StormReport>> watchApprovedReports() {
  return FirebaseFirestore.instance
      .collection(_collection)
      .where('status', isEqualTo: 'approved')
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) => s.docs.map((d) => _fromDoc(d.id, d.data())).toList())
      .handleError((_) {});
}

Stream<List<StormReport>> watchPendingReports() {
  return FirebaseFirestore.instance
      .collection(_collection)
      .where('status', isEqualTo: 'pending')
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) => s.docs.map((d) => _fromDoc(d.id, d.data())).toList())
      .handleError((_) {});
}

Future<void> moderateStormReport(String id, StormReportStatus status) async {
  await FirebaseFirestore.instance.collection(_collection).doc(id).update({'status': status.name});
}
