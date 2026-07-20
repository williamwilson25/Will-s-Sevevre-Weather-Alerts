import 'package:flutter/material.dart';

/// Matches the web app's red/black theme (src/styles/index.css :root vars).
class AppColors {
  static const accent = Color(0xFFFF3B30);
  static const accentStrong = Color(0xFFDC2626);
  static const background = Color(0xFF000000);
  static const surface = Color(0x17FFFFFF); // rgba(255,255,255,0.09)
  static const surfaceStrong = Color(0x2EFFFFFF); // rgba(255,255,255,0.18)
  static const border = Color(0x21FFFFFF); // rgba(255,255,255,0.13)
  static const text = Color(0xFFF8FAFC);
  static const textMuted = Color(0xB8F8FAFC);
  static const textFaint = Color(0x80F8FAFC);

  // Risk tiers, matching src/utils/severity.ts RISK_COLOR (5-level SPC scale)
  static const riskMarginal = Color(0xFF4ADE80);
  static const riskSlight = Color(0xFFEAB308);
  static const riskEnhanced = Color(0xFFF97316);
  static const riskModerate = Color(0xFFEF4444);
  static const riskHigh = Color(0xFFD946EF);
}

ThemeData buildAppTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.accent,
      secondary: AppColors.accentStrong,
      surface: AppColors.background,
      onSurface: AppColors.text,
    ),
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
      fontFamily: 'Inter',
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.text,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.3),
      ),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.all(AppColors.text),
      trackColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected)
            ? AppColors.accentStrong
            : Colors.white.withOpacity(0.16),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xDC05080F),
      selectedItemColor: AppColors.accent,
      unselectedItemColor: AppColors.textFaint,
      type: BottomNavigationBarType.fixed,
    ),
  );
}
