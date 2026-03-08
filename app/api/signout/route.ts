import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") || "/";

  // Use a canonical public origin for redirects to avoid leaking internal
  // hosts such as 0.0.0.0:3000 when running behind a reverse proxy.
  const publicOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    req.nextUrl.origin;

  // Sign out server-side directly (no internal HTTP round-trip)
  await auth.api.signOut({ headers: req.headers }).catch(() => null);

  // `to` comes from query params and can be relative or absolute.
  // Always anchor it to the public origin.
  const res = NextResponse.redirect(new URL(to, publicOrigin));

  // Belt-and-suspenders: expire the session cookies
  res.cookies.set("better-auth.session_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("__Secure-better-auth.session_token", "", { maxAge: 0, path: "/", secure: true });

  return res;
}
