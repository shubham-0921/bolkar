// Pure history logic — no storage calls.
// Platform adapters (web: localStorage, native: AsyncStorage) live in hooks/.

import type { HistoryItem, TranscriptionMode } from "./types";

export const HISTORY_MAX_ITEMS = 10;
export const HISTORY_STORAGE_KEY = "bolkar-history";

export function createHistoryItem(
  transcript: string,
  mode: TranscriptionMode,
  processingMs?: number
): HistoryItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    transcript,
    mode,
    timestamp: Date.now(),
    processingMs,
  };
}

export function addToHistory(
  current: HistoryItem[],
  transcript: string,
  mode: TranscriptionMode,
  processingMs?: number
): HistoryItem[] {
  if (!transcript.trim()) return current;
  const entry = createHistoryItem(transcript, mode, processingMs);
  return [entry, ...current].slice(0, HISTORY_MAX_ITEMS);
}
