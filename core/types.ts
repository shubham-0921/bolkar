// Shared types used across web (Next.js) and mobile (Expo) platforms

export type TranscriptionMode = "transcribe" | "translate";

export interface HistoryItem {
  id: string;
  transcript: string;
  mode: TranscriptionMode;
  timestamp: number;
  processingMs?: number;
}

export interface HotWord {
  trigger: string;      // word/phrase to match (case-insensitive)
  replacement: string;  // text to substitute
}

export interface PostProcessOptions {
  capitalizeSentences?: boolean;
  removeFillerWords?: boolean;
  applyHotWords?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  mode: TranscriptionMode;
  processingMs: number;
}
