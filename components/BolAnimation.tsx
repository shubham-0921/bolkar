"use client";

import { useState, useEffect } from "react";

const words = [
  { text: "बोलो", lang: "Hindi" },
  { text: "speak", lang: "English" },
  { text: "ਬੋਲੋ", lang: "Punjabi" },
  { text: "பேசு", lang: "Tamil" },
  { text: "বলো", lang: "Bengali" },
  { text: "మాట్లాడు", lang: "Telugu" },
  { text: "بولو", lang: "Urdu" },
  { text: "ಮಾತಾಡು", lang: "Kannada" },
  { text: "બોલો", lang: "Gujarati" },
  { text: "പറയൂ", lang: "Malayalam" },
  { text: "बोल", lang: "Marathi" },
];

export default function BolAnimation() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="relative inline-flex flex-col items-center"
      style={{ minWidth: "2em", textAlign: "center" }}
    >
      <span
        style={{
          color: "#c4b5fd",
          display: "inline-block",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0px)" : "translateY(-10px)",
        }}
      >
        {words[index].text}
      </span>
      <span
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-normal tracking-widest text-zinc-400 uppercase"
        style={{
          transition: "opacity 0.35s ease",
          opacity: visible ? 1 : 0,
          whiteSpace: "nowrap",
        }}
      >
        {words[index].lang}
      </span>
    </span>
  );
}
