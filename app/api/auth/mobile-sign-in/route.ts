import { NextResponse } from "next/server";

/**
 * Starts Google OAuth from within the same browser session used by the mobile app's
 * WebBrowser.openAuthSessionAsync. This preserves auth cookies/state and avoids
 * fallback redirects to the website after account selection.
 */
export async function GET() {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const callbackURL = `${baseUrl}/api/auth/mobile-callback`;
  const escapedCallback = callbackURL
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Bolkar Sign In</title>
  </head>
  <body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; padding: 24px;">
    <p>Redirecting to Google sign-in...</p>
    <p id="e" style="display:none;color:#dc2626;">Failed to start sign-in.</p>
    <script>
      (async function () {
        try {
          const res = await fetch("/api/auth/sign-in/social", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              callbackURL: "${escapedCallback}"
            }),
            redirect: "manual"
          });
          const location = res.headers.get("location");
          if (!location) throw new Error("Missing OAuth redirect URL");
          window.location.replace(location);
        } catch (err) {
          const el = document.getElementById("e");
          if (el) el.style.display = "block";
        }
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
