"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing" | "result" | "error";

export interface RecorderResult {
  transcript: string;
  mode: "transcribe" | "translate";
  processingMs: number;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [result, setResult] = useState<RecorderResult | null>(null);
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async (mode: "transcribe" | "translate") => {
    setError(null);
    setResult(null);
    setPartialTranscript("");
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLiveStream(stream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
          ? "audio/ogg;codecs=opus"
          : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setLiveStream(null);
        if (timerRef.current) clearInterval(timerRef.current);
        if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

        const mimeUsed = (recorder.mimeType || "audio/webm").split(";")[0];
        const audioBlob = new Blob(chunksRef.current, { type: mimeUsed });
        chunksRef.current = [];

        const ext = mimeUsed.includes("ogg") ? "ogg"
          : mimeUsed.includes("mp4") || mimeUsed.includes("m4a") ? "mp4"
          : "webm";

        setState("processing");
        const processingStart = Date.now();

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);
          formData.append("mode", mode);

          const res = await fetch("/api/transcribe/stream", {
            method: "POST",
            body: formData,
          });

          if (!res.ok || !res.body) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `API error: ${res.status}`);
          }

          // Consume SSE stream
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.partial) {
                  setPartialTranscript(payload.partial);
                }
                if (payload.final !== undefined) {
                  setResult({
                    transcript: payload.final,
                    mode,
                    processingMs: Date.now() - processingStart,
                  });
                  setPartialTranscript("");
                  setLiveTranscript("");
                  setState("result");
                }
                if (payload.error) {
                  throw new Error(payload.error);
                }
              } catch (parseErr) {
                if (parseErr instanceof SyntaxError) continue;
                throw parseErr;
              }
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
          setPartialTranscript("");
          setLiveTranscript("");
          setState("error");
        }
      };

      recorder.start(250);
      setState("recording");
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Rolling live transcription: send accumulated audio every 4s
      const mimeForLive = recorder.mimeType || "audio/webm";
      const mimeTypeForLive = mimeForLive.split(";")[0];
      const extForLive = mimeTypeForLive.includes("ogg") ? "ogg"
        : mimeTypeForLive.includes("mp4") || mimeTypeForLive.includes("m4a") ? "mp4"
        : "webm";

      liveIntervalRef.current = setInterval(async () => {
        const snapshot = [...chunksRef.current];
        if (snapshot.length < 2) return; // ~500ms of audio minimum
        const blob = new Blob(snapshot, { type: mimeTypeForLive });
        const fd = new FormData();
        fd.append("audio", blob, `live.${extForLive}`);
        fd.append("mode", mode);
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (res.ok) {
            const d = await res.json();
            if (d.transcript) setLiveTranscript(d.transcript);
          }
        } catch {
          // silently ignore live transcription errors
        }
      }, 2000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access and try again.");
      } else {
        setError("Could not start recording. Please check your microphone.");
      }
      setState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const reset = useCallback(() => {
    setResult(null);
    setPartialTranscript("");
    setLiveTranscript("");
    setError(null);
    setDuration(0);
    setLiveStream(null);
    setState("idle");
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return {
    state,
    result,
    partialTranscript,
    liveTranscript,
    error,
    duration,
    liveStream,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    reset,
  };
}
