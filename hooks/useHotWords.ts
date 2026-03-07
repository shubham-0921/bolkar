"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { applyHotWords, validateHotWord, HOT_WORDS_STORAGE_KEY } from "@/core/utils/hotWords";
import type { HotWord } from "@/core/types";
import { useSession } from "@/lib/authClient";

export type { HotWord };
export { applyHotWords, validateHotWord };

function loadLocal(): HotWord[] {
  try {
    const raw = localStorage.getItem(HOT_WORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: HotWord[]) {
  try {
    localStorage.setItem(HOT_WORDS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useHotWords() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [hotWords, setHotWords] = useState<HotWord[]>(() => loadLocal());
  // Map from trigger → DB id (only populated when signed in)
  const dbIds = useRef<Map<string, string>>(new Map());

  // Load from DB when signed in, localStorage when not
  useEffect(() => {
    if (userId) {
      fetch("/api/hot-words")
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: Array<{ id: string; trigger: string; replacement: string }>) => {
          dbIds.current = new Map(rows.map((r) => [r.trigger, r.id]));
          setHotWords(rows.map((r) => ({ trigger: r.trigger, replacement: r.replacement })));
        })
        .catch(() => {});
    } else {
      dbIds.current = new Map();
      setHotWords(loadLocal());
    }
  }, [userId]);

  const addHotWord = useCallback(
    (trigger: string, replacement: string): string | null => {
      const err = validateHotWord(trigger, replacement);
      if (err) return err;

      if (userId) {
        fetch("/api/hot-words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger: trigger.trim(), replacement: replacement.trim() }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((item) => {
            if (item) {
              dbIds.current.set(item.trigger, item.id);
              setHotWords((prev) => {
                if (prev.some((hw) => hw.trigger.toLowerCase() === item.trigger.toLowerCase())) return prev;
                return [...prev, { trigger: item.trigger, replacement: item.replacement }];
              });
            }
          })
          .catch(() => {});
      } else {
        setHotWords((prev) => {
          if (prev.some((hw) => hw.trigger.toLowerCase() === trigger.toLowerCase())) return prev;
          const updated = [...prev, { trigger: trigger.trim(), replacement: replacement.trim() }];
          saveLocal(updated);
          return updated;
        });
      }
      return null;
    },
    [userId]
  );

  const removeHotWord = useCallback(
    (trigger: string) => {
      if (userId) {
        const id = dbIds.current.get(trigger);
        if (id) {
          fetch(`/api/hot-words?id=${id}`, { method: "DELETE" }).catch(() => {});
          dbIds.current.delete(trigger);
        }
        setHotWords((prev) => prev.filter((hw) => hw.trigger !== trigger));
      } else {
        setHotWords((prev) => {
          const updated = prev.filter((hw) => hw.trigger !== trigger);
          saveLocal(updated);
          return updated;
        });
      }
    },
    [userId]
  );

  const updateHotWord = useCallback(
    (trigger: string, replacement: string): string | null => {
      const err = validateHotWord(trigger, replacement);
      if (err) return err;
      setHotWords((prev) => {
        const updated = prev.map((hw) =>
          hw.trigger === trigger ? { ...hw, replacement: replacement.trim() } : hw
        );
        if (!userId) saveLocal(updated);
        return updated;
      });
      return null;
    },
    [userId]
  );

  return { hotWords, addHotWord, removeHotWord, updateHotWord };
}
