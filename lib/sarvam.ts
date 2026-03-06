// Server-side wrapper: reads SARVAM_API_KEY from process.env and delegates to core.
import { sarvamTranscribe } from "@/core/api/sarvam";
import type { TranscriptionMode } from "@/core/types";

export async function transcribeAudio(
  audioBlob: Blob,
  mode: TranscriptionMode
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SARVAM_API_KEY is not configured. Add it to your .env.local file."
    );
  }

  console.log(`[sarvam] mode=${mode}, blob size: ${audioBlob.size} bytes`);
  const transcript = await sarvamTranscribe({ apiKey, audioBlob, mode });
  console.log(`[sarvam] transcript: ${transcript.slice(0, 80)}...`);
  return transcript;
}
