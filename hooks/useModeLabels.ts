"use client";

import { useState, useEffect, useRef } from "react";
import { MODE_LABELS } from "@/core/data/languages";

export { MODE_LABELS };

// When controlledIdx is provided the hook syncs to it (driven by example card).
// When omitted it cycles independently (legacy behaviour).
export function useModeLabels(controlledIdx?: number) {
  const [index, setIndex] = useState(controlledIdx ?? 0);
  const [visible, setVisible] = useState(true);
  const prevControlled = useRef(controlledIdx);

  // Sync to external index when it changes
  useEffect(() => {
    if (controlledIdx === undefined) return;
    if (controlledIdx === prevControlled.current) return;
    prevControlled.current = controlledIdx;

    setVisible(false);
    const t = setTimeout(() => {
      setIndex(controlledIdx);
      setVisible(true);
    }, 350);
    return () => clearTimeout(t);
  }, [controlledIdx]);

  // Independent cycling only when not controlled
  useEffect(() => {
    if (controlledIdx !== undefined) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MODE_LABELS.length);
        setVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(id);
  }, [controlledIdx]);

  return {
    toEnglish: MODE_LABELS[index].toEnglish,
    asSpoken: MODE_LABELS[index].asSpoken,
    visible,
  };
}
