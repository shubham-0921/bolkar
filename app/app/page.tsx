"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as ReactDOM from "react-dom/client";
import Link from "next/link";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import PipBubble from "@/components/PipBubble";
import { useModeLabels } from "@/hooks/useModeLabels";
import { useHistory, timeAgo } from "@/hooks/useHistory";

type Mode = "transcribe" | "translate";

const modeConfig = {
  translate: {
    label: "Speak Hinglish or any Indian language → polished English",
    bg: "#1a0835",
    glow: [
      "radial-gradient(ellipse 160% 90% at 50% -5%, rgba(139,92,246,0.9) 0%, rgba(109,40,217,0.4) 40%, transparent 70%)",
      "linear-gradient(to bottom, rgba(109,40,217,0.25) 0%, transparent 55%)",
    ].join(", "),
    micRingColor: "rgba(167,139,250,0.35)",
    micIdle: "#7c3aed",
    activePillBg: "#7c3aed",
    activePillText: "#ffffff",
    accent: "#c4b5fd",
  },
  transcribe: {
    label: "Speak any language → get text back in that same language",
    bg: "#051a40",
    glow: [
      "radial-gradient(ellipse 160% 90% at 50% -5%, rgba(59,130,246,0.9) 0%, rgba(29,78,216,0.4) 40%, transparent 70%)",
      "linear-gradient(to bottom, rgba(29,78,216,0.25) 0%, transparent 55%)",
    ].join(", "),
    micRingColor: "rgba(147,197,253,0.35)",
    micIdle: "#2563eb",
    activePillBg: "#2563eb",
    activePillText: "#ffffff",
    accent: "#93c5fd",
  },
};

export default function AppPage() {
  const [mode, setMode] = useState<Mode>("translate");
  const [copied, setCopied] = useState(false);
  const [editText, setEditText] = useState<string | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pipRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const { state, result, error, formattedDuration, startRecording, stopRecording, reset } =
    useAudioRecorder();
  const { items: historyItems, addItem: addToHistory, clearHistory } = useHistory();

  useEffect(() => {
    const saved = localStorage.getItem("bolkar-mode") as Mode | null;
    if (saved === "transcribe" || saved === "translate") setMode(saved);
    setPipSupported("documentPictureInPicture" in window);
    if ("Notification" in window && "serviceWorker" in navigator && Notification.permission !== "denied") {
      setNotifSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.getNotifications({ tag: "bolkar-pin" }).then((notifs) => setPinned(notifs.length > 0));
      }).catch(() => {});
    }
  }, []);

  const setAndSaveMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem("bolkar-mode", m);
  };

  useEffect(() => {
    if (state === "result" && result?.transcript) {
      addToHistory(result.transcript, result.mode);
      navigator.clipboard.writeText(result.transcript).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {});
      dismissTimerRef.current = setTimeout(() => reset(), 10000);
    }
    return () => { if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current); };
  }, [state, result, reset]);

  const handleMicClick = () => {
    if (state === "idle" || state === "error" || state === "result") {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setEditText(null);
      startRecording(mode);
    } else if (state === "recording") {
      stopRecording();
    }
  };

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setEditText(null);
    reset();
  };

  const handleCopy = useCallback(() => {
    const text = editText !== null ? editText : result?.transcript ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [editText, result]);

  const launchPip = useCallback(async () => {
    // Close any existing PiP window before opening a new one
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }

    type DPip = { requestWindow(o: { width: number; height: number }): Promise<Window> };
    const dPip = (window as Window & { documentPictureInPicture?: DPip }).documentPictureInPicture;
    if (!dPip) return;

    try {
      const pipWindow = await dPip.requestWindow({ width: 240, height: 320 });
      pipWindowRef.current = pipWindow;
      pipWindow.document.documentElement.style.cssText = "height:100%;margin:0;padding:0;";
      pipWindow.document.body.style.cssText = "height:100%;margin:0;padding:0;overflow:hidden;background:#0c0c0f;";

      const container = pipWindow.document.createElement("div");
      container.style.cssText = "height:100%;";
      pipWindow.document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      pipRootRef.current = root;
      root.render(<PipBubble initialMode={mode} />);
      setPipActive(true);

      pipWindow.addEventListener("pagehide", () => {
        pipRootRef.current?.unmount();
        pipRootRef.current = null;
        pipWindowRef.current = null;
        setPipActive(false);
      });
    } catch (err) {
      console.error("PiP failed:", err);
    }
  }, [mode]);

  const pinToNotifications = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setNotifSupported(false); return; }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.getNotifications({ tag: "bolkar-pin" });
    if (pinned) {
      existing.forEach((n) => n.close());
      setPinned(false);
      return;
    }
    await reg.showNotification("Bolkar", {
      body: "Tap to open and start recording",
      icon: "/icons/icon.svg",
      tag: "bolkar-pin",
      requireInteraction: true,
      silent: true,
    });
    setPinned(true);
  }, [pinned]);

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const showResult = state === "result";
  const showError = state === "error";
  const cfg = modeConfig[mode];
  const modeLabels = useModeLabels();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: cfg.bg, transition: "background-color 0.7s ease" }}
    >
      {/* Mode glow overlays — cross-fade between modes */}
      <div className="pointer-events-none absolute inset-0" style={{ background: modeConfig.translate.glow, opacity: mode === "translate" ? 1 : 0, transition: "opacity 0.7s ease" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: modeConfig.transcribe.glow, opacity: mode === "transcribe" ? 1 : 0, transition: "opacity 0.7s ease" }} />

      {/* Nav */}
      <nav className="relative z-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            bol<span className="transition-colors duration-300" style={{ color: cfg.accent }}>kar</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* History button */}
            <button
              onClick={() => setShowHistory(true)}
              title="View history"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: historyItems.length > 0 ? "rgba(255,255,255,0.06)" : "transparent",
                border: `1px solid ${historyItems.length > 0 ? "rgba(255,255,255,0.1)" : "transparent"}`,
                color: historyItems.length > 0 ? "#a1a1aa" : "#71717a",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              History
              {historyItems.length > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: cfg.activePillBg, color: "#fff", minWidth: 18, textAlign: "center" }}>
                  {historyItems.length}
                </span>
              )}
            </button>
            <div
              className="flex items-center gap-2 rounded-full px-3.5 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "#a1a1aa" }}>Made with</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://assets.sarvam.ai/assets/svgs/sarvam-logo-white.svg"
                alt="Sarvam AI"
                style={{ height: 17, opacity: 0.95 }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Mode toggle */}
          <div className="mb-6 flex justify-center">
            <div
              className="flex rounded-2xl p-1.5 gap-1.5"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            >
              <button
                onClick={() => setAndSaveMode("translate")}
                disabled={isRecording || isProcessing}
                className="flex flex-col items-center gap-1 rounded-xl px-8 py-4 transition-all duration-200 disabled:opacity-40"
                style={{
                  backgroundColor: mode === "translate" ? cfg.activePillBg : "transparent",
                  color: mode === "translate" ? "#ffffff" : "#a1a1aa",
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" />
                    <path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
                  </svg>
                  <span
                    className="text-lg font-semibold"
                    style={{
                      display: "inline-block",
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                      opacity: modeLabels.visible ? 1 : 0,
                      transform: modeLabels.visible ? "translateY(0px)" : "translateY(-6px)",
                      whiteSpace: "nowrap",
                    }}
                  >{modeLabels.toEnglish}</span>
                </div>
                <span className="text-xs font-medium opacity-70">Speak any language → English</span>
              </button>
              <button
                onClick={() => setAndSaveMode("transcribe")}
                disabled={isRecording || isProcessing}
                className="flex flex-col items-center gap-1 rounded-xl px-8 py-4 transition-all duration-200 disabled:opacity-40"
                style={{
                  backgroundColor: mode === "transcribe" ? cfg.activePillBg : "transparent",
                  color: mode === "transcribe" ? "#ffffff" : "#a1a1aa",
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <span
                    className="text-lg font-semibold"
                    style={{
                      display: "inline-block",
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                      opacity: modeLabels.visible ? 1 : 0,
                      transform: modeLabels.visible ? "translateY(0px)" : "translateY(-6px)",
                      whiteSpace: "nowrap",
                    }}
                  >{modeLabels.asSpoken}</span>
                </div>
                <span className="text-xs font-medium opacity-70">Speak → text in same language</span>
              </button>
            </div>
          </div>

          {/* Mode example card */}
          <div
            key={mode}
            className="mb-10 animate-fade-in-up overflow-hidden rounded-2xl"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          >
            <div className="grid grid-cols-2">
              <div className="p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#71717a" }}>You say</p>
                <p className="text-sm italic text-zinc-300 leading-relaxed">
                  {mode === "translate"
                    ? '"yaar report bhejo EOD tak"'
                    : '"kal subah 10 baje meeting hai"'}
                </p>
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#a1a1aa" }}
                >
                  {mode === "translate" ? "Hinglish" : "Hindi"}
                </span>
              </div>
              <div className="p-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.accent }}>Bolkar outputs</p>
                <p className="text-sm font-medium text-white leading-relaxed">
                  {mode === "translate"
                    ? '"Please send the report by end of day."'
                    : '"Kal subah 10 baje meeting hai."'}
                </p>
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${cfg.activePillBg}30`, color: cfg.accent, border: `1px solid ${cfg.activePillBg}50` }}
                >
                  {mode === "translate" ? "Professional English" : "Hindi text"}
                </span>
              </div>
            </div>
          </div>

          {/* Mic area */}
          <div className="flex flex-col items-center">
            <div className="relative mb-8 flex items-center justify-center">
              {isRecording && (
                <>
                  <div className="animate-pulse-ring absolute h-36 w-36 rounded-full bg-red-500/15" />
                  <div className="animate-pulse-ring absolute h-36 w-36 rounded-full bg-red-500/15" style={{ animationDelay: "0.7s" }} />
                </>
              )}
              {!isRecording && !isProcessing && (
                <div
                  className="absolute h-36 w-36 rounded-full transition-all duration-500"
                  style={{ background: `radial-gradient(circle, ${cfg.micRingColor} 0%, transparent 70%)` }}
                />
              )}
              <button
                onClick={handleMicClick}
                disabled={isProcessing}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full shadow-2xl transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: isRecording
                    ? "#ef4444"
                    : isProcessing
                    ? "#27272a"
                    : cfg.micIdle,
                }}
              >
                {isProcessing ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : isRecording ? (
                  <div className="h-9 w-9 rounded-lg bg-white" />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
            </div>

            {isRecording && (
              <div className="mb-5 flex items-center gap-2 animate-fade-in-up">
                <div className="w-1.5 rounded-full bg-red-400 animate-waveform-1" style={{ height: 4 }} />
                <div className="w-1.5 rounded-full bg-red-400 animate-waveform-2" style={{ height: 4 }} />
                <div className="w-1.5 rounded-full bg-red-400 animate-waveform-3" style={{ height: 4 }} />
                <div className="w-1.5 rounded-full bg-red-400 animate-waveform-4" style={{ height: 4 }} />
                <div className="w-1.5 rounded-full bg-red-400 animate-waveform-5" style={{ height: 4 }} />
                <span className="ml-2 text-base font-semibold tabular-nums text-red-400">{formattedDuration}</span>
              </div>
            )}

            <p className="text-base font-medium text-zinc-400">
              {isRecording
                ? "Recording — click to stop"
                : isProcessing
                ? "Processing your speech…"
                : showResult || showError
                ? ""
                : "Click the mic to start"}
            </p>
          </div>

          {/* Use Bolkar Anywhere — shown when idle and at least one option is supported */}
          {!isRecording && !isProcessing && !showResult && !showError && (pipSupported || notifSupported) && (
            <div
              className="mt-10 animate-fade-in-up overflow-hidden rounded-2xl"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            >
              <div className="px-5 pt-5 pb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#71717a" }}>Use Bolkar anywhere</p>
                <p className="mt-1 text-sm" style={{ color: "#a1a1aa" }}>Keep Bolkar accessible while you work in other apps</p>
              </div>
              <div className={`grid gap-3 px-5 pb-5 ${pipSupported && notifSupported ? "grid-cols-2" : "grid-cols-1"}`}>
                {pipSupported && (
                  <button
                    onClick={launchPip}
                    className="group flex flex-col items-start gap-3 rounded-xl p-4 text-left transition-all active:scale-95"
                    style={{
                      backgroundColor: pipActive ? `${cfg.activePillBg}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${pipActive ? `${cfg.activePillBg}60` : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                      style={{ backgroundColor: pipActive ? cfg.activePillBg : "rgba(255,255,255,0.08)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pipActive ? "#fff" : cfg.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="14" x="3" y="3" rx="2" />
                        <rect width="7" height="5" x="12" y="12" rx="1" fill={pipActive ? "#fff" : cfg.accent} stroke="none" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Float it</p>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                        {pipActive ? "Re-open floating bubble" : "Stays on top while you use other apps"}
                      </p>
                    </div>
                    {pipActive && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${cfg.activePillBg}40`, color: cfg.accent }}>
                        Active
                      </span>
                    )}
                  </button>
                )}
                {notifSupported && (
                  <button
                    onClick={pinToNotifications}
                    className="group flex flex-col items-start gap-3 rounded-xl p-4 text-left transition-all active:scale-95"
                    style={{
                      backgroundColor: pinned ? `${cfg.activePillBg}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${pinned ? `${cfg.activePillBg}60` : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                      style={{ backgroundColor: pinned ? cfg.activePillBg : "rgba(255,255,255,0.08)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pinned ? "#fff" : cfg.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {pinned ? "Unpin" : "Pin it"}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                        {pinned ? "Pinned to notification bar — tap to remove" : "Quick access from your notification bar"}
                      </p>
                    </div>
                    {pinned && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${cfg.activePillBg}40`, color: cfg.accent }}>
                        Pinned
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result card */}
          {showResult && result && (
            <div
              className="mt-10 animate-fade-in-up overflow-hidden rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-zinc-400">
                    {result.mode === "translate" ? "Converted to English" : "Kept in your language"}
                  </span>
                </div>
                <span className="text-sm text-zinc-500">Auto-dismiss in 10s</span>
              </div>
              <div className="p-6">
                {editText !== null ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full resize-none rounded-xl p-4 text-base leading-relaxed text-zinc-100 outline-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <p className="text-base leading-relaxed text-zinc-100">{result.transcript}</p>
                )}
              </div>
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Copy — primary action */}
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold transition-all active:scale-95"
                  style={{ backgroundColor: cfg.activePillBg, color: "#fff" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <polyline points="20 6 9 17 4 12" />
                      : <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>
                    }
                  </svg>
                  {copied ? "Copied!" : "Copy"}
                </button>
                {/* Edit */}
                {editText === null ? (
                  <button
                    onClick={() => setEditText(result.transcript)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleCopy}
                    className="rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ color: cfg.accent, border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Copy edited
                  </button>
                )}
                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  className="rounded-xl px-4 py-3 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {showError && error && (
            <div
              className="mt-8 animate-fade-in-up rounded-2xl p-6"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="flex items-start gap-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-400">
                  <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-base font-medium text-red-300">{error}</p>
                  <button onClick={reset} className="mt-2 text-sm font-medium text-red-400 hover:text-red-200">Try again →</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      {copied && (
        <div
          className="animate-toast-slide fixed bottom-8 left-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-2xl"
          style={{ backgroundColor: "#1c1c22", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-medium text-zinc-200">Copied to clipboard</span>
        </div>
      )}

      {/* History panel backdrop */}
      {showHistory && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* History panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col sm:w-96"
        style={{
          backgroundColor: "#0e0e12",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          transform: showHistory ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-white">History</h2>
            <p className="text-xs text-zinc-400">Last {historyItems.length} of 10 saved locally</p>
          </div>
          <div className="flex items-center gap-3">
            {historyItems.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-zinc-500 transition-colors hover:text-red-400">
                Clear all
              </button>
            )}
            <button onClick={() => setShowHistory(false)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {historyItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <p className="text-sm text-zinc-500">No recordings yet.<br />Your conversions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl p-4 transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={item.mode === "translate"
                          ? { backgroundColor: "rgba(124,58,237,0.2)", color: "#c4b5fd" }
                          : { backgroundColor: "rgba(37,99,235,0.2)", color: "#93c5fd" }}
                      >
                        {item.mode === "translate" ? "→ English" : "As spoken"}
                      </span>
                      <span className="text-xs text-zinc-500">{timeAgo(item.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.transcript);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/5 hover:text-zinc-200"
                      title="Copy"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">{item.transcript}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div
          className="px-6 py-4 text-center text-xs text-zinc-500"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          Stored locally in your browser · Never sent to a server
        </div>
      </div>
    </div>
  );
}
