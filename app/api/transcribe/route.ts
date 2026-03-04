import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/sarvam";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const mode = formData.get("mode") as string;

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (mode !== "transcribe" && mode !== "translate") {
      return NextResponse.json(
        { error: "Invalid mode. Use 'transcribe' or 'translate'" },
        { status: 400 }
      );
    }

    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Sarvam API key not configured. Add SARVAM_API_KEY to .env.local",
          demo: true,
          transcript:
            mode === "translate"
              ? "[Demo] Please send the report to Rahul by end of day."
              : "[Demo] Open a pull request for the auth module.",
        },
        { status: 200 }
      );
    }

    const transcript = await transcribeAudio(audioFile, mode);

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[/api/transcribe] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
