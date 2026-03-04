"use client";

import { useState, useEffect } from "react";

// Same index across both labels so they always show the same language
const LABELS = [
  { toEnglish: "To English",       asSpoken: "As Spoken" },
  { toEnglish: "अंग्रेज़ी में",      asSpoken: "जैसे बोला" },
  { toEnglish: "ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ",    asSpoken: "ਜਿਵੇਂ ਬੋਲਿਆ" },
  { toEnglish: "ইংরেজিতে",          asSpoken: "যেভাবে বললাম" },
  { toEnglish: "ஆங்கிலத்தில்",      asSpoken: "பேசியபடி" },
  { toEnglish: "અંગ્રેજીમાં",         asSpoken: "જેમ બોલ્યા" },
];

export function useModeLabels() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % LABELS.length);
        setVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return {
    toEnglish: LABELS[index].toEnglish,
    asSpoken: LABELS[index].asSpoken,
    visible,
  };
}
