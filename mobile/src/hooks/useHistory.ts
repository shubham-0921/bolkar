import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToHistory, HISTORY_STORAGE_KEY } from '@/core/history';
import { timeAgo } from '@/core/utils/format';
import type { HistoryItem, TranscriptionMode } from '@/core/types';

export type { HistoryItem };
export { timeAgo };

function parseItems(raw: string | null): HistoryItem[] {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useHistory(initialItems: HistoryItem[] = []) {
  const [items, setItems] = useState<HistoryItem[]>(initialItems);

  const addItem = useCallback(
    async (transcript: string, mode: TranscriptionMode, processingMs?: number) => {
      setItems((prev) => {
        const updated = addToHistory(prev, transcript, mode, processingMs);
        AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    []
  );

  const clearHistory = useCallback(async () => {
    setItems([]);
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY).catch(() => {});
  }, []);

  return { items, addItem, clearHistory };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY).catch(() => null);
  return parseItems(raw);
}
