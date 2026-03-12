# Bolkar — Bol. Type mat kar.

**[bolkar.online](https://bolkar.online)** &nbsp;·&nbsp; **[Android App](https://appdistribution.firebase.dev/i/3dde171a6f60bef3)** &nbsp;·&nbsp; [Product Requirements Document](./Bolkar_PRD_v1.md) &nbsp;·&nbsp; [Changelog](./CHANGELOG.md)

---

## What is Bolkar?

Bolkar is an India-first, zero-signup voice-to-text app. You speak — in Hindi, Hinglish, Tamil, Telugu, Bengali, Kannada, Marathi, or any of 22 Indian languages — and Bolkar instantly transcribes it and pastes it directly into whatever you're typing in.

**The problem it solves:** Typing in Indian languages on a phone is slow, error-prone, and forces language-switching. Bolkar removes all friction — speak naturally, get clean text in under 3 seconds, pasted directly into any app.

### Key capabilities

- **Two modes** — *To English*: translate any language to professional English. *As Spoken*: transcribe and keep text in the same language spoken.
- **Automatic language detection** — no need to select a language; Sarvam detects it from the audio.
- **Zero account required** — open the URL or launch the app and start recording immediately.
- **Works everywhere** — native Android floating bubble over any app with direct text injection, desktop floating bubble via Picture-in-Picture (always on top), installable as a PWA on Android and desktop.
- **Direct text injection** — accessibility service pastes text directly into WhatsApp, Gmail, Instagram, Telegram, Chrome, and any other app without a manual paste step.
- **History** — conversions stored server-side and synced across sessions.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Web Framework | Next.js 16 (App Router) |
| Mobile Framework | Expo 55 + React Native 0.83 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first `@theme` config) |
| UI | React 19 (web) / React Native (mobile) |
| Speech AI | [Sarvam AI](https://sarvam.ai) — Saaras v3 model |
| PWA | `manifest.json` + Service Worker |
| Analytics | Google Analytics GA4 |
| Hosting | GCP VM + nginx |
| Domain | `bolkar.online` — registered on GoDaddy, DNS configured to GCP VM |

### Sarvam AI endpoints used

| Mode | Endpoint |
|---|---|
| To English (translate) | `POST https://api.sarvam.ai/speech-to-text-translate` |
| As Spoken (transcribe) | `POST https://api.sarvam.ai/speech-to-text` |

Both use `model=saaras:v3` and `language_code=unknown` for automatic detection.

---

## Analytics

Google Analytics GA4 property **`G-FVBM65R4KJ`** is integrated and tracks page views, sessions, user geography, and engagement automatically.

[Open Analytics Dashboard →](https://analytics.google.com/analytics/web/#/p471747799/reports/intelligenthome)

Phase 2 will add custom recording-level events (conversion count, mode split, language distribution, session depth).

---

## Phase 1 — What's Built

Released March 2026. Full details in the [Changelog](./CHANGELOG.md) and [PRD](./Bolkar_PRD_v1.md).

### Landing page (`/`)
- Hero with animated headline, tagline, and CTAs
- Stats bar — 22 languages, 4× faster than typing, zero signup
- Scrolling language chip carousel (22 Indian languages)
- Use-case accordion — 6 personas with before/after examples
- Sticky frosted-glass nav with Bolkar logo and Sarvam badge

### App (`/app`)
- Mode toggle (To English / As Spoken) with language-cycling labels synced to example card
- Rotating example card — 6 examples per mode, auto-advances every 5 s
- Mic button with 4 states: Idle → Recording (live waveform + timer) → Processing → Result
- Result card: auto-copy to clipboard, speed badge, Edit, Dismiss, 10 s auto-dismiss
- History panel — conversions stored server-side and accessible across sessions
- Float it — Picture-in-Picture bubble with full recording flow, always on top
- Pin it — persistent Android notification for quick access

---

## Phase 2 — Native Android App

Built March 2026. Full details in the [Changelog](./CHANGELOG.md).

### What's in the app

- **Floating mic bubble** — system-wide overlay (`SYSTEM_ALERT_WINDOW` permission) that appears over WhatsApp, Gmail, Instagram, and any other app. Tap the Bolkar bubble, speak, and the text appears in the field you were typing in.
- **Direct text injection** — `BolkarAccessibilityService` uses Android's accessibility API to inject transcribed text directly into the active input field (`ACTION_SET_TEXT`), with a clipboard-paste fallback for apps that don't expose accessibility nodes.
- **Works With strip** — scrolling carousel showing 10 compatible apps: WhatsApp, Instagram, Telegram, Gmail, Chrome, X, LinkedIn, Slack, Maps, YouTube.
- **Device ID auth** — zero-friction authentication using a stable device identifier; no login required.
- **Full recording flow** — same two-mode system (To English / As Spoken) with automatic language detection, routed through the Next.js backend which holds the Sarvam API key.
- **History** — persisted locally in `AsyncStorage`.
- **Custom adaptive icon** — Bolkar diya icon at all mipmap densities (mdpi → xxxhdpi) with anydpi-v26 adaptive config.

### Build

```bash
cd mobile/android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk

adb install -r app/build/outputs/apk/release/app-release.apk
```

Or for development:

```bash
cd mobile && npm run android
```

The mobile app proxies all audio through the Next.js backend (`http://<your-lan-ip>:3000`) — the phone must be on the same Wi-Fi as the dev machine.

---

## Local Development

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Add your SARVAM_API_KEY — without it, a demo placeholder is returned

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SARVAM_API_KEY` | Yes (for real transcription) | API key from [sarvam.ai](https://sarvam.ai) |

Without `SARVAM_API_KEY` set, the app runs in demo mode and returns a placeholder transcript — useful for UI development.

---

## Project Structure

```
app/
  page.tsx              # Landing page
  app/page.tsx          # Recording app
  api/transcribe/       # API route → Sarvam AI
  api/history/          # History API route
  api/hot-words/        # Hot words API route
  api/signout/          # Sign-out route
components/
  BolkarLogo.tsx        # Diya SVG logo mark
  LiveWaveform.tsx      # Canvas audio waveform
  PipBubble.tsx         # Picture-in-Picture recording UI
  LanguageChips.tsx     # Scrolling language carousel
  UseCaseAccordion.tsx  # Landing page use-case section
  WorksWithStrip.tsx    # Scrolling app-logo compatibility strip
  BolAnimation.tsx      # Animated hero headline
hooks/
  useAudioRecorder.ts   # MediaRecorder + state machine
  useModeLabels.ts      # Cycling language labels
  useHistory.ts         # localStorage history
lib/
  sarvam.ts             # Sarvam API client
  examples.ts           # Shared example data (12 examples across 2 modes)
public/
  manifest.json         # PWA manifest (separate any + maskable icons)
  sw.js                 # Service worker (notifications)
  icons/
    icon.svg            # PWA icon (any)
    icon-maskable.svg   # PWA icon (maskable, safe-zone padded)
mobile/
  src/
    screens/
      HomeScreen.tsx    # Main app screen
    modules/
      FloatingBubble.ts # Native module bridge (startFloating, stopFloating, inject)
    assets/             # App logos, diya icon
  android/
    app/src/main/java/com/bolkar/
      MainActivity.kt
      MainApplication.kt
      floating/
        FloatingService.kt           # SYSTEM_ALERT_WINDOW overlay service
        FloatingModule.kt            # React Native bridge
        FloatingPackage.kt           # RN package registration
        BolkarAccessibilityService.kt # Text injection via accessibility API
```

---

Built with [Sarvam AI](https://sarvam.ai) · Hosted on GCP with nginx
