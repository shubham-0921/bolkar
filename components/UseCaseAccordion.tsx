"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const INTERVAL = 4500;

const useCases = [
  {
    id: "shop-owner",
    emoji: "🏪",
    label: "Shop Owner",
    sublabel: "Hindi → English",
    language: "Hindi",
    color: "#f59e0b",
    colorText: "#fcd34d",
    colorBg: "rgba(245,158,11,0.10)",
    colorBorder: "rgba(245,158,11,0.32)",
    colorGlow: "rgba(245,158,11,0.14)",
    description: "Run your business in Hindi. Bolkar handles the English for supplier orders, customer replies, and inventory messages.",
    before: "Raju bhai ko bol do 50 kilo atta aur 30 kilo daal kal subah bhejna hai",
    after: "Please send 50 kg flour and 30 kg lentils by tomorrow morning.",
  },
  {
    id: "student",
    emoji: "🎓",
    label: "Student",
    sublabel: "Tamil → English",
    language: "Tamil",
    color: "#10b981",
    colorText: "#6ee7b7",
    colorBg: "rgba(16,185,129,0.10)",
    colorBorder: "rgba(16,185,129,0.30)",
    colorGlow: "rgba(16,185,129,0.12)",
    description: "Think in Tamil, write in English. Draft emails, assignment notes, and applications — without the mental effort of translating.",
    before: "Professor ku mail pathaikanum, project ku one week extension venum",
    after: "Dear Professor, I would like to request a one-week extension for my project.",
  },
  {
    id: "sales-rep",
    emoji: "🤝",
    label: "Sales Rep",
    sublabel: "Marathi → English",
    language: "Marathi",
    color: "#0ea5e9",
    colorText: "#7dd3fc",
    colorBg: "rgba(14,165,233,0.10)",
    colorBorder: "rgba(14,165,233,0.30)",
    colorGlow: "rgba(14,165,233,0.12)",
    description: "Capture every client visit in your own language. No typing while driving — Bolkar turns your spoken notes into clean CRM entries.",
    before: "Kulkarni sahebanna sangto ki udya bhetayala yenar aahe, proposal tayar aahe",
    after: "Please tell Kulkarni sir that I'll come to meet him tomorrow. The proposal is ready.",
  },
  {
    id: "doctor",
    emoji: "🩺",
    label: "Doctor",
    sublabel: "Telugu → English",
    language: "Telugu",
    color: "#f43f5e",
    colorText: "#fda4af",
    colorBg: "rgba(244,63,94,0.10)",
    colorBorder: "rgba(244,63,94,0.30)",
    colorGlow: "rgba(244,63,94,0.12)",
    description: "Document patient notes in Telugu, get clean English records. Focus on the patient — not the keyboard.",
    before: "Ee patient ki BP high ga undi, medicine dosage marchandi, two days lo follow up kavali",
    after: "This patient has high BP. Change the medication dosage and follow up in two days.",
  },
  {
    id: "developer",
    emoji: "👨‍💻",
    label: "Developer",
    sublabel: "Kannada → English",
    language: "Kannada",
    color: "#8b5cf6",
    colorText: "#c4b5fd",
    colorBg: "rgba(139,92,246,0.10)",
    colorBorder: "rgba(139,92,246,0.30)",
    colorGlow: "rgba(139,92,246,0.12)",
    description: "Bengaluru's devs think in Kannada, ship in English. Dictate bug reports, PR descriptions, and standup notes without switching modes.",
    before: "Auth module alli bug ide, pull request raise maadi, review aagbekagide",
    after: "There is a bug in the auth module. Please raise a pull request and get it reviewed.",
  },
  {
    id: "creator",
    emoji: "🎬",
    label: "Creator",
    sublabel: "Bengali → English",
    language: "Bengali",
    color: "#f97316",
    colorText: "#fdba74",
    colorBg: "rgba(249,115,22,0.10)",
    colorBorder: "rgba(249,115,22,0.30)",
    colorGlow: "rgba(249,115,22,0.12)",
    description: "Draft video scripts, captions, and ideas in Bengali. Bolkar gives you clean English text, ready to post.",
    before: "Aaj ke video te bolbo keno chai er dokan coffee shop theke beshi bhalo",
    after: "In today's video, I'll talk about why a tea stall is better than a coffee shop.",
  },
];

export default function UseCaseAccordion() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const switchTo = useCallback((i: number) => {
    if (i === activeRef.current) return;
    setVisible(false);
    setTimeout(() => {
      setActive(i);
      setProgress(0);
      setVisible(true);
      setTimerKey((k) => k + 1);
    }, 320);
  }, []);

  useEffect(() => {
    let elapsed = 0;

    const id = setInterval(() => {
      elapsed += 50;
      setProgress(Math.min((elapsed / INTERVAL) * 100, 100));
      if (elapsed >= INTERVAL) {
        clearInterval(id);
        switchTo((activeRef.current + 1) % useCases.length);
      }
    }, 50);

    return () => clearInterval(id);
  }, [timerKey, switchTo]);

  const item = useCases[active];

  return (
    <div className="flex flex-col gap-5">

      {/* Persona chips */}
      <div className="flex flex-wrap gap-2">
        {useCases.map((u, i) => {
          const isActive = active === i;
          return (
            <button
              key={u.id}
              onClick={() => switchTo(i)}
              className="relative overflow-hidden rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300"
              style={{
                backgroundColor: isActive ? u.colorBg : "rgba(255,255,255,0.06)",
                border: `1px solid ${isActive ? u.colorBorder : "rgba(255,255,255,0.10)"}`,
                color: isActive ? u.colorText : "#a1a1aa",
                boxShadow: isActive ? `0 0 18px 0 ${u.colorGlow}` : "none",
              }}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{u.emoji}</span>
                <span>{u.label}</span>
              </span>
              {/* Progress bar */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 h-[2px]"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: u.color,
                    transition: "width 50ms linear",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div
        className="rounded-2xl p-7"
        style={{
          backgroundColor: item.colorBg,
          border: `1px solid ${item.colorBorder}`,
          boxShadow: `0 0 56px 0 ${item.colorGlow}`,
          backdropFilter: "blur(10px)",
          transition: "background-color 0.32s ease, border-color 0.32s ease, box-shadow 0.32s ease",
        }}
      >
        {/* Persona header — fades out upward, in from below */}
        <div
          style={{
            transition: "opacity 0.32s ease, transform 0.32s ease",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-8px)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{
                backgroundColor: "rgba(0,0,0,0.22)",
                border: `1px solid ${item.colorBorder}`,
              }}
            >
              {item.emoji}
            </span>
            <div>
              <p className="text-base font-semibold" style={{ color: item.colorText }}>
                {item.label}
              </p>
              <p className="text-sm" style={{ color: item.color + "99" }}>
                {item.sublabel}
              </p>
            </div>
          </div>
          <p className="text-base leading-relaxed text-zinc-300">{item.description}</p>
        </div>

        {/* Before/after — fades in with slight delay for stagger */}
        <div
          className="mt-8 space-y-3"
          style={{
            transition: "opacity 0.32s ease, transform 0.32s ease",
            transitionDelay: visible ? "0.07s" : "0s",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
          }}
        >
          {/* You say */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: item.color + "cc" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              You say · {item.language}
            </p>
            <p className="text-sm italic text-zinc-200">&ldquo;{item.before}&rdquo;</p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          {/* Bolkar outputs */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", border: `1px solid ${item.colorBorder}` }}
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: item.colorText }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Bolkar outputs · English
            </p>
            <p className="text-sm font-medium text-white">{item.after}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
