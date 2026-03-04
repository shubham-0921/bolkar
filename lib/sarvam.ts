const SARVAM_TRANSCRIBE_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/speech-to-text-translate";

export async function transcribeAudio(
  audioBlob: Blob,
  mode: "transcribe" | "translate"
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SARVAM_API_KEY is not configured. Add it to your .env.local file."
    );
  }

  const url =
    mode === "translate" ? SARVAM_TRANSLATE_URL : SARVAM_TRANSCRIBE_URL;

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "saaras:v3");
  // language_code omitted → Sarvam auto-detects

  console.log(`[sarvam] Calling ${url}, blob size: ${audioBlob.size} bytes`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: formData,
  });

  const responseText = await response.text();
  console.log(`[sarvam] Status: ${response.status}, Body: ${responseText}`);

  if (!response.ok) {
    let message = `Sarvam API error ${response.status}`;
    try {
      const errData = JSON.parse(responseText);
      const detail =
        errData.detail ?? errData.message ?? errData.error ?? errData;
      message =
        typeof detail === "string" ? detail : JSON.stringify(detail);
    } catch {
      message = responseText || message;
    }
    throw new Error(message);
  }

  const data = JSON.parse(responseText);
  const text: string = data.transcript ?? "";
  return text;
}
