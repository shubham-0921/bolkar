"use client";

import { useState } from "react";

const useCases = [
  {
    id: "professional",
    label: "Urban Professional",
    sublabel: "Hinglish → English",
    mode: "Convert to English",
    modeColor: "#7c3aed",
    description: "Speak naturally in Hinglish. Get polished professional English — no mental switching needed.",
    before: "yaar send karo woh report to Rahul by EOD",
    beforeLang: "Hinglish",
    after: "Please send the report to Rahul by end of day.",
  },
  {
    id: "developer",
    label: "Developer",
    sublabel: "Dictate in any language",
    mode: "Keep my language",
    modeColor: "#2563eb",
    description: "Speak in whatever language you think in. Bolkar transcribes it exactly — no keyboard, no interruption.",
    before: "open a pull request for the auth module",
    beforeLang: "English",
    after: "Open a pull request for the auth module.",
  },
  {
    id: "vernacular",
    label: "Vernacular-First",
    sublabel: "Native language → English",
    mode: "Convert to English",
    modeColor: "#7c3aed",
    description: "Think in Hindi, Tamil, or any Indian language. Bolkar bridges the gap to English in one step.",
    before: "Naan innikku meeting la irukken, call pannatheenga",
    beforeLang: "Tamil",
    after: "I am in a meeting today, please do not call.",
  },
];

export default function UseCaseAccordion() {
  const [active, setActive] = useState(0);
  const item = useCases[active];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

      {/* Left: toggles */}
      <div className="flex flex-row gap-3 lg:col-span-2 lg:flex-col">
        {useCases.map((u, i) => {
          const isActive = active === i;
          return (
            <button
              key={u.id}
              onClick={() => setActive(i)}
              className="flex-1 rounded-2xl p-5 text-left transition-all duration-200 lg:flex-none"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${isActive ? `${u.modeColor}66` : "rgba(255,255,255,0.08)"}`,
                boxShadow: isActive ? `0 0 24px 0 ${u.modeColor}18` : "none",
              }}
            >
              <span
                className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${u.modeColor}22`,
                  border: `1px solid ${u.modeColor}44`,
                  color: u.modeColor === "#2563eb" ? "#93c5fd" : "#c4b5fd",
                }}
              >
                {u.mode}
              </span>
              <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-400"}`}>
                {u.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">{u.sublabel}</p>
            </button>
          );
        })}
      </div>

      {/* Right: content */}
      <div
        key={item.id}
        className="flex flex-col justify-between rounded-2xl p-7 lg:col-span-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: `1px solid ${item.modeColor}44`,
        }}
      >
        <p className="text-base leading-relaxed text-zinc-400">{item.description}</p>

        <div className="mt-8 space-y-3">
          {/* You say */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              You say · {item.beforeLang}
            </p>
            <p className="text-sm italic text-zinc-300">&ldquo;{item.before}&rdquo;</p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          {/* Bolkar outputs */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: `${item.modeColor}11`, border: `1px solid ${item.modeColor}33` }}
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: item.modeColor === "#2563eb" ? "#60a5fa" : "#a78bfa" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Bolkar outputs
            </p>
            <p className="text-sm font-medium text-white">{item.after}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
