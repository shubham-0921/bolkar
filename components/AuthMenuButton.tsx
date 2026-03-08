"use client";

import { signIn, signOut, useSession } from "@/lib/authClient";

type AuthMenuButtonProps = {
  callbackURL: string;
};

export default function AuthMenuButton({ callbackURL }: AuthMenuButtonProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn.social({ provider: "google", callbackURL })}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
        style={{ backgroundColor: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.18)", color: "#1e293b" }}
      >
        Sign In
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void signOut();
      }}
      title={`Sign out (${session.user.email})`}
      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#a1a1aa", textDecoration: "none" }}
    >
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          {session.user.name?.[0]?.toUpperCase() ?? "?"}
        </span>
      )}
      <span className="hidden sm:inline max-w-[100px] truncate">{session.user.name ?? session.user.email}</span>
    </button>
  );
}
