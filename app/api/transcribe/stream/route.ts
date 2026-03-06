import { NextRequest } from "next/server";
import { transcribeAudio } from "@/lib/sarvam";

export const maxDuration = 30;

const enc = new TextEncoder();

function sse(data: object) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  // Cast needed: Node 24 global FormData type conflicts with DOM FormData
  const formData = await req.formData() as unknown as { get(k: string): File | string | null };
  const audioFile = formData.get("audio");
  const mode = formData.get("mode") as string;

  if (!audioFile || !(audioFile instanceof Blob)) {
    return new Response(JSON.stringify({ error: "No audio file" }), { status: 400 });
  }
  if (mode !== "transcribe" && mode !== "translate") {
    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Demo mode — stream demo text word-by-word
        if (!process.env.SARVAM_API_KEY) {
          const demo = mode === "translate"
            ? "[Demo] Please send the report to Rahul by end of day."
            : "[Demo] Open a pull request for the auth module.";
          await streamWords(demo, controller);
          controller.enqueue(sse({ final: demo, demo: true }));
          controller.close();
          return;
        }

        // Send "thinking" signal so UI can transition immediately
        controller.enqueue(sse({ thinking: true }));

        const transcript = await transcribeAudio(audioFile, mode);

        // Stream the transcript back word-by-word (simulated streaming)
        await streamWords(transcript, controller);
        controller.enqueue(sse({ final: transcript }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(sse({ error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/** Emit words one at a time with a short delay to create streaming feel */
async function streamWords(text: string, controller: ReadableStreamDefaultController) {
  const words = text.split(" ");
  let accumulated = "";
  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    controller.enqueue(sse({ partial: accumulated }));
    await delay(45);
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
