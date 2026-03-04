"use client";

import { useState } from "react";

const languages = [
  { lang: "Hindi",    native: "हिं",   color: "#60a5fa", say: "Main thoda busy hoon abhi",          out: "I'm a bit busy right now." },
  { lang: "Hinglish", native: "Hi+हि", color: "#818cf8", say: "yaar meeting push kar do kal tak",    out: "Please reschedule the meeting to tomorrow." },
  { lang: "Tamil",    native: "தமி",   color: "#f472b6", say: "Naan innikku office la illai",        out: "I am not in the office today." },
  { lang: "Telugu",   native: "తెలు",  color: "#fb923c", say: "Nenu velutunna, padi nimishalu",      out: "I'm leaving in 10 minutes." },
  { lang: "Bengali",  native: "বাং",   color: "#34d399", say: "Ami ekhon meeting-e achi",            out: "I am in a meeting right now." },
  { lang: "Marathi",  native: "मरा",   color: "#facc15", say: "Mala aadhee pathav email",            out: "Send me the email first." },
  { lang: "Gujarati", native: "ગુજ",   color: "#c084fc", say: "Hu aavto chu, paanch minute",         out: "I'm coming in 5 minutes." },
  { lang: "Kannada",  native: "ಕನ್ನ",  color: "#2dd4bf", say: "Naanu conference call nalli iddeeni", out: "I am on a conference call." },
  { lang: "+15 more", native: "···",   color: "#71717a", say: "Punjabi · Odia · Malayalam · Urdu…",  out: "22 Indian languages total" },
];

export default function LanguageChips() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {languages.map(({ lang, native, color, say, out }) => {
        const isHovered = hovered === lang;
        const isMore = lang === "+15 more";

        return (
          <div
            key={lang}
            className="relative"
            onMouseEnter={() => setHovered(lang)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Chip */}
            <div
              className="flex cursor-default items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-all duration-200"
              style={{
                backgroundColor: isHovered
                  ? `color-mix(in srgb, ${color} 14%, transparent)`
                  : `color-mix(in srgb, ${color} 6%, transparent)`,
                border: `1px solid ${isHovered
                  ? `color-mix(in srgb, ${color} 45%, transparent)`
                  : `color-mix(in srgb, ${color} 18%, transparent)`}`,
                boxShadow: isHovered ? `0 0 14px color-mix(in srgb, ${color} 20%, transparent)` : "none",
                color: isHovered ? "#e4e4e7" : "#71717a",
              }}
            >
              {/* Native script */}
              <span
                className="font-medium transition-all duration-200"
                style={{
                  fontSize: 10,
                  color: isHovered ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
                  letterSpacing: isMore ? "0.05em" : undefined,
                }}
              >
                {native}
              </span>

              {/* Divider */}
              <span style={{ color: isHovered ? `color-mix(in srgb, ${color} 30%, transparent)` : "rgba(255,255,255,0.1)", fontSize: 9 }}>|</span>

              {/* English name */}
              <span className="font-medium" style={{ fontSize: 13 }}>{lang}</span>
            </div>

            {/* Tooltip */}
            <div
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-56 rounded-2xl p-3.5"
              style={{
                backgroundColor: "#111113",
                border: `1px solid color-mix(in srgb, ${color} 25%, rgba(255,255,255,0.08))`,
                boxShadow: `0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03), 0 0 20px color-mix(in srgb, ${color} 10%, transparent)`,
                opacity: isHovered ? 1 : 0,
                transform: `translateX(-50%) translateY(${isHovered ? "0px" : "8px"})`,
                transition: "opacity 0.18s ease, transform 0.18s ease",
              }}
            >
              {/* Arrow */}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2"
                style={{
                  width: 0, height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `5px solid color-mix(in srgb, ${color} 25%, rgba(255,255,255,0.08))`,
                }}
              />

              {/* Language label */}
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color }}>{native}</span>
                <span className="text-xs font-semibold text-zinc-300">{lang}</span>
              </div>

              {/* You say */}
              <p className="mb-2 text-xs italic leading-relaxed text-zinc-500">&ldquo;{say}&rdquo;</p>

              {/* Arrow divider */}
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Output */}
              <p className="text-xs font-semibold leading-relaxed text-zinc-100">{out}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
