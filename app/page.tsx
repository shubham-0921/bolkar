import Link from "next/link";
import UseCaseAccordion from "@/components/UseCaseAccordion";
import BolAnimation from "@/components/BolAnimation";
import LanguageChips from "@/components/LanguageChips";
import BolkarLogo from "@/components/BolkarLogo";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#08030f" }}>

      {/* Purple glow — deeper base makes this pop more */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 160% 80% at 50% -5%, rgba(139,92,246,0.95) 0%, rgba(109,40,217,0.45) 38%, transparent 75%)",
            "linear-gradient(to bottom, rgba(109,40,217,0.22) 0%, rgba(88,28,135,0.07) 65%, transparent 100%)",
          ].join(", "),
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 sticky top-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <BolkarLogo size={26} />
            <span>bol<span style={{ color: "#c4b5fd" }}>kar</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3.5 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "#d4d4d8" }}>Made with</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://assets.sarvam.ai/assets/svgs/sarvam-logo-white.svg"
                alt="Sarvam AI"
                style={{
                  height: 18,
                  filter: "drop-shadow(0 0 6px rgba(255,255,255,0.95)) drop-shadow(0 0 14px rgba(255,180,60,0.55))",
                }}
              />
              <span className="text-xs font-semibold" style={{ color: "#ffffff" }}>Sarvam</span>
            </div>
            <Link
              href="/app"
              className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — 2-col: copy left, demo right */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left: copy */}
          <div>
            {/* Badge */}
            <div
              className="mb-6 inline-flex flex-wrap items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ backgroundColor: "rgba(249,115,22,0.12)", border: "1.5px solid rgba(249,115,22,0.4)", color: "#fb923c", boxShadow: "0 0 20px rgba(249,115,22,0.15)" }}
            >
              <span className="text-base">🇮🇳</span>
              <span>Made in India</span>
              <span style={{ color: "rgba(249,115,22,0.45)" }}>·</span>
              <span>Saaras v3</span>
              <span style={{ color: "rgba(249,115,22,0.45)" }}>·</span>
              <span>22 Languages</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight sm:text-6xl">
              Don&apos;t type,{" "}
              <span className="block">just <BolAnimation />.</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed" style={{ color: "#d4d4d8" }}>
              Voice-to-text AI for how India speaks. Talk naturally in any Indian language — get clean, professional text instantly.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/app"
                className="btn-shimmer inline-flex items-center gap-2.5 rounded-full bg-violet-600 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
                style={{ boxShadow: "0 4px 28px rgba(109,40,217,0.55)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                Start for free
              </Link>
              <span className="text-sm" style={{ color: "#a1a1aa" }}>No signup · Works in your browser</span>
            </div>

          </div>

          {/* Right: transformation demo */}
          <div className="flex flex-col gap-4">
            {/* You say */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a1a1aa" }}>You say</span>
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#d4d4d8" }}>Hinglish</span>
              </div>
              <p className="text-base italic leading-relaxed text-white">&ldquo;yaar Rahul ko bol dena ki aaj meeting 3 baje hai, confirm karo&rdquo;</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Bolkar outputs */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "rgba(124,58,237,0.14)", border: "1px solid rgba(139,92,246,0.4)", backdropFilter: "blur(8px)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "#7c3aed" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#c4b5fd" }}>Bolkar outputs</span>
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>Professional English</span>
              </div>
              <p className="text-base font-medium leading-relaxed text-white">&ldquo;Please let Rahul know that today&apos;s meeting is at 3 PM. Please confirm.&rdquo;</p>
            </div>
          </div>
        </div>

        {/* Language chips — full width below */}
        <LanguageChips />
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-white">22</p>
              <p className="mt-2 text-base" style={{ color: "#d4d4d8" }}>Indian languages</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white">4×</p>
              <p className="mt-2 text-base" style={{ color: "#d4d4d8" }}>Faster than typing</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white">0</p>
              <p className="mt-2 text-base" style={{ color: "#d4d4d8" }}>Signup required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section
        className="relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(0,0,0,0.25)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
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
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to stop typing?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg" style={{ color: "#d4d4d8" }}>
            Open the app, pick your mode, and just speak. Your text is ready in seconds.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-3 rounded-full bg-violet-600 px-12 py-5 text-xl font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
              style={{ boxShadow: "0 8px 36px rgba(109,40,217,0.6)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Open Bolkar
            </Link>
            <p className="text-base" style={{ color: "#a1a1aa" }}>Install as PWA · No account needed</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <span className="text-base font-bold tracking-tight text-white">
            bol<span style={{ color: "#c4b5fd" }}>kar</span>
          </span>

          <div className="flex items-center gap-1.5 text-sm" style={{ color: "#a1a1aa" }}>
            <span>🇮🇳</span>
            <span>Made in India</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "#a1a1aa" }}>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://assets.sarvam.ai/assets/svgs/sarvam-logo-white.svg"
              alt="Sarvam AI"
              style={{ height: 20, opacity: 0.75 }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
