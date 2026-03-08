"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useModeLabels } from "@/hooks/useModeLabels";
import { TRANSLATE_EXAMPLES, DICTATE_EXAMPLES } from "@/lib/examples";

// Compact canvas waveform for PiP — mirrors LiveWaveform but sized for the 240px bubble
const PIP_BARS = 24;
const PIP_BAR_W = 3;
const PIP_GAP = 2;
const PIP_CW = PIP_BARS * PIP_BAR_W + (PIP_BARS - 1) * PIP_GAP; // 118px
const PIP_CH = 30;

function PipWaveform({ stream, isRecording, accentColor }: { stream: MediaStream | null; isRecording: boolean; accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PIP_CW * dpr;
    canvas.height = PIP_CH * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const drawFlat = () => {
      ctx.clearRect(0, 0, PIP_CW, PIP_CH);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.3;
      const cy = PIP_CH / 2;
      for (let i = 0; i < PIP_BARS; i++) ctx.fillRect(i * (PIP_BAR_W + PIP_GAP), cy - 1, PIP_BAR_W, 2);
      ctx.globalAlpha = 1;
    };

    if (!stream || !isRecording) { drawFlat(); return; }

    let audioCtx: AudioContext;
    try { audioCtx = new AudioContext(); } catch { drawFlat(); return; }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, PIP_CW, PIP_CH);
      ctx.fillStyle = "#f87171";
      for (let i = 0; i < PIP_BARS; i++) {
        const bin = Math.floor((i / PIP_BARS) * Math.min(data.length, 20));
        const raw = data[bin] / 255;
        const above = raw < 0.15 ? 0 : (raw - 0.15) / 0.85;
        const v = Math.min(1, above * 1.6);
        const bh = Math.max(2, v * PIP_CH);
        ctx.fillRect(i * (PIP_BAR_W + PIP_GAP), (PIP_CH - bh) / 2, PIP_BAR_W, bh);
      }
    };
    draw();

    return () => { cancelAnimationFrame(rafRef.current); audioCtx.close(); };
  }, [stream, isRecording, accentColor]);

  return <canvas ref={canvasRef} style={{ width: PIP_CW, height: PIP_CH, display: "block" }} />;
}

type Mode = "transcribe" | "translate";
type RecState = "idle" | "recording" | "processing" | "result" | "error";

// All styles are inline — PiP windows don't inherit parent stylesheets reliably
const S = {
  root: (mode: Mode): React.CSSProperties => ({
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: mode === "translate" ? "#1a0835" : "#051a40",
    transition: "background-color 0.6s ease",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: "antialiased",
    display: "flex",
    flexDirection: "column",
  }),
  glowTranslate: {
    position: "absolute" as const,
    inset: 0,
    background: "radial-gradient(ellipse 160% 80% at 50% -10%, rgba(139,92,246,0.85) 0%, rgba(109,40,217,0.35) 45%, transparent 70%), linear-gradient(to bottom, rgba(109,40,217,0.2) 0%, transparent 60%)",
    pointerEvents: "none" as const,
    transition: "opacity 0.6s ease",
  },
  glowDictate: {
    position: "absolute" as const,
    inset: 0,
    background: "radial-gradient(ellipse 160% 80% at 50% -10%, rgba(59,130,246,0.85) 0%, rgba(29,78,216,0.35) 45%, transparent 70%), linear-gradient(to bottom, rgba(29,78,216,0.2) 0%, transparent 60%)",
    pointerEvents: "none" as const,
    transition: "opacity 0.6s ease",
  },
  content: { position: "relative" as const, zIndex: 1, display: "flex", flexDirection: "column" as const, height: "100%", padding: "12px" },
  modeRow: { display: "flex", gap: 6, marginBottom: 10 },
  modeBtn: (active: boolean, isTranslate: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 4px 7px", borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.25s",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    backgroundColor: active ? (isTranslate ? "#7c3aed" : "#2563eb") : "rgba(255,255,255,0.06)",
    color: active ? "white" : "rgba(255,255,255,0.35)",
  }),
  modeBtnLabel: { fontSize: 12, fontWeight: 700, lineHeight: 1 } as React.CSSProperties,
  modeBtnSub: { fontSize: 9, fontWeight: 500, lineHeight: 1, opacity: 0.7 } as React.CSSProperties,
  exampleStrip: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px",
  } as React.CSSProperties,
  center: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 12 },
  micBtn: (state: RecState, mode: Mode): React.CSSProperties => ({
    width: 72, height: 72, borderRadius: "50%", border: "none", cursor: state === "processing" ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", position: "relative",
    backgroundColor: state === "recording" ? "#ef4444" : state === "processing" ? "#3f3f46" : mode === "translate" ? "#7c3aed" : "#2563eb",
    boxShadow: state === "recording" ? "0 0 0 0 rgba(239,68,68,0.4)" : "none",
  }),
  status: { fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" as const },
  resultCard: {
    backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "10px 12px", maxHeight: 90, overflowY: "auto" as const,
  },
  resultText: { fontSize: 12, color: "#f4f4f5", lineHeight: 1.5, margin: 0 },
  actionsRow: { display: "flex", justifyContent: "space-between", marginTop: 6 },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.35)", padding: "2px 4px" },
  copiedBadge: {
    position: "absolute" as const, bottom: 8, left: "50%", transform: "translateX(-50%)",
    backgroundColor: "#1a1a22", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 100, padding: "4px 10px", fontSize: 11, color: "#d4d4d8",
    display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" as const,
  },
  errorText: { fontSize: 11, color: "#f87171", textAlign: "center" as const, padding: "0 4px" },
};

export default function PipBubble({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [recState, setRecState] = useState<RecState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activated, setActivated] = useState(false);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [exampleVisible, setExampleVisible] = useState(true);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  const activeExamples = mode === "translate" ? TRANSLATE_EXAMPLES : DICTATE_EXAMPLES;
  const modeLabels = useModeLabels(activeExamples[exampleIdx]?.labelIdx ?? 0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRef.current?.stream?.getTracks().forEach((t) => t.stop());
      try { speechRecRef.current?.stop(); speechRecRef.current = null; } catch {}
    };
  }, []);

  // Reset example on mode change
  useEffect(() => {
    setExampleIdx(0);
    setExampleVisible(true);
  }, [mode]);

  // Cycle examples every 5 s
  useEffect(() => {
    const examples = mode === "translate" ? TRANSLATE_EXAMPLES : DICTATE_EXAMPLES;
    const id = setInterval(() => {
      setExampleVisible(false);
      setTimeout(() => {
        setExampleIdx(i => (i + 1) % examples.length);
        setExampleVisible(true);
      }, 500);
    }, 5000);
    return () => clearInterval(id);
  }, [mode]);

  const setModeAndSave = (m: Mode) => {
    setMode(m);
    localStorage.setItem("bolkar-mode", m);
  };

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Clipboard API fails in PiP when unfocused — fallback to execCommand in the PiP doc
  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
      document.body.removeChild(ta);
    });
  }, []);

  const addToHistory = useCallback((text: string, m: Mode, ms?: number) => {
    if (!text.trim()) return;
    try {
      const raw = localStorage.getItem("bolkar-history");
      const items = raw ? JSON.parse(raw) : [];
      const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, transcript: text, mode: m, timestamp: Date.now(), processingMs: ms };
      localStorage.setItem("bolkar-history", JSON.stringify([entry, ...items].slice(0, 10)));
    } catch {}
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setTranscript("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLiveStream(stream);
      setLiveTranscript("");
      // Start live speech recognition (Web Speech API — Chrome/Android WebView)
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        try {
          const rec: any = new SpeechRecognitionAPI();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "";
          rec.onresult = (e: any) => {
            let partial = "";
            for (let i = e.resultIndex; i < e.results.length; i++) partial += e.results[i][0].transcript;
            if (partial) setLiveTranscript(partial);
          };
          rec.onerror = () => {};
          rec.start();
          speechRecRef.current = rec;
        } catch {}
      }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        try { speechRecRef.current?.stop(); speechRecRef.current = null; } catch {}
        setLiveTranscript("");
        stream.getTracks().forEach((t) => t.stop());
        setLiveStream(null);
        if (timerRef.current) clearInterval(timerRef.current);
        const mime = (recorder.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "webm";
        setRecState("processing");
        const pipProcStart = Date.now();
        try {
          const fd = new FormData();
          fd.append("audio", blob, `recording.${ext}`);
          fd.append("mode", mode);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
          const ms = Date.now() - pipProcStart;
          setProcessingMs(ms);
          setTranscript(data.transcript);
          setRecState("result");
          addToHistory(data.transcript, mode, ms);
          copyText(data.transcript);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
          setRecState("error");
        }
      };

      recorder.start(250);
      setRecState("recording");
      setDuration(0);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    } catch (err) {
      setLiveStream(null);
      setError(err instanceof DOMException && err.name === "NotAllowedError" ? "Mic access denied" : "Could not start recording");
      setRecState("error");
    }
  }, [mode, copyText, addToHistory]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current && recState === "recording") mediaRef.current.stop();
  }, [recState]);

  const reset = () => { setTranscript(""); setError(""); setDuration(0); setProcessingMs(null); setRecState("idle"); };

  const handleMic = () => {
    if (recState === "idle" || recState === "error" || recState === "result") startRecording();
    else if (recState === "recording") stopRecording();
  };

  return (
    <div style={S.root(mode)}>
      <div style={{ ...S.glowTranslate, opacity: mode === "translate" ? 1 : 0 }} />
      <div style={{ ...S.glowDictate, opacity: mode === "transcribe" ? 1 : 0 }} />

      {/* Activation gate — Chrome requires a real click inside the PiP window for it
          to receive "user activation" status and stay visible when switching apps.
          Programmatic focus() doesn't count. One tap here fixes it permanently. */}
      {!activated && (
        <button
          onClick={() => setActivated(true)}
          style={{
            position: "absolute", inset: 0, zIndex: 20,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: mode === "translate" ? "#7c3aed" : "#2563eb",
            boxShadow: `0 0 24px ${mode === "translate" ? "rgba(124,58,237,0.5)" : "rgba(37,99,235,0.5)"}`,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Tap to activate</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center", padding: "0 24px", lineHeight: 1.4 }}>
            Required once to keep window visible across apps
          </p>
        </button>
      )}
      <div style={S.content}>
        {/* Mode toggle */}
        <div style={S.modeRow}>
          <button style={S.modeBtn(mode === "translate", true)} onClick={() => setModeAndSave("translate")} disabled={recState === "recording" || recState === "processing"}>
            <span style={{ ...S.modeBtnLabel, display: "inline-block", transition: "opacity 0.35s ease, transform 0.35s ease", opacity: modeLabels.visible ? 1 : 0, transform: modeLabels.visible ? "translateY(0px)" : "translateY(-5px)", whiteSpace: "nowrap" }}>{modeLabels.toEnglish}</span>
            <span style={S.modeBtnSub}>any lang → EN</span>
          </button>
          <button style={S.modeBtn(mode === "transcribe", false)} onClick={() => setModeAndSave("transcribe")} disabled={recState === "recording" || recState === "processing"}>
            <span style={{ ...S.modeBtnLabel, display: "inline-block", transition: "opacity 0.35s ease, transform 0.35s ease", opacity: modeLabels.visible ? 1 : 0, transform: modeLabels.visible ? "translateY(0px)" : "translateY(-5px)", whiteSpace: "nowrap" }}>{modeLabels.asSpoken}</span>
            <span style={S.modeBtnSub}>same language</span>
          </button>
        </div>

        {/* Center mic */}
        <div style={S.center}>
          <button onClick={handleMic} disabled={recState === "processing"} style={S.micBtn(recState, mode)}>
            {recState === "processing" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : recState === "recording" ? (
              <div style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: "white" }} />
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>

          {/* Waveform — shown when idle or recording */}
          {(recState === "idle" || recState === "recording") && (
            <PipWaveform
              stream={liveStream}
              isRecording={recState === "recording"}
              accentColor={mode === "translate" ? "#e9d5ff" : "#bfdbfe"}
            />
          )}

          {/* Live transcript — shown while recording when speech is detected */}
          {recState === "recording" && liveTranscript && (
            <div style={{
              width: "100%",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "6px 10px",
              maxHeight: 56,
              overflowY: "auto" as const,
            }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                {liveTranscript}
              </p>
            </div>
          )}

          {/* Timer — shown while recording */}
          {recState === "recording" && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", fontVariantNumeric: "tabular-nums" as const }}>
              {fmtDuration(duration)}
            </span>
          )}

          {/* Status */}
          <p style={S.status}>
            {recState === "recording" ? "click to stop"
              : recState === "processing" ? "Processing..."
              : recState === "idle" ? "Click mic to start"
              : ""}
          </p>

          {/* Example strip — idle only, revolving */}
          {recState === "idle" && (() => {
            const ex = activeExamples[exampleIdx];
            const accentColor = mode === "translate" ? "#e9d5ff" : "#bfdbfe";
            return (
              <div style={S.exampleStrip}>
                <div style={{ opacity: exampleVisible ? 1 : 0, transform: exampleVisible ? "translateY(0px)" : "translateY(5px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                      {mode === "translate" ? "→ English" : "As spoken"}
                    </p>
                    <span style={{ fontSize: 9, color: accentColor, fontWeight: 600, opacity: 0.8 }}>{ex.lang}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", fontStyle: "italic" }}>
                    &ldquo;{ex.input}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 0 4px" }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <p style={{ fontSize: 10, color: "#f4f4f5", margin: 0, fontWeight: 500 }}>
                    &ldquo;{ex.output}&rdquo;
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Error */}
          {recState === "error" && (
            <div style={{ textAlign: "center" }}>
              <p style={S.errorText}>{error}</p>
              <button onClick={reset} style={{ ...S.actionBtn, color: "#f87171", fontSize: 11, marginTop: 4 }}>Try again →</button>
            </div>
          )}

          {/* Result */}
          {recState === "result" && transcript && (
            <div style={{ width: "100%" }}>
              {processingMs && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 100, padding: "2px 8px" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>{(processingMs / 1000).toFixed(1)}s</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#a1a1aa", fontWeight: 500 }}>Sarvam AI</span>
                </div>
              )}
              <div style={S.resultCard}>
                <p style={S.resultText}>{transcript}</p>
              </div>
              <div style={S.actionsRow}>
                <button
                  onClick={() => copyText(transcript)}
                  style={{
                    flex: 1,
                    backgroundColor: mode === "translate" ? "#7c3aed" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <polyline points="20 6 9 17 4 12" />
                      : <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>
                    }
                  </svg>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copied toast */}
      {copied && (
        <div style={S.copiedBadge}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>
    </div>
  );
}
