// React Native interface for the native Android FloatingBubble module.
// The native side (FloatingService.kt + FloatingModule.kt) handles
// the overlay, recording, and API call independently.

import { NativeModules, Platform } from 'react-native';

const { FloatingBubble: NativeFloatingBubble } = NativeModules;

export interface FloatingBubbleConfig {
  apiKey: string;
  mode: 'transcribe' | 'translate';
  backendUrl?: string; // optional: your deployed Next.js URL
}

function assertAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('FloatingBubble is Android-only');
  }
  if (!NativeFloatingBubble) {
    throw new Error('FloatingBubble native module not linked. Rebuild the app.');
  }
}

/** Start the floating bubble overlay. Requests SYSTEM_ALERT_WINDOW if needed. */
export function startFloating(config: FloatingBubbleConfig): void {
  assertAndroid();
  NativeFloatingBubble.startFloating(
    config.apiKey,
    config.mode,
    config.backendUrl ?? ''
  );
}

/** Stop and dismiss the floating bubble. */
export function stopFloating(): void {
  assertAndroid();
  NativeFloatingBubble.stopFloating();
}

/** Returns true if the floating service is currently running. */
export function isFloatingRunning(): Promise<boolean> {
  assertAndroid();
  return NativeFloatingBubble.isRunning();
}
