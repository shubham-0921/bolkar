"use client";

import { useState, useCallback, useEffect } from "react";
import { addToHistory, HISTORY_STORAGE_KEY } from "@/core/history";
import type { HistoryItem, TranscriptionMode } from "@/core/types";
import { useSession } from "@/lib/authClient";

export type { HistoryItem };

function loadLocal(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHistory() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [items, setItems] = useState<HistoryItem[]>(() => loadLocal());

  // Load from DB when signed in, localStorage when not
  useEffect(() => {
    if (userId) {
      fetch("/api/history")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { items: Array<{ id: string; transcript: string; mode: string; processingMs: number | null; createdAt: string }> } | null) => {
          if (!data?.items) return;
          setItems(
            data.items.map((r) => ({
              id: r.id,
              transcript: r.transcript,
              mode: r.mode as TranscriptionMode,
              processingMs: r.processingMs ?? undefined,
              timestamp: new Date(r.createdAt).getTime(),
            }))
          );
        })
        .catch(() => {});
    } else {
      setItems(loadLocal());
    }
  }, [userId]);

  const addItem = useCallback(
    (transcript: string, mode: TranscriptionMode, processingMs?: number) => {
      if (userId) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, mode, processingMs }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((item) => {
            if (item) {
              setItems((prev) =>
                [
                  {
                    id: item.id,
                    transcript: item.transcript,
                    mode: item.mode as TranscriptionMode,
                    processingMs: item.processingMs ?? undefined,
                    timestamp: new Date(item.createdAt).getTime(),
                  },
                  ...prev,
                ].slice(0, 50)
              );
            }
          })
          .catch(() => {});
      } else {
        setItems((prev) => {
          const updated = addToHistory(prev, transcript, mode, processingMs);
          if (updated !== prev) saveLocal(updated);
          return updated;
        });
      }
    },
    [userId]
  );

  const clearHistory = useCallback(() => {
    setItems([]);
    if (userId) {
      fetch("/api/history", { method: "DELETE" }).catch(() => {});
    } else {
      saveLocal([]);
    }
  }, [userId]);

  return { items, addItem, clearHistory };
}

export { timeAgo } from "@/core/utils/format";
