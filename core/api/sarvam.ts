// Platform-agnostic Sarvam API client.
// Takes apiKey as a parameter — no process.env dependency.
// Works in browser, Node.js, and React Native.

import type { TranscriptionMode } from "../types";

const SARVAM_TRANSCRIBE_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/speech-to-text-translate";

export interface SarvamTranscribeOptions {
  apiKey: string;
  audioBlob: Blob;
  fileName?: string;  // e.g. "recording.webm"
  mode: TranscriptionMode;
}

export async function sarvamTranscribe({
  apiKey,
  audioBlob,
  fileName = "recording.webm",
  mode,
}: SarvamTranscribeOptions): Promise<string> {
  const url = mode === "translate" ? SARVAM_TRANSLATE_URL : SARVAM_TRANSCRIBE_URL;

  const formData = new FormData();
  formData.append("file", audioBlob, fileName);
  formData.append("model", "saaras:v3");
  formData.append("language_code", "unknown");

  const response = await fetch(url, {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body: formData,
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = `Sarvam API error ${response.status}`;
    try {
      const errData = JSON.parse(responseText);
      const detail = errData.detail ?? errData.message ?? errData.error ?? errData;
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } catch {
      message = responseText || message;
    }
    throw new Error(message);
  }

  const data = JSON.parse(responseText);
  return (data.transcript as string) ?? "";
}
