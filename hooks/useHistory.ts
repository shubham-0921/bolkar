"use client";

import { useState, useCallback } from "react";
import { addToHistory, HISTORY_STORAGE_KEY } from "@/core/history";
import type { HistoryItem, TranscriptionMode } from "@/core/types";

// Re-export for consumers that already import HistoryItem from here
export type { HistoryItem };

function load(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => load());

  const addItem = useCallback((transcript: string, mode: TranscriptionMode, processingMs?: number) => {
    setItems((prev) => {
      const updated = addToHistory(prev, transcript, mode, processingMs);
      if (updated !== prev) save(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setItems([]);
    save([]);
  }, []);

  return { items, addItem, clearHistory };
}

// Re-export so existing imports of timeAgo from this hook still work
export { timeAgo } from "@/core/utils/format";
