import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotWords } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getUserId } from "@/lib/deviceAuth";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select()
    .from(hotWords)
    .where(eq(hotWords.userId, userId))
    .orderBy(asc(hotWords.createdAt));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { trigger: string; replacement: string };

  if (!body.trigger?.trim() || !body.replacement?.trim()) {
    return NextResponse.json({ error: "trigger and replacement are required" }, { status: 400 });
  }

  const [item] = await db
    .insert(hotWords)
    .values({ userId, trigger: body.trigger.trim(), replacement: body.replacement.trim() })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(hotWords).where(eq(hotWords.id, id));

  return new NextResponse(null, { status: 204 });
}
