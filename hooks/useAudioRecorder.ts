"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing" | "result" | "error";

export interface RecorderResult {
  transcript: string;
  mode: "transcribe" | "translate";
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [result, setResult] = useState<RecorderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async (mode: "transcribe" | "translate") => {
    setError(null);
    setResult(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Prefer webm, fall back to ogg, then default
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
        if (timerRef.current) clearInterval(timerRef.current);

        // Strip codec suffix — Sarvam accepts "audio/webm" not "audio/webm;codecs=opus"
        const mimeUsed = (recorder.mimeType || "audio/webm").split(";")[0];
        const audioBlob = new Blob(chunksRef.current, { type: mimeUsed });
        chunksRef.current = [];

        // Pick filename extension that matches the actual MIME type
        const ext = mimeUsed.includes("ogg")
          ? "ogg"
          : mimeUsed.includes("mp4") || mimeUsed.includes("m4a")
            ? "mp4"
            : "webm";

        setState("processing");
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);
          formData.append("mode", mode);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `API error: ${res.status}`);
          }

          const data = await res.json();
          setResult({ transcript: data.transcript, mode });
          setState("result");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
          setState("error");
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setState("recording");
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
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
    setError(null);
    setDuration(0);
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
    error,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    reset,
  };
}
