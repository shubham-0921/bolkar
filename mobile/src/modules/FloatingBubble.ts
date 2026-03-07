import { NativeModules, Platform } from 'react-native';

const { FloatingBubble: NativeFloatingBubble } = NativeModules;

export interface FloatingBubbleConfig {
  apiKey: string;
  mode: 'transcribe' | 'translate';
  backendUrl?: string;
  deviceId?: string;
  authToken?: string;
}

function assertAndroid() {
  if (Platform.OS !== 'android') throw new Error('FloatingBubble is Android-only');
  if (!NativeFloatingBubble) throw new Error('FloatingBubble native module not linked. Rebuild the app.');
}

export function startFloating(config: FloatingBubbleConfig): void {
  assertAndroid();
  NativeFloatingBubble.startFloating(
    config.apiKey,
    config.mode,
    config.backendUrl ?? '',
    config.deviceId ?? '',
    config.authToken ?? ''
  );
}

export function stopFloating(): void {
  assertAndroid();
  NativeFloatingBubble.stopFloating();
}

export function isFloatingRunning(): Promise<boolean> {
  assertAndroid();
  return NativeFloatingBubble.isRunning();
}
