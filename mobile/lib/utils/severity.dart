// Mirrors src/utils/severity.ts exactly — same thresholds, same reasons text.
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class RiskInput {
  final int weatherCode;
  final double windGustsMax;
  final double precipitationProbability;

  const RiskInput({
    required this.weatherCode,
    required this.windGustsMax,
    required this.precipitationProbability,
  });
}

const _thunderstormCodes = {95, 96, 99};
const _hailCodes = {96, 99};
const _heavyShowerCodes = {65, 67, 75, 82, 86};

SevereRisk assessDailyRisk(RiskInput input) {
  final reasons = <String>[];
  double score = 0;

  if (_thunderstormCodes.contains(input.weatherCode)) {
    score += 45;
    reasons.add('Thunderstorms expected');
  }
  if (_hailCodes.contains(input.weatherCode)) {
    score += 20;
    reasons.add('Possible hail');
  }
  if (_heavyShowerCodes.contains(input.weatherCode)) {
    score += 15;
    reasons.add('Heavy precipitation expected');
  }

  if (input.windGustsMax >= 58) {
    score += 35;
    reasons.add('Damaging gusts up to ${input.windGustsMax.round()} mph');
  } else if (input.windGustsMax >= 45) {
    score += 20;
    reasons.add('Strong gusts up to ${input.windGustsMax.round()} mph');
  } else if (input.windGustsMax >= 35) {
    score += 8;
    reasons.add('Gusty winds up to ${input.windGustsMax.round()} mph');
  }

  if (input.precipitationProbability >= 70) {
    score += 10;
    reasons.add('${input.precipitationProbability.round()}% chance of precipitation');
  }

  score = score.clamp(0, 100);

  var level = RiskLevel.marginal;
  if (score >= 70) {
    level = RiskLevel.high;
  } else if (score >= 50) {
    level = RiskLevel.moderate;
  } else if (score >= 30) {
    level = RiskLevel.enhanced;
  } else if (score >= 15) {
    level = RiskLevel.slight;
  }

  if (reasons.isEmpty) reasons.add('No significant severe weather signals');

  return SevereRisk(level: level, score: score, reasons: reasons);
}

Color riskColor(RiskLevel level) => switch (level) {
      RiskLevel.marginal => AppColors.riskMarginal,
      RiskLevel.slight => AppColors.riskSlight,
      RiskLevel.enhanced => AppColors.riskEnhanced,
      RiskLevel.moderate => AppColors.riskModerate,
      RiskLevel.high => AppColors.riskHigh,
    };
