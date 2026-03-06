import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/sarvam";
import { getUserId } from "@/lib/deviceAuth";
import { db } from "@/db";
import { history, hotWords } from "@/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const formData = await req.formData() as unknown as { get(k: string): File | string | null };
    const audioFile = formData.get("audio");
    const mode = formData.get("mode") as string;

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (mode !== "transcribe" && mode !== "translate") {
      return NextResponse.json({ error: "Invalid mode. Use 'transcribe' or 'translate'" }, { status: 400 });
    }

    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json({
        error: "Sarvam API key not configured. Add SARVAM_API_KEY to .env.local",
        demo: true,
        transcript: mode === "translate"
          ? "[Demo] Please send the report to Rahul by end of day."
          : "[Demo] Open a pull request for the auth module.",
      }, { status: 200 });
    }

    let transcript = await transcribeAudio(audioFile, mode);
    const processingMs = Date.now() - start;

    // Apply hot words + save history if device ID is present
    const userId = await getUserId(req).catch(() => null);
    if (userId) {
      // Fetch hot words and apply replacements
      const words = await db
        .select({ trigger: hotWords.trigger, replacement: hotWords.replacement })
        .from(hotWords)
        .where(eq(hotWords.userId, userId));

      for (const { trigger, replacement } of words) {
        const re = new RegExp(trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        transcript = transcript.replace(re, replacement);
      }

      // Save to history (fire-and-forget, don't block response)
      db.insert(history).values({ userId, transcript, mode, processingMs }).catch(() => {});
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[/api/transcribe] Error:", err);
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
