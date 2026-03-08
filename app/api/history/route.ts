import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { history } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { getUserId } from "@/lib/deviceAuth";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, [{ total, totalWords }]] = await Promise.all([
    db
      .select()
      .from(history)
      .where(eq(history.userId, userId))
      .orderBy(desc(history.createdAt))
      .limit(200),
    db
      .select({
        total: count(),
        totalWords: sql<number>`coalesce(sum(array_length(regexp_split_to_array(trim(${history.transcript}), '\\s+'), 1)), 0)`,
      })
      .from(history)
      .where(eq(history.userId, userId)),
  ]);

  return NextResponse.json({ items, total, totalWords });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    transcript: string;
    mode: "transcribe" | "translate";
    processingMs?: number;
  };

  if (!body.transcript?.trim() || !body.mode) {
    return NextResponse.json({ error: "transcript and mode are required" }, { status: 400 });
  }

  const [item] = await db
    .insert(history)
    .values({
      userId,
      transcript: body.transcript,
      mode: body.mode,
      processingMs: body.processingMs ?? null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    await db.delete(history).where(eq(history.id, id));
  } else {
    await db.delete(history).where(eq(history.userId, userId));
  }

  return new NextResponse(null, { status: 204 });
}
