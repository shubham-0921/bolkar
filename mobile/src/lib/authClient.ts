import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

const TOKEN_KEY = "bolkar-auth-token";
const USER_KEY = "bolkar-auth-user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

let _state: AuthState = { token: null, user: null };
let _listeners: Array<(state: AuthState) => void> = [];

function notify(state: AuthState) {
  _state = state;
  _listeners.forEach((l) => l(state));
}

/** Load persisted session from SecureStore. Call once on app startup. */
export async function initAuth(): Promise<AuthState> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    _state = { token, user };
    return _state;
  } catch {
    return { token: null, user: null };
  }
}

/**
 * Initiates Google OAuth via expo-web-browser.
 * Flow:
 *   1. Open /api/auth/mobile-sign-in in system browser
 *   2. Server starts Google sign-in (HTML auto-submit or JSON url fallback)
 *   3. After OAuth, server redirects to bolkar://auth?token=xxx
 *   4. Parse token, fetch user, persist in SecureStore
 */
export async function googleSignIn(backendUrl: string): Promise<AuthState> {
  // Step 1+2: Start OAuth via /api/auth/mobile-sign-in.
  // Supports:
  // - New backend: HTML page that auto-posts to Better Auth social route
  // - Old backend: JSON { url } with direct Google OAuth URL
  const mobileEntryUrl = `${backendUrl}/api/auth/mobile-sign-in`;
  let authStartUrl = mobileEntryUrl;
  try {
    const probe = await fetch(mobileEntryUrl, { headers: { Accept: "application/json" } });
    const contentType = probe.headers.get("content-type") || "";
    if (probe.ok && contentType.includes("application/json")) {
      const data = (await probe.json()) as { url?: string };
      if (data?.url) authStartUrl = data.url;
    }
  } catch {
    // If probing fails, open the mobile entry URL directly.
  }

  const result = await WebBrowser.openAuthSessionAsync(authStartUrl, "bolkar://");

  if (result.type !== "success") throw new Error("OAuth cancelled");

  // Step 3: Parse token from bolkar://auth?token=xxx
  const callbackUrl = new URL(result.url);
  const token = callbackUrl.searchParams.get("token");
  const error = callbackUrl.searchParams.get("error");
  if (error) throw new Error(error);
  if (!token) throw new Error("No token in OAuth callback");

  // Step 4: Get user details using Bearer token
  const sessionRes = await fetch(`${backendUrl}/api/auth/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!sessionRes.ok) throw new Error("Failed to get session");
  const session = (await sessionRes.json()) as { user: AuthUser };

  const state: AuthState = { token, user: session.user };
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
  notify(state);
  return state;
}

/** Signs out — clears SecureStore and revokes the server session. */
export async function authSignOut(backendUrl: string): Promise<void> {
  if (_state.token) {
    await fetch(`${backendUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${_state.token}` },
    }).catch(() => {});
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  notify({ token: null, user: null });
}

/** Current in-memory auth state. */
export function getAuthState(): AuthState {
  return _state;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(listener: (state: AuthState) => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}
