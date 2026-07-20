// Mirrors src/api/subscribers.ts.
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

Future<void> saveSubscriber(String uid, String email, String phone, Location location) async {
  await FirebaseFirestore.instance.collection('subscribers').doc(uid).set({
    'email': email,
    'phone': phone,
    'location': location.toJson(),
    'createdAt': FieldValue.serverTimestamp(),
  });
}

Stream<List<Subscriber>> watchSubscribers() {
  return FirebaseFirestore.instance.collection('subscribers').snapshots().map(
        (snapshot) => snapshot.docs.map((d) {
          final data = d.data();
          return Subscriber(
            uid: d.id,
            email: data['email'] as String? ?? '',
            phone: data['phone'] as String? ?? '',
            location: Location.fromJson(data['location'] as Map<String, dynamic>),
          );
        }).toList(),
      );
}
