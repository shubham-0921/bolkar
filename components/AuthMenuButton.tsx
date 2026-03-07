"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "@/lib/authClient";

type AuthMenuButtonProps = {
  callbackURL: string;
};

export default function AuthMenuButton({ callbackURL }: AuthMenuButtonProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await signOut();
    } finally {
      window.location.assign(callbackURL);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn.social({ provider: "google", callbackURL })}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
        style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#ffffff" }}
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        title={`Signed in as ${session.user.email}`}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#a1a1aa" }}
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[11rem] rounded-xl p-1.5"
          style={{ backgroundColor: "#101016", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}
        >
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            style={{ color: "#f4f4f5" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 21 7-9-7-9" />
              <path d="M3 12h13" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
