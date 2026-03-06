// Post-processing pipeline for raw transcription output.
// Pure string transforms — no platform dependencies.

import type { PostProcessOptions, HotWord } from "../types";
import { applyHotWords } from "./hotWords";

const FILLER_WORDS = [
  "um", "uh", "ah", "er", "hmm", "hm", "like", "you know",
  "basically", "actually", "literally", "right", "okay so",
];

/**
 * Capitalize the first letter of each sentence.
 */
function capitalizeSentences(text: string): string {
  return text
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, prefix, letter) =>
      prefix + letter.toUpperCase()
    )
    .replace(/^([a-z])/, (letter) => letter.toUpperCase());
}

/**
 * Remove common filler words from the transcript.
 */
function removeFillerWords(text: string): string {
  let result = text;
  for (const filler of FILLER_WORDS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Remove filler at start, end, or between words (with surrounding spaces)
    result = result.replace(new RegExp(`\\b${escaped}\\b,?`, "gi"), "").trim();
  }
  // Collapse multiple spaces
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * Run the full post-processing pipeline on a transcript.
 */
export function postProcess(
  text: string,
  options: PostProcessOptions = {},
  hotWords: HotWord[] = []
): string {
  let result = text;

  if (options.applyHotWords && hotWords.length > 0) {
    result = applyHotWords(result, hotWords);
  }

  if (options.removeFillerWords) {
    result = removeFillerWords(result);
  }

  if (options.capitalizeSentences) {
    result = capitalizeSentences(result);
  }

  return result;
}
