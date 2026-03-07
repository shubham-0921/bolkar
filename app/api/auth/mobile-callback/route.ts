import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Called by the browser after Google OAuth completes.
 * Reads the session cookie (set by Better Auth in the same browser session),
 * then redirects to the mobile deep link with the session token as a query param.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const token = session?.session?.token;

  if (!token) {
    return NextResponse.redirect("bolkar://auth?error=sign_in_failed");
  }

  return NextResponse.redirect(`bolkar://auth?token=${encodeURIComponent(token)}`);
}
