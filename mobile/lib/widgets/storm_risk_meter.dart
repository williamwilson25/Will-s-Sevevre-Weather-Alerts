// Native CustomPainter port of the web app's SVG arc gauge
// (src/components/StormRiskMeter.tsx) — same 5 zones, same needle math.
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/severity.dart';

class StormRiskMeter extends StatelessWidget {
  final SevereRisk risk;
  const StormRiskMeter({super.key, required this.risk});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 130,
          width: double.infinity,
          child: CustomPaint(painter: _GaugePainter(risk)),
        ),
        const SizedBox(height: 6),
        Text(
          risk.level.label.toUpperCase(),
          style: TextStyle(color: riskColor(risk.level), fontWeight: FontWeight.w800, fontSize: 20),
        ),
        Text(
          risk.level == RiskLevel.marginal ? 'No significant storm risk today.' : 'Stay weather aware.',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
        ),
      ],
    );
  }
}

class _Zone {
  final double from;
  final double to;
  final RiskLevel level;
  const _Zone(this.from, this.to, this.level);
}

const _zones = [
  _Zone(0, 15, RiskLevel.marginal),
  _Zone(15, 30, RiskLevel.slight),
  _Zone(30, 50, RiskLevel.enhanced),
  _Zone(50, 70, RiskLevel.moderate),
  _Zone(70, 100, RiskLevel.high),
];

class _GaugePainter extends CustomPainter {
  final SevereRisk risk;
  _GaugePainter(this.risk);

  double _angleFor(double score) => math.pi - (score.clamp(0, 100) / 100) * math.pi;

  Offset _pointAt(Offset center, double radius, double score) {
    final angle = _angleFor(score);
    return Offset(center.dx + radius * math.cos(angle), center.dy - radius * math.sin(angle));
  }

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height - 10);
    final radius = math.min(size.width / 2 - 16, size.height - 20);

    for (final zone in _zones) {
      final paint = Paint()
        ..color = riskColor(zone.level).withOpacity(risk.level == zone.level ? 1 : 0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14
        ..strokeCap = StrokeCap.round;
      final startAngle = math.pi - (zone.from / 100) * math.pi;
      final sweep = -((zone.to - zone.from) / 100) * math.pi;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweep,
        false,
        paint,
      );
    }

    final needleEnd = _pointAt(center, radius - 16, risk.score);
    final needlePaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(center, needleEnd, needlePaint);
    canvas.drawCircle(center, 6, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) => oldDelegate.risk != risk;
}
