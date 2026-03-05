# Bolkar PRD
## Bol. Type mat kar.

**Version:** 1.0 — Pre-MBA PM Assignment
**Powered By:** Sarvam AI Speech-to-Text API (Saaras v3)
**Date:** March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision and Positioning](#3-product-vision-and-positioning)
4. [Target Customers and TAM](#4-target-customers-and-tam)
5. [Product Modes](#5-product-modes)
6. [Development Phases](#6-development-phases)
7. [Core UX and Interaction Design](#7-core-ux-and-interaction-design)
8. [Sarvam API Integration](#8-sarvam-api-integration)
9. [Success Metrics](#9-success-metrics)
10. [Open Questions and Risks](#10-open-questions-and-risks)

---

## 1. Executive Summary

Bolkar is an India-first voice-to-text Progressive Web App built on Sarvam AI's speech recognition API. It lets users speak naturally in any of 22 Indian languages and have clean, formatted text appear instantly wherever they type, across Gmail, WhatsApp Web, Notion, Slack, Google Docs, and more.

Unlike Wispr Flow and other Western voice tools, Bolkar is built for how India actually speaks. It offers two modes: Dictate Mode transcribes speech in any language and returns text in that same language. Translate Mode converts speech in any language, including Hinglish, into clean professional English. This unlocks a use case no existing tool addresses at scale — the hundreds of millions of Indians who think in one language but need to communicate professionally in another.

> **Core Insight:** Most voice tools assume you think, speak, and write in English. Bolkar separates these: speak in any language and choose whether you want the output in that same language or translated to English. This simple distinction unlocks the entire Indian market.

---

## 2. Problem Statement

### 2.1 The Typing Bottleneck

Knowledge workers across India spend a disproportionate amount of their day typing: emails, Slack messages, WhatsApp replies, Jira tickets, meeting notes. Typing is slow, especially on mobile, and it forces users to think in the format of the keyboard rather than the format of their thoughts.

### 2.2 Existing Tools Fail Indian Users

Voice dictation tools like Wispr Flow, Apple Dictation, and Google Voice Typing were built for English-first users. They fail in three critical ways for the Indian market:

- They cannot handle Hinglish, the natural code-mixed way most urban Indians speak. It also fails to support any Indian language beyond basic Hindi
- They cannot translate vernacular speech to English, blocking the 500M non-English speakers from professional digital communication
- They are not optimised for Indian accents, names, or domain-specific terminology across 22 Indian languages

> **Market Signal:** 9 out of 10 new internet users in India are non-English speakers (KPMG-Google). 57% of Indian internet users prefer accessing the internet in their native language. Yet no voice-to-text tool serves them well.

---

## 3. Product Vision and Positioning

### 3.1 Vision

To be the voice layer of India's digital economy, enabling every Indian to communicate professionally, regardless of the language they think in.

### 3.2 Positioning

Bolkar is not a Wispr Flow clone. It is a fundamentally India-native product that solves the same core problem as Wispr Flow, but for a market Wispr Flow was never designed to serve.

| | Wispr Flow | Bolkar |
|---|---|---|
| Language Support | English-first | India-first: 22 languages |
| Modes | Dictation only | Dictation and Translation |
| Hinglish | No support | Hinglish to English via Translate Mode |
| Market | US and UK | Indian market (TAM: 500M+) |
| Platform | Desktop app | PWA with Mobile roadmap |

---

## 4. Target Customers and TAM

Bolkar serves three distinct user segments through two product modes. Dictate Mode transcribes speech in any language and returns text in that same language. Translate Mode takes speech in any language and returns clean English text, making it the go-to mode for Hinglish speakers, vernacular users, and anyone who thinks in one language but needs to communicate professionally in English.

### 4.1 Segment Overview

| Segment | Who They Are | Core Need | Mode Used | TAM (India) |
|---|---|---|---|---|
| Urban Professional | IT, BFSI, consulting, startup employees in metro cities. Often speak Hinglish but need professional English output for work. | Speak Hinglish naturally, get clean English output for emails, Slack, WhatsApp | Translate Mode | ~10-15M metro office workers actively using English for work; SAM ~300K-500K at 3-4% early adoption |
| Developer / Knowledge Worker | Software engineers, PMs, designers. Live in VS Code, Jira, Notion, GitHub. High willingness to pay for productivity tools. | Stay in flow — dictate in any language and get text back in that same language, no keyboard needed | Dictate Mode | ~4.3M software engineers in India (NASSCOM); SAM ~150K-250K product/startup devs at 4-6% adoption |
| Vernacular-First / Language Bridge | Tier-2/3 city professionals, SMB owners, regional salespeople. Think and speak in Hindi/Tamil/Telugu but need English output for work. | Speak in any Indian language, get professional English text, bridge the language gap entirely | Translate Mode | ~60-80M Tier-2/3 working professionals with English-output need; freemium SAM ~1.5-3M at 2-4% |

### 4.2 TAM and SAM Summary

| Segment | TAM | SAM | ARPU (Monthly) | Revenue at Full SAM Paid |
|---|---|---|---|---|
| Urban Professional | ~10-15M | ~300K-500K (3-4% adoption) | Rs. 149/mo | ~Rs. 540-900 Cr/yr |
| Developer / KW | ~4.3M | ~150K-250K (4-6% adoption) | Rs. 299/mo | ~Rs. 540-900 Cr/yr |
| Vernacular Bridge | ~60-80M | ~1.5-3M freemium; ~75K-150K paid (5% conversion) | Rs. 79/mo | ~Rs. 71-142 Cr/yr |

> Note: Revenue figures are theoretical ceilings at full SAM paid penetration — not projections. Realistic Year 1 target is 0.5-1% of SAM per segment (~2,500-7,500 total paying users, ~Rs. 4-15 Cr ARR). Indian SaaS adoption benchmarks and freemium-to-paid conversion (~2-5% in India) are factored in. The original 10% adoption figure used US market assumptions; India productivity SaaS typically sees 2-4% early adoption.

---

## 5. Product Modes

### 5.1 Dictate Mode / As Spoken

User speaks in any language (English, Hindi, Tamil, Telugu, Bengali, or any of Sarvam's 22 supported languages) and gets text back in that same language. Output is clean and formatted, with filler words and stutters removed. The language of output always matches the language of input. Automatic language detection means users never need to manually select their language.

- **UI label:** "As Spoken" (cycles through "जैसे बोला", "ਜਿਵੇਂ ਬੋਲਿਆ", "যেভাবে বললাম", "பேசியபடி", "જેમ બોલ્યા")
- **Target users:** Developers, knowledge workers, content creators writing in their native language
- **API used:** `POST https://api.sarvam.ai/speech-to-text`, model=`saaras:v3`, language_code=`unknown` (auto-detects all 22 languages)
- **Example (Hindi):** User says "aaj ki meeting ka summary likho" → Output: "आज की meeting का summary लिखो"
- **Example (English):** User says "open a pull request for the auth module" → Output: "Open a pull request for the auth module."

### 5.2 Translate Mode / To English

User speaks in any language, including Hinglish, Hindi, Tamil, Telugu, or any Indian language, and always gets clean professional English text as output. This is the mode for anyone whose professional world demands English but who thinks and speaks in another language. Hinglish is explicitly supported: a user who naturally code-switches between Hindi and English will get polished English output, not a literal transcription.

- **UI label:** "To English" (cycles through "अंग्रेज़ी में", "ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ", "ইংরেজিতে", "ஆங்கிலத்தில்", "અંગ્રેજીમાં")
- **Target users:** Urban professionals (Hinglish speakers), vernacular-first users, SMB owners, regional salespeople
- **API used:** `POST https://api.sarvam.ai/speech-to-text-translate`, model=`saaras:v3`, language_code=`unknown` (separate endpoint from Dictate — handles translation natively)
- **Example (Hinglish):** User says "yaar send karo woh report to Rahul by EOD" → Output: "Please send the report to Rahul by end of day."
- **Example (Tamil):** User says "Naan innikku meeting la irukken, call pannatheenga" → Output: "I am in a meeting today, please do not call."

---

## 6. Development Phases

### 6.1 Phasing Strategy: Why This Order?

The phasing strategy is driven by four principles: build for the broadest reach first with a single codebase, validate the core value proposition before investing in native builds, expand monetisation once retention is proven, and gate platform investments behind real usage signals and feedback.

- **Principle 1:** A single PWA codebase serves both desktop and Android in Phase 1. Desktop covers the browser-first workflow of professionals and developers. Android is served via the notification tray, which gives near-omnipresent access without requiring a native app.
- **Principle 2:** Phase 2 invests in a native Android app only after Phase 1 has validated that users find enough value to return daily. The notification tray approach intentionally leaves some friction in place to test true demand before removing it.
- **Principle 3:** Phase 3 expands to iOS and B2B, capturing the premium urban segment and unlocking enterprise-level ARPU. This is a monetisation phase, not just a platform expansion.
- **Principle 4:** Phase 1 ships without authentication or paywalls deliberately. The goal is to remove every possible barrier to first use, maximise the number of users who experience the product, and accumulate real transcription and translation data across languages and accents. Auth, tiered pricing, and rate limiting are introduced in later phases once the feedback loop is established and the usage patterns are understood.

### 6.2 Phase Details

#### Phase 1: PWA — Desktop and Android

**What it is:** A single Progressive Web App codebase that works on both desktop and Android. On desktop, a floating draggable bubble sits on top of all apps system-wide — not just the browser. Users tap the mic, speak, and the result is auto-copied to clipboard, ready to paste into any app (VS Code, Figma, Slack, Gmail, Notion, or anything else). On Android, the PWA is installed to the home screen and surfaces a persistent notification in the Android notification tray — pull down the tray, tap the mic, speak, and paste the result into any app.

**Key Features:**
- Desktop: floating draggable mic bubble that works across all apps system-wide
- Desktop: text auto-copied to clipboard on result — paste into any app (VS Code, Figma, Slack, Gmail, Notion, Google Docs, etc.)
- Android: installable to home screen via Chrome prompt
- Android: persistent notification in the tray with a one-tap mic button
- Android: text auto-copied to clipboard, paste into any app
- Both: As Spoken / Dictate Mode (speak any language, get text back in that same language)
- Both: To English / Translate Mode (speak any language including Hinglish, get clean English)
- Both: automatic language detection, no manual selection needed
- Both: local conversion history — last 10 results stored in the browser, recoverable if the tab is closed accidentally

**Primary Segment:** Urban Professionals, Developers and Vernacular-First Users

**Why this order:** A PWA is a single codebase that runs on both platforms. On desktop, the floating bubble is already a true system-wide overlay — not browser-limited — giving professionals and developers full cross-app dictation from day one. The Android notification tray approach delivers a comparable experience on mobile at a fraction of the build cost, making it the right MVP choice before investing in a full native app.

**Phase 1 Objective — Proof of Concept and Demand Validation:** Phase 1 ships with no login wall, no usage caps, and no payment gate. The goal is simple: put the product in front of real users and answer the core question — do people find this useful enough to come back? All history is stored locally in the browser; no session data or transcriptions are sent to or saved on Bolkar's servers. Success signals at this stage are qualitative: word-of-mouth shares, unprompted return visits, and direct user feedback. These signals directly determine whether Phase 2 investment in a native app and server-side infrastructure is justified.

#### Phase 2: Native Android App + Personalisation + Auth

**What it is:** A full native Android app with the SYSTEM_ALERT_WINDOW permission, enabling a true floating bubble that appears over any other app on the device. This removes the copy-paste step entirely and makes Bolkar feel truly omnipresent. Phase 2 also introduces the first personalisation layer, turning the local history into a learning engine.

**Key Features:**
- True floating bubble over any app including native WhatsApp, Gmail and Instagram
- Direct text injection into the active input field, no manual paste needed
- Custom Bolkar keyboard with built-in mic button
- Voice shortcuts for frequently used phrases
- Personal dictionary for names, brands and domain terms
- Offline fallback for basic transcription without internet
- **Personalisation (built on local history):**
  - Detect the user's dominant language from history and pre-select the right mode on open
  - Surface "your most used phrases" as one-tap shortcuts
  - Show usage streaks and word count saved to reinforce the habit loop
  - Sync history across devices via optional account (opt-in, privacy-first)

**Primary Segment:** All Three Segments: Full Market

**Auth, Data Collection and Rate Limiting (introduced in Phase 2):** Phase 2 introduces OAuth login (Google and phone number), enabling cross-device history sync, personalisation persistence, and a stable user identity for rate limiting. With auth in place, Bolkar can begin collecting real usage signal server-side for the first time: which mode users prefer, how often they re-record, which languages are most common, and where the Sarvam API struggles. This data informs Phase 3 pricing tiers and future model fine-tuning. A freemium tier with a monthly transcription cap and a paid tier with unlimited usage are introduced here, validated by the demand signals from Phase 1.

**Why this order:** The notification tray approach has friction. A native app removes it entirely. This phase is justified once Phase 1 has validated that users find enough value to return daily.

#### Phase 3: iOS and B2B Expansion

**What it is:** iOS support via a native app or optimised PWA depending on Apple platform constraints, plus a B2B team plan with shared voice shortcuts, admin controls and enterprise-grade privacy compliance.

**Key Features:**
- iOS native app or PWA with keyboard extension
- B2B team plan with shared shortcut libraries
- Admin dashboard for usage analytics and team management
- HIPAA and SOC2-ready privacy controls for enterprise
- API access for developers to embed Bolkar in their own products

**Primary Segment:** Premium Urban Professionals and Enterprise Teams

**Why this order:** iOS has a smaller share of the Indian market but captures the highest-income urban professional segment. B2B unlocks a significantly higher ARPU and more predictable revenue than individual subscriptions.

---

## 7. Core UX and Interaction Design

### 7.1 Interaction Model: Click to Start, Click to Stop

Bolkar uses a click-to-start, click-to-stop recording model rather than hold-to-record. This is a deliberate decision for the Indian user context: vernacular users and professionals often dictate longer messages rather than quick one-liners, making hold-to-record tiring and impractical. A single click to start and a single click to stop keeps the interaction low-friction for both short and long dictations.

### 7.2 App Interface: Four States

The main interface is a full-page dark-themed web app at `/app`. The background colour and glow shift with the active mode — violet for To English, blue for As Spoken — giving an immediate visual cue as to which mode is active. The interface has four states.

#### State 1: Idle

- Mode toggle at the top (see 7.3)
- Rotating example card below the toggle (see 7.4)
- Large circular mic button with an ambient glow ring coloured to the active mode
- Live waveform below the mic (rendered in the mode accent colour when idle)
- "Click the mic to start" hint
- "Use Bolkar anywhere" section if the device supports PiP or notifications (see 7.5)

#### State 2: Recording

- Mic button turns red with a dual-layer pulse-ring animation
- Live waveform becomes active, reflecting actual audio input in real time
- Recording timer in red below the waveform
- "Recording — click to stop" hint
- Mode toggle is disabled — mode cannot be switched mid-recording
- A second click on the mic stops recording and triggers the API call

#### State 3: Processing

- Mic button shows a spinner on a dark background
- "Processing your speech…" hint
- Brief intermediate state while Sarvam responds

#### State 4: Result

- Result card appears below the mic area
- Header: green status dot + mode label ("Converted to English" or "Kept in your language") + animated speed badge showing Sarvam API response time
- Text is auto-copied to clipboard immediately; a "Copied to clipboard" toast slides in at the bottom of the screen
- Three actions:
  - **Copy** (primary, full-width): copies the current text, button shows "Copied!" on success
  - **Edit**: switches to an inline textarea for quick correction; button becomes "Copy edited"
  - **Dismiss**: returns to idle immediately
- Card auto-dismisses after 10 seconds if no action is taken

> **On errors:** A red error card appears with the error message and a "Try again →" link that resets to idle.

### 7.3 Mode Toggle

The "To English" / "As Spoken" toggle sits at the top of the interface above the example card.

- Two pill buttons side by side — active mode is highlighted with a filled colour (violet for To English, blue for As Spoken)
- The primary label on each pill cycles through 7 languages every 2.5 seconds — English, Hindi, Tamil, Telugu, Bengali, Kannada, Marathi — with a fade + slide animation. The cycling is synchronised with the example card so both always show the same language.
- A static subtitle hint sits below each label: "Speak any language → English" and "Speak → text in same language"
- Switching mode is instant and locked during recording or processing
- The selected mode persists in localStorage and is restored on next visit

### 7.4 Rotating Example Card

Below the mode toggle, a two-column card demonstrates what Bolkar does in the current mode.

- **Left column ("You say"):** an italicised input phrase with a language chip (e.g. "Hinglish", "Tamil")
- **Right column ("Bolkar outputs"):** the output text with an output-language chip coloured to the active mode
- Cycles automatically every 5 seconds with a fade + upward-slide transition
- Dot indicators at the bottom allow manual navigation between examples
- The example set resets when the mode is switched (To English has 6 examples across Hinglish, Hindi, Tamil, Telugu, Bengali, Kannada; As Spoken has 6 across Hindi, Tamil, Telugu, Bengali, Kannada, Marathi)

### 7.5 Use Bolkar Anywhere

Shown in the idle state when the device/browser supports at least one of the following options:

- **Float it** (Desktop, Chrome only): launches a Document Picture-in-Picture window — a compact always-on-top bubble that stays visible while the user works in other apps. Full recording functionality is available inside the PiP window. The button shows an "Active" badge while the PiP window is open.
- **Pin it** (Android / Chrome with notification permission): pins a persistent notification to the Android notification bar. Tapping the notification opens Bolkar from any app. The button toggles to "Unpin" and shows a "Pinned" badge when active.

### 7.6 History Panel

Accessible via the "History" button in the top nav (shows a count badge when items exist).

- Slide-in panel from the right edge (full height, 384px wide on desktop)
- Shows up to the 10 most recent conversions, stored locally in the browser — never sent to a server
- Each item shows: mode badge ("→ English" in violet or "As spoken" in blue), relative timestamp (e.g. "2m ago"), API speed badge, and up to 3 lines of the transcript
- Hover over any item to reveal a copy button
- "Clear all" button in the panel header
- Footer reminder: "Stored locally in your browser · Never sent to a server"

### 7.7 Desktop UX Flow

| Step | Action | Description |
|---|---|---|
| 1 | Open Bolkar | User visits bolkar.app/app in their browser. Can install as a PWA from the browser prompt. |
| 2 | Select mode | Toggle between "To English" and "As Spoken" at the top. Last used mode is remembered. |
| 3 | Float it (optional) | Click "Float it" to launch a PiP bubble that stays on top while working in other apps. |
| 4 | Click the mic | App enters Recording state. Mic turns red, waveform activates. |
| 5 | Speak | User speaks naturally. Live waveform confirms audio is being captured. |
| 6 | Click to stop | Click mic again. API call is made to Sarvam. |
| 7 | Copy and paste | Text appears and is auto-copied to clipboard. User pastes into any app with Cmd+V. |

### 7.8 Android UX Flow

| Step | Action | Description |
|---|---|---|
| 1 | Open Bolkar | User visits bolkar.app/app on Chrome for Android. Can install as a PWA to the home screen. |
| 2 | Pin it (optional) | Tap "Pin it" to add a persistent notification to the Android notification bar for quick access. |
| 3 | Trigger from anywhere | Pull down the notification bar and tap the Bolkar notification to open the app. |
| 4 | Select mode and speak | Choose mode, tap mic, speak, tap to stop. |
| 5 | Copy and paste | Text is auto-copied to clipboard. Return to any app and paste with a long-press. |

---

## 8. Sarvam API Integration

Bolkar is powered entirely by Sarvam AI's Saaras v3 model, supporting 22 Indian languages with automatic language detection. The two product modes map to two distinct Sarvam endpoints — not parameters on the same endpoint.

| Feature | Endpoint | Request | Notes |
|---|---|---|---|
| As Spoken (Dictate) | `POST https://api.sarvam.ai/speech-to-text` | `model=saaras:v3`, `language_code=unknown`, `file=<audio>` | Output language matches input language. Auto-detects all 22 Indian languages plus English. |
| To English (Translate) | `POST https://api.sarvam.ai/speech-to-text-translate` | `model=saaras:v3`, `language_code=unknown`, `file=<audio>` | Any language including Hinglish, converted to clean English in one API call. Separate endpoint from As Spoken. |
| Language Auto-Detection | Both endpoints | `language_code=unknown` | User never needs to manually select a language. Sarvam detects automatically on every call. |
| Auth | Both endpoints | Header: `api-subscription-key: <SARVAM_API_KEY>` | API key stored server-side in `.env.local`, never exposed to the client. |
| Audio format | Both endpoints | `file` field as `recording.webm` | Audio recorded in WebM format via the browser MediaRecorder API and sent as FormData. |
| Response | Both endpoints | JSON `{ transcript: string }` | Processing time is measured client-side and shown as the speed badge in the result card. |
| Real-time streaming (Phase 2+) | Sarvam WebSocket API | Saaras v3 streaming | Sub-second latency for live transcription in the native Android app. Not used in Phase 1. |

---

## 9. Success Metrics

All Phase 1 metrics are measured via Google Analytics (GA4, property `G-FVBM65R4KJ`). The current integration tracks page views, sessions, users, engagement, and geography automatically. Custom events will be added in Phase 2 to track recording-level behaviour.

### Phase 1: PWA (Desktop and Android)

Measurable via GA4 base setup:

| Metric | Target | GA4 Signal |
|---|---|---|
| Total users on `/app` | 1,000 users in first month | Users report, filtered to `/app` page |
| Returning users | >20% of sessions are returning users | New vs returning user report |
| Engaged sessions on `/app` | >50% engagement rate | Engaged sessions (>10s + interaction) |
| India traffic share | >70% of users from India | Geography report |
| Mobile vs desktop split | Understand device mix | Device category report |
| Landing → `/app` conversion | >30% of landing page visitors open the app | Page path report: `/` → `/app` |
| Traffic sources | Majority from direct/social (word of mouth signal) | Acquisition report |

> **What requires custom events (Phase 2):** recording count per session, mode preference (To English vs As Spoken), copy vs dismiss vs edit actions, re-record rate, PiP and notification pin usage.

### Phase 2: Native Android App

Phase 2 will add `gtag('event', ...)` custom events for recording-level actions. Metrics to target once instrumented:

| Metric | Target | How Measured |
|---|---|---|
| Total users on `/app` | 5,000 users/month | GA4 users report |
| Returning users | >35% returning | GA4 new vs returning |
| Mode split | Understand To English vs As Spoken ratio | Custom event: `mode_selected` |
| Recording completion rate | >80% of recordings reach result state | Custom events: `recording_started`, `result_shown` |
| Copy rate | >70% of results are copied | Custom event: `result_copied` |
| Re-record rate | <20% | Custom event: `recording_started` immediately after `result_shown` |

### Phase 3: iOS and B2B

Phase 3 introduces auth and payments. Metrics shift to revenue and retention:

| Metric | Target | How Measured |
|---|---|---|
| MAU | 25,000 MAU | GA4 monthly active users |
| Free-to-paid conversion | >3% | Payment events + GA4 funnel |
| India share maintained | >65% | Geography report |
| B2B team deals | First deal signed | Qualitative / CRM |

---

## 10. Open Questions and Risks

- **Risk:** Monetisation timing. When does the freemium to paid gate activate for the vernacular segment? Too early risks killing growth; too late delays revenue.
- **Risk:** Sarvam API latency at scale. REST API works for audio under 30 seconds. Will real-time WebSocket streaming be stable enough for Phase 2 mobile use?
- **Risk:** PWA persistence on Android. Android aggressively kills background processes. The persistent notification may disappear if the OS clears Bolkar from memory, breaking the tray flow.
- **Risk:** PWA limitations on iOS. Apple restricts PWA capabilities significantly. Phase 3 may need a separate iOS native app track rather than a PWA.
- **Risk:** Competition. Sarvam could build this themselves. Bolkar's moat is UX, distribution, and brand, not the API.
- **Open Question:** Auto-paste on desktop. Can the PWA auto-inject text into the active input field, or will users always need to Cmd+V? This depends on browser permissions and is worth prototyping early.
- **Open Question:** Re-record rate threshold. At what error rate does a user churn vs tolerate the friction of re-recording? This needs to be tested in Phase 1.

---

*Bolkar: Voice-to-text built for how India speaks. Powered by Sarvam AI. Built for Bharat.*
