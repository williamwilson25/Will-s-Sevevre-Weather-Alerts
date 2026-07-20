// Mirrors src/utils/discord.ts.
import 'dart:convert';
import 'package:http/http.dart' as http;

int _colorToInt(int argb) => argb & 0xFFFFFF;

Future<void> postToDiscord(String webhookUrl, String headline, String body, int colorArgb) async {
  final res = await http.post(
    Uri.parse(webhookUrl),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'embeds': [
        {
          'title': headline,
          'description': body,
          'color': _colorToInt(colorArgb),
          'timestamp': DateTime.now().toIso8601String(),
        },
      ],
    }),
  );
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw Exception('Discord webhook failed (${res.statusCode})');
  }
}
