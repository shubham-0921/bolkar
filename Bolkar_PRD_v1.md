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
| Urban Professional | IT, BFSI, consulting, startup employees in metro cities. Often speak Hinglish but need professional English output for work. | Speak Hinglish naturally, get clean English output for emails, Slack, WhatsApp | Translate Mode | ~50 to 60M knowledge workers; SAM ~5 to 8M at 10% adoption |
| Developer / Knowledge Worker | Software engineers, PMs, designers. Live in VS Code, Jira, Notion, GitHub. High willingness to pay for productivity tools. | Stay in flow — dictate in any language and get text back in that same language, no keyboard needed | Dictate Mode | ~4.3M software engineers in India; SAM ~430K at 10% adoption |
| Vernacular-First / Language Bridge | Tier-2/3 city professionals, SMB owners, regional salespeople. Think and speak in Hindi/Tamil/Telugu but need English output for work. | Speak in any Indian language, get professional English text, bridge the language gap entirely | Translate Mode | ~500M non-English internet users; addressable ~50M at 10% |

### 4.2 TAM and SAM Summary

| Segment | TAM | SAM (10% Adoption) | ARPU (Monthly) | Revenue Potential |
|---|---|---|---|---|
| Urban Professional | ~50 to 60M | ~5 to 8M | Rs. 299/mo | ~Rs. 15,000 to 24,000 Cr/yr |
| Developer / KW | ~4.3M | ~430K | Rs. 499/mo | ~Rs. 2,600 Cr/yr |
| Vernacular Bridge | ~500M | ~50M | Rs. 99/mo (freemium) | ~Rs. 6,000 Cr/yr |

> Note: Revenue potential figures are illustrative upper bounds at full SAM penetration. Realistic Year 1 targets are 1 to 2% of SAM per segment. The vernacular segment monetisation assumes a freemium model with conversion to paid at ~5%.

---

## 5. Product Modes

### 5.1 Dictate Mode

User speaks in any language (English, Hindi, Tamil, Telugu, Bengali, or any of Sarvam's 22 supported languages) and gets text back in that same language. Output is clean and formatted, with filler words and stutters removed. The language of output always matches the language of input. Automatic language detection means users never need to manually select their language.

- **Target users:** Developers, knowledge workers, content creators writing in their native language
- **API used:** Sarvam /speech-to-text, Saaras v3, mode=transcribe, language_code=unknown for auto-detection
- **Example (Hindi):** User says "aaj ki meeting ka summary likho" → Output: "आज की meeting का summary लिखो"
- **Example (English):** User says "open a pull request for the auth module" → Output: "Open a pull request for the auth module."

### 5.2 Translate Mode

User speaks in any language, including Hinglish, Hindi, Tamil, Telugu, or any Indian language, and always gets clean professional English text as output. This is the mode for anyone whose professional world demands English but who thinks and speaks in another language. Hinglish is explicitly supported: a user who naturally code-switches between Hindi and English will get polished English output, not a literal transcription.

- **Target users:** Urban professionals (Hinglish speakers), vernacular-first users, SMB owners, regional salespeople
- **API used:** Sarvam /speech-to-text, Saaras v3, mode=translate
- **Example (Hinglish):** User says "yaar send karo woh report to Rahul by EOD" → Output: "Please send the report to Rahul by end of day."
- **Example (Tamil):** User says "Naan innikku meeting la irukken, call pannatheenga" → Output: "I am in a meeting today, please do not call."

---

## 6. Development Phases

### 6.1 Phasing Strategy: Why This Order?

The phasing strategy is driven by three principles: build for the broadest reach first with a single codebase, validate the core value proposition before investing in native builds, and expand monetisation once retention is proven.

- **Principle 1:** A single PWA codebase serves both desktop and Android in Phase 1. Desktop covers the browser-first workflow of professionals and developers. Android is served via the notification tray, which gives near-omnipresent access without requiring a native app.
- **Principle 2:** Phase 2 invests in a native Android app only after Phase 1 has validated that users find enough value to return daily. The notification tray approach intentionally leaves some friction in place to test true demand before removing it.
- **Principle 3:** Phase 3 expands to iOS and B2B, capturing the premium urban segment and unlocking enterprise-level ARPU. This is a monetisation phase, not just a platform expansion.

### 6.2 Phase Details

#### Phase 1: PWA — Desktop and Android (4 Days)

**What it is:** A single Progressive Web App codebase that works on both desktop browsers and Android. On desktop, a floating draggable bubble persists across all browser tabs. On Android, the PWA is installed to the home screen and surfaces a persistent notification in the Android notification tray, giving users access to Bolkar from any app by pulling down the tray, tapping the mic, and pasting the result.

**Key Features:**
- Desktop: floating draggable mic bubble across all browser tabs
- Desktop: Cmd/Ctrl+Shift+B keyboard shortcut to trigger recording
- Desktop: works in Gmail, WhatsApp Web, Notion, Slack Web, Google Docs
- Android: installable to home screen via Chrome prompt
- Android: persistent notification in the tray with a one-tap mic button
- Android: text auto-copied to clipboard, paste into any app
- Both: Dictate Mode (speak any language, get text back in that same language)
- Both: Translate Mode (speak any language including Hinglish, get clean English)
- Both: automatic language detection, no manual selection needed
- Both: local conversion history — last 10 results stored in the browser, recoverable if the tab is closed accidentally

**Primary Segment:** Urban Professionals, Developers and Vernacular-First Users

**Why this order:** A PWA is a single codebase that runs on both platforms. Desktop covers the browser-first workflow of professionals and developers. The Android notification tray approach delivers roughly 80% of the native floating bubble experience at a fraction of the build cost, making it the right MVP choice before investing in a full native app.

#### Phase 2: Native Android App + Personalisation (10 Days)

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

**Why this order:** The notification tray approach has friction. A native app removes it entirely. This phase is justified once Phase 1 has validated that users find enough value to return daily.

#### Phase 3: iOS and B2B Expansion (20 Days)

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

### 7.2 The Bubble: Three States

The floating bubble is the entire product interface. It has three distinct visual states.

#### State 1: Idle

The bubble is resting in the corner of the screen, unobtrusive and out of the way.

- Mic icon in brand blue, neutral and inviting
- Mode toggle visible below the mic showing current mode: "Dictate" or "Translate"
- The toggle is a pressable switch, tappable independently of the mic button
- No other elements — minimal and clean

#### State 2: Recording

User has clicked the mic. The bubble signals active recording clearly.

- Mic icon turns red with a slow pulse animation
- A small waveform animation appears to confirm audio is being picked up
- A subtle timer shows recording duration (e.g. 0:04)
- The mode toggle is greyed out and non-interactive — mode cannot be switched mid-recording
- A second click on the mic stops recording

#### State 3: Result Ready

Recording has stopped and the Sarvam API has returned the transcription or translation.

- Transcribed or translated text appears in a card that expands above the bubble
- Text is auto-copied to clipboard immediately
- A "Copied!" toast confirms the copy
- The result card has three actions:
  - **Re-record:** dismiss the result and start a fresh recording
  - **Edit:** open the text inline for quick correction before copying again
  - **Dismiss:** close the card and return to idle state
- The card auto-dismisses after 10 seconds if the user takes no action

> **On errors:** If the transcription is clearly wrong, the user can tap Re-record for a fresh attempt, or tap Edit to fix the text inline. This avoids the frustration of having to start the whole flow over.

### 7.3 Mode Toggle Behaviour

The Dictate / Translate toggle sits below the mic button and is always visible in the idle state.

- Tapping the toggle switches mode instantly with a small animation
- The toggle label updates to reflect the new mode
- The selected mode persists across sessions — if you used Translate Mode last time, it opens in Translate Mode next time
- During onboarding, users are asked which mode they want as their default, so most users will rarely need to touch the toggle

### 7.4 Desktop UX Flow

| Step | Action | Description |
|---|---|---|
| 1 | Install PWA | User visits bolkar.app and installs via browser prompt. Bubble appears pinned to bottom-right. |
| 2 | Select Mode | User checks the toggle below the mic. Default is set during onboarding. |
| 3 | Trigger Recording | User clicks mic button or presses Cmd+Shift+B. Bubble enters Recording state. |
| 4 | Speak | User speaks naturally. No special commands needed. Just talk. |
| 5 | Stop Recording | User clicks mic again. API call is made to Sarvam. |
| 6 | Result Appears | Text appears in the card above the bubble and is auto-copied to clipboard. |
| 7 | Paste | User clicks into their target app and presses Cmd+V. Done. |

### 7.5 Android Notification Tray Flow

On Android, Bolkar surfaces through the system notification tray rather than a floating bubble. This gives users access to the mic from any native app without requiring a full native build.

| Step | Action | Description |
|---|---|---|
| 1 | Install PWA | User visits bolkar.app on Chrome for Android and installs via browser prompt. Bolkar is added to home screen. |
| 2 | Persistent Notification | Bolkar places a persistent notification in the Android tray with a mic icon. This stays active as long as Bolkar is running. |
| 3 | Trigger from Anywhere | User is in WhatsApp, Gmail, Instagram or any app. They pull down the notification tray and tap the Bolkar mic button. |
| 4 | Select Mode and Speak | A minimal recording UI appears as a bottom sheet. User verifies mode (Dictate or Translate) and speaks. |
| 5 | Text Auto-Copied | Transcribed or translated text is instantly copied to clipboard. A confirmation toast appears. |
| 6 | Paste into Any App | User returns to their app and pastes with a long-press. The entire flow takes under 10 seconds. |

> **Note:** The notification tray approach delivers approximately 80% of the native floating bubble experience with significantly lower build complexity. The one extra step of returning to the app to paste is a deliberate MVP tradeoff, validated before investing in a full native Android app in Phase 2.

---

## 8. Sarvam API Integration

Bolkar is powered entirely by Sarvam AI's Saaras v3 model, the most capable Indian language ASR model available, supporting 22 languages with automatic language detection and multiple output modes.

| Feature | Sarvam API Used | Notes |
|---|---|---|
| Dictate Mode | /speech-to-text: Saaras v3, mode=transcribe | Output language matches input language. Supports all 22 Indian languages plus English. |
| Translate Mode | /speech-to-text: Saaras v3, mode=translate | Any language including Hinglish, converted to clean English in one API call. |
| Language Auto-Detection | language_code=unknown parameter | User never needs to manually select their language. Sarvam detects automatically. |
| Real-time (Phase 2+) | WebSocket Streaming API: Saaras v3 | Sub-second latency for live transcription in the native Android app. |

---

## 9. Success Metrics

### Phase 1: PWA (Desktop and Android)

- 500 installs within first month of launch
- 40% Day-7 retention (user records at least once in Week 2)
- Average session: 3 or more recordings per day
- NPS above 50 among early users
- Translate Mode used by more than 20% of users (signals vernacular TAM validation)

### Phase 2: Native Android App

- 10,000 installs within 60 days of launch
- Translate Mode adoption above 50% on mobile (vs ~20% on desktop)
- 30-day retention above 25%
- Re-record rate below 15% (signals transcription quality is acceptable)

### Phase 3: iOS and B2B

- 100,000 MAU within 6 months of launch
- 5% free-to-paid conversion
- First B2B team deal signed
- ARPU 3x higher on B2B vs individual plan

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
