"use client";

import { useState, useCallback } from "react";
import { applyHotWords, validateHotWord, HOT_WORDS_STORAGE_KEY } from "@/core/utils/hotWords";
import type { HotWord } from "@/core/types";

export type { HotWord };
export { applyHotWords, validateHotWord };

function load(): HotWord[] {
  try {
    const raw = localStorage.getItem(HOT_WORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: HotWord[]) {
  try {
    localStorage.setItem(HOT_WORDS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHotWords() {
  const [hotWords, setHotWords] = useState<HotWord[]>(() => load());

  const addHotWord = useCallback((trigger: string, replacement: string): string | null => {
    const err = validateHotWord(trigger, replacement);
    if (err) return err;
    // No duplicate triggers
    setHotWords((prev) => {
      if (prev.some((hw) => hw.trigger.toLowerCase() === trigger.toLowerCase())) return prev;
      const updated = [...prev, { trigger: trigger.trim(), replacement: replacement.trim() }];
      save(updated);
      return updated;
    });
    return null;
  }, []);

  const removeHotWord = useCallback((trigger: string) => {
    setHotWords((prev) => {
      const updated = prev.filter((hw) => hw.trigger !== trigger);
      save(updated);
      return updated;
    });
  }, []);

  const updateHotWord = useCallback((trigger: string, replacement: string): string | null => {
    const err = validateHotWord(trigger, replacement);
    if (err) return err;
    setHotWords((prev) => {
      const updated = prev.map((hw) =>
        hw.trigger === trigger ? { ...hw, replacement: replacement.trim() } : hw
      );
      save(updated);
      return updated;
    });
    return null;
  }, []);

  return { hotWords, addHotWord, removeHotWord, updateHotWord };
}
