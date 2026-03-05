"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 40;
const BAR_W = 3;
const GAP = 2;
const W = BAR_COUNT * BAR_W + (BAR_COUNT - 1) * GAP; // 198px
const H = 52;

interface Props {
  stream: MediaStream | null;
  isRecording: boolean;
  idleColor: string; // color of flat bars when not recording
}

export default function LiveWaveform({ stream, isRecording, idleColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Draw flat baseline (idle state)
    const drawFlat = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = idleColor;
      ctx.globalAlpha = 0.3;
      const cy = H / 2;
      for (let i = 0; i < BAR_COUNT; i++) {
        ctx.fillRect(i * (BAR_W + GAP), cy - 1, BAR_W, 2);
      }
      ctx.globalAlpha = 1;
    };

    if (!stream || !isRecording) {
      drawFlat();
      return;
    }

    // Connect to live audio
    let audioCtx: AudioContext;
    try {
      audioCtx = new AudioContext();
    } catch {
      drawFlat();
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // 64 frequency bins
    analyser.smoothingTimeConstant = 0.7;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Ignore signals below this fraction of max amplitude (ambient noise floor)
    const NOISE_FLOOR = 0.15;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f87171"; // red-400

      for (let i = 0; i < BAR_COUNT; i++) {
        // Focus on voice frequency range (lower bins)
        const bin = Math.floor((i / BAR_COUNT) * Math.min(dataArray.length, 40));
        const raw = dataArray[bin] / 255;
        // Apply noise floor: values below threshold collapse to 0
        const above = raw < NOISE_FLOOR ? 0 : (raw - NOISE_FLOOR) / (1 - NOISE_FLOOR);
        // Boost mid-range: 1.6x gain so normal speech reaches near the top, cap at 1
        const v = Math.min(1, above * 1.6);
        const bh = Math.max(2, v * H);
        const x = i * (BAR_W + GAP);
        const y = (H - bh) / 2;
        ctx.fillRect(x, y, BAR_W, bh);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtx.close();
    };
  }, [stream, isRecording, idleColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H, display: "block" }}
    />
  );
}
