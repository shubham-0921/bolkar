// Hot words engine — pure string transformation, no platform dependencies.
// A "hot word" is a spoken trigger word/phrase that gets replaced with a preset message.
//
// Example:
//   trigger: "my email"  →  replacement: "shubham@example.com"
//   trigger: "sign off"  →  replacement: "Best regards,\nShubham"

import type { HotWord } from "../types";

export const HOT_WORDS_STORAGE_KEY = "bolkar-hot-words";

/**
 * Apply hot word substitutions to a transcript.
 * Matches whole words/phrases, case-insensitive.
 * Longer triggers are matched first to avoid partial replacements.
 */
export function applyHotWords(text: string, hotWords: HotWord[]): string {
  if (!hotWords.length) return text;

  // Sort by trigger length descending so longer phrases match before shorter ones
  const sorted = [...hotWords].sort((a, b) => b.trigger.length - a.trigger.length);

  let result = text;
  for (const { trigger, replacement } of sorted) {
    if (!trigger.trim()) continue;
    // Escape special regex characters in the trigger
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi");
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Validate a hot word before saving.
 * Returns an error string if invalid, null if valid.
 */
export function validateHotWord(trigger: string, replacement: string): string | null {
  if (!trigger.trim()) return "Trigger cannot be empty";
  if (!replacement.trim()) return "Replacement cannot be empty";
  if (trigger.length > 100) return "Trigger too long (max 100 chars)";
  if (replacement.length > 1000) return "Replacement too long (max 1000 chars)";
  return null;
}
