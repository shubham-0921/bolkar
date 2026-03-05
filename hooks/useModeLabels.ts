"use client";

import { useState, useEffect, useRef } from "react";

// Ordered to match example indices — 0=Hinglish/English, 1=Hindi, 2=Tamil, 3=Telugu, 4=Bengali, 5=Kannada, 6=Marathi
export const MODE_LABELS = [
  { toEnglish: "To English",    asSpoken: "As Spoken"      }, // 0: English / Hinglish
  { toEnglish: "अंग्रेज़ी में",   asSpoken: "जैसे बोला"      }, // 1: Hindi
  { toEnglish: "ஆங்கிலத்தில்",   asSpoken: "பேசியபடி"       }, // 2: Tamil
  { toEnglish: "ఆంగ్లంలో",       asSpoken: "మాట్లాడినట్లు"  }, // 3: Telugu
  { toEnglish: "ইংরেজিতে",       asSpoken: "যেভাবে বললাম"   }, // 4: Bengali
  { toEnglish: "ಆಂಗ್ಲದಲ್ಲಿ",     asSpoken: "ಮಾತಾಡಿದಂತೆ"    }, // 5: Kannada
  { toEnglish: "इंग्रजीत",       asSpoken: "बोललो तसे"      }, // 6: Marathi
];

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
