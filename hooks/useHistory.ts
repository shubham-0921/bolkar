"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "bolkar-history";
const MAX_ITEMS = 10;

export interface HistoryItem {
  id: string;
  transcript: string;
  mode: "transcribe" | "translate";
  timestamp: number;
  processingMs?: number;
}

function load(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => load());

  const addItem = useCallback((transcript: string, mode: "transcribe" | "translate", processingMs?: number) => {
    if (!transcript.trim()) return;
    const entry: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      transcript,
      mode,
      timestamp: Date.now(),
      processingMs,
    };
    setItems((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ITEMS);
      save(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setItems([]);
    save([]);
  }, []);

  return { items, addItem, clearHistory };
}

export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
