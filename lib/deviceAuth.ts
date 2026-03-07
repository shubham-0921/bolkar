import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * Returns a userId from the request.
 * Priority: Better Auth session → X-Device-Id header (ghost user fallback).
 * On first device use, auto-creates a ghost user row for the device ID.
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  // Check real auth session first
  const session = await auth.api.getSession({ headers: req.headers });
  if (session?.user?.id) return session.user.id;

  // Fallback: device-based ghost user
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId || deviceId.length < 8) return null;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, deviceId))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  // First time this device connects — create a ghost user row
  await db.insert(users).values({
    id: deviceId,
    name: `device:${deviceId.slice(0, 8)}`,
    email: `device-${deviceId}@bolkar.local`,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return deviceId;
}
