import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotWords } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
// TODO: re-enable auth once dev server is stable
// import { auth } from "@/auth";
async function getUserId(_req: NextRequest): Promise<string | null> {
  return null;
}

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
    .values({ userId, trigger: body.trigger, replacement: body.replacement })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db
    .delete(hotWords)
    .where(eq(hotWords.id, id) && eq(hotWords.userId, userId) as any);

  return new NextResponse(null, { status: 204 });
}
