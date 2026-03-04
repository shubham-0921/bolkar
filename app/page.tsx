import Link from "next/link";
import UseCaseAccordion from "@/components/UseCaseAccordion";
import BolAnimation from "@/components/BolAnimation";
import LanguageChips from "@/components/LanguageChips";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#09090b" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(145deg, #1d4ed8, #4f46e5)", boxShadow: "0 0 14px rgba(37,99,235,0.35)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-zinc-500">bol</span><span className="text-zinc-100">kar</span>
            </span>
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Launch App
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-96"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 100%)" }}
        />

        <div className="relative">
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-blue-400"
            style={{ backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)" }}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Powered by Sarvam AI · Saaras v3 · 22 Indian Languages
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-3xl text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
            Don&apos;t type, just{" "}
            <BolAnimation /><span className="text-white">.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-zinc-400 sm:text-2xl">
            The voice-to-text AI built for how India speaks. Talk naturally — get clean, professional text instantly.
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex items-center gap-2.5 rounded-full bg-blue-600 px-9 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Start for free
            </Link>
            <span className="text-base text-zinc-500">No signup · Works in your browser</span>
          </div>

          {/* Language chips */}
          <LanguageChips />
        </div>
      </section>

      {/* Transformation demo */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-blue-500">
            See it in action
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* You say */}
            <div
              className="rounded-2xl p-7"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500">You say</span>
              </div>
              <p className="text-lg italic leading-relaxed text-zinc-300">&ldquo;yaar Rahul ko bol dena ki aaj meeting 3 baje hai, confirm karo&rdquo;</p>
              <span
                className="mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium text-zinc-400"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Hinglish
              </span>
            </div>

            {/* Bolkar outputs */}
            <div
              className="rounded-2xl p-7"
              style={{ backgroundColor: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm font-semibold uppercase tracking-wide text-blue-400">Bolkar outputs</span>
              </div>
              <p className="text-lg font-medium leading-relaxed text-white">&ldquo;Please let Rahul know that today&apos;s meeting is at 3 PM. Please confirm.&rdquo;</p>
              <span
                className="mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium text-blue-400"
                style={{ backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}
              >
                Professional English
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-white">22</p>
              <p className="mt-2 text-base text-zinc-400">Indian languages</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white">4×</p>
              <p className="mt-2 text-base text-zinc-400">Faster than typing</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white">0</p>
              <p className="mt-2 text-base text-zinc-400">Signup required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.015)" }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
              Who it&apos;s for
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Works for how you already speak.
            </h2>
          </div>
          <UseCaseAccordion />
        </div>
      </section>

      {/* Big CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to stop typing?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-zinc-400">
            Open the app, pick your mode, and just speak. Your text is ready in seconds.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-12 py-5 text-xl font-semibold text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Open Bolkar
            </Link>
            <p className="text-base text-zinc-600">Install as PWA · No account needed</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: "linear-gradient(145deg, #1d4ed8, #4f46e5)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-zinc-500">bol</span><span className="text-zinc-100">kar</span>
            </span>
          </div>
          <p className="text-base text-zinc-500">Voice-to-text built for how India speaks.</p>
          <p className="text-sm text-zinc-500">
            Powered by <span className="font-semibold text-zinc-300">Sarvam AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
