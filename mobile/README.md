# Will's Severe Weather Alerts — mobile app

Native iOS/Android rewrite in Flutter, built to ship on the App Store and Google
Play. Points at the **same Firebase project** as the web app (`../` at the repo
root), so an account and its data (saved locations, storm reports, weather
desk, subscriptions) work on either client.

This app was ported feature-for-feature from the web app — see each `lib/`
file's header comment for which `src/` file it mirrors.

## What's built

- Sign in / sign up (Firebase Auth)
- Dashboard: current conditions, 5-tier SPC risk gauge, active NWS alerts,
  hourly strip, saved locations, Will's Weather Desk (with the "suggest a
  message" helper)
- Live Radar / Storm Outlook (NWS / SPC embeds via in-app WebView)
- Storm Reports: submit with a photo, owner moderation queue, public feed
- My Subscriptions: per-location mute toggle + per-alert-type notification prefs
- Settings, including the **Always-On Alerts** toggle (real push via FCM —
  works even when the app is closed, unlike the web app's tab-open-only local
  polling)
- Alerts (owner only): friends, stats, sent-alert history with filters
- Create Alert composer: day/severity picker, SMS + Discord delivery

## What's NOT done yet

- App icons/splash screens generated for iOS/Android from the existing logo
  (still using Flutter's default icon)
- A few secondary web-app widgets weren't ported in this first pass: the rain
  nowcast bar chart, Storm Arrival Timer, Storm Safety accordion, detailed NWS
  forecast text card
- `functions/index.js` (the scheduled Cloud Function) only sends Web Push —
  it needs a small addition to also send FCM messages to mobile subscribers
  before Always-On Alerts actually reaches this app in the background

## Setup this sandbox could NOT do (needs your action)

### 1. Register the Android and iOS apps in Firebase

This project's Firebase console has no CLI login from this sandbox, so the
apps for these two platforms were never registered — `lib/firebase_options.dart`
has real values for everything shared across platforms, but placeholder
`appId` values that need replacing:

1. Firebase console → **wills-severe-weather-alerts** → Project settings → Add app → **Android**.
   - Package name: `com.willsweatheralerts.wills_weather_alerts` (already set in `android/app/build.gradle`).
   - Download `google-services.json` → put it at `android/app/google-services.json`.
2. Add app → **iOS**.
   - Bundle ID: `com.willsweatheralerts.willsWeatherAlerts` (already set in the Xcode project).
   - Download `GoogleService-Info.plist` → put it at `ios/Runner/GoogleService-Info.plist`,
     and add it to the Xcode project (Runner target → Build Phases → Copy
     Bundle Resources) — this step needs Xcode, so it has to happen on a Mac
     or in the CI workflow.
3. Both consoles show you an `appId` (format `1:905467059263:android:...` /
   `...:ios:...`) — paste those into `lib/firebase_options.dart` replacing
   `ANDROID_APP_ID_PLACEHOLDER` / `IOS_APP_ID_PLACEHOLDER`.

### 2. Apple Developer + Google Play accounts

- Apple Developer Program: $99/year, your own Apple ID.
- Google Play Console: $25 one-time, your own Google account.

Neither can be created on your behalf — they need your identity and payment.

### 3. iOS builds via GitHub Actions (macOS runner)

Since this sandbox is Linux, iOS can't be built or signed here. A GitHub
Actions workflow using `macos-latest` handles this instead — see
`.github/workflows/` at the repo root. It needs these repo secrets, which
only you can generate (from Xcode or Apple Developer portal):
- An App Store Connect API key (or a distribution certificate + provisioning
  profile) for code signing.
- The `GoogleService-Info.plist` contents from step 1, since CI needs it too.

### 4. Store listings

Screenshots, description, privacy policy, and the actual submission/review
process all happen in App Store Connect and Google Play Console directly —
those are manual steps in each console once a signed build exists.

## Local development

```bash
cd mobile
flutter pub get
flutter analyze        # static checks — works without any SDK/emulator
flutter run             # needs a connected device/emulator or `flutter build web`
```
