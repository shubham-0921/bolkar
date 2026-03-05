# Bolkar — Bol. Type mat kar.

**[bolkar.online](https://bolkar.online)** &nbsp;·&nbsp; [Product Requirements Document](./Bolkar_PRD_v1.md) &nbsp;·&nbsp; [Changelog](./CHANGELOG.md)

---

## What is Bolkar?

Bolkar is an India-first, zero-signup voice-to-text PWA. You speak — in Hindi, Hinglish, Tamil, Telugu, Bengali, Kannada, Marathi, or any of 22 Indian languages — and Bolkar instantly transcribes it and copies it to your clipboard.

**The problem it solves:** Typing in Indian languages on a phone or desktop is slow, error-prone, and often requires switching keyboards. Bolkar removes all friction — speak naturally, get clean text in under 3 seconds, paste it anywhere.

### Key capabilities

- **Two modes** — *To English*: translate any language to professional English. *As Spoken*: transcribe and keep text in the same language spoken.
- **Automatic language detection** — no need to select a language; Sarvam detects it from the audio.
- **Zero account required** — open the URL and start recording immediately.
- **Works everywhere** — desktop floating bubble via Picture-in-Picture (always on top), Android persistent notification pin, installable as a PWA on Android and desktop.
- **Local history** — last 10 conversions stored in the browser, never sent to a server.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first `@theme` config) |
| UI | React 19 |
| Speech AI | [Sarvam AI](https://sarvam.ai) — Saaras v3 model |
| PWA | `manifest.json` + Service Worker |
| Analytics | Google Analytics GA4 |
| Hosting | Vercel |

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
- History panel — last 10 results, stored in `localStorage`, never leaves the device
- Float it — Picture-in-Picture bubble with full recording flow, always on top
- Pin it — persistent Android notification for quick access

### PRD coverage
All Phase 1 requirements are shipped. See the [PRD Coverage Check](./CHANGELOG.md#prd-coverage-check) table.

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
components/
  BolkarLogo.tsx        # Gold SVG logo mark
  LiveWaveform.tsx      # Canvas audio waveform
  PipBubble.tsx         # Picture-in-Picture recording UI
  LanguageChips.tsx     # Scrolling language carousel
  UseCaseAccordion.tsx  # Landing page use-case section
  BolAnimation.tsx      # Animated hero headline
hooks/
  useAudioRecorder.ts   # MediaRecorder + state machine
  useModeLabels.ts      # Cycling language labels
  useHistory.ts         # localStorage history
lib/
  sarvam.ts             # Sarvam API client
  examples.ts           # Shared example data (12 examples across 2 modes)
public/
  manifest.json         # PWA manifest
  sw.js                 # Service worker (notifications)
```

---

Built with [Sarvam AI](https://sarvam.ai) · Deployed on [Vercel](https://vercel.com)
