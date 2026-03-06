import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Returns a userId from the request.
 * Priority: auth session (future) → X-Device-Id header.
 * On first use, auto-creates a ghost user row for the device ID.
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  // TODO: check real auth session here once OAuth is implemented
  // const session = await auth();
  // if (session?.user?.id) return session.user.id;

  const deviceId = req.headers.get("x-device-id");
  if (!deviceId || deviceId.length < 8) return null;

  // Find or create a ghost user for this device
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, deviceId))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  // First time this device connects — create a user row
  await db.insert(users).values({
    id: deviceId,
    name: `device:${deviceId.slice(0, 8)}`,
  });

  return deviceId;
}
