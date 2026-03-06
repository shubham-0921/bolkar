"use client";

import { useState, useCallback } from "react";
import { postProcess } from "@/core/utils/postProcess";
import type { PostProcessOptions, HotWord } from "@/core/types";

export type { PostProcessOptions };
export { postProcess };

const STORAGE_KEY = "bolkar-postprocess";

const DEFAULTS: PostProcessOptions = {
  capitalizeSentences: true,
  removeFillerWords: false,
  applyHotWords: true,
};

function load(): PostProcessOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function usePostProcess() {
  const [options, setOptions] = useState<PostProcessOptions>(() => load());

  const setOption = useCallback(<K extends keyof PostProcessOptions>(
    key: K,
    value: PostProcessOptions[K]
  ) => {
    setOptions((prev) => {
      const updated = { ...prev, [key]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const applyToTranscript = useCallback(
    (text: string, hotWords: HotWord[]) => postProcess(text, options, hotWords),
    [options]
  );

  return { options, setOption, applyToTranscript };
}
