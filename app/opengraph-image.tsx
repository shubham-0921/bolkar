import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a0835 0%, #08030f 60%)",
          padding: "60px",
          gap: "0px",
          position: "relative",
        }}
      >
        {/* Top purple glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            marginLeft: -500,
            width: 1000,
            height: 400,
            borderRadius: "50%",
            background: "rgba(139,92,246,0.35)",
            display: "flex",
          }}
        />

        {/* Orange badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(249,115,22,0.15)",
            border: "2px solid rgba(249,115,22,0.4)",
            borderRadius: "100px",
            padding: "10px 26px",
            marginBottom: "40px",
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: "#fb923c",
              fontWeight: 700,
              letterSpacing: "-0.3px",
            }}
          >
            🇮🇳  Made in India · Saaras v3 · 22 Languages
          </span>
        </div>

        {/* Logo + Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            marginBottom: "32px",
          }}
        >
          {/* BolkarLogo — solid gold (Satori doesn't support SVG gradient refs) */}
          <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
            {/* Outer ring */}
            <circle cx="50" cy="50" r="44" stroke="#e8c44e" strokeWidth="7.5" />
            {/* Waveform bars — symmetric, tallest centre */}
            <rect x="23" y="42" width="5.5" height="16" rx="2.75" fill="#e8c44e" />
            <rect x="31" y="37" width="5.5" height="26" rx="2.75" fill="#e8c44e" />
            <rect x="39" y="31" width="5.5" height="38" rx="2.75" fill="#e8c44e" />
            <rect x="47" y="37" width="5.5" height="26" rx="2.75" fill="#e8c44e" />
            <rect x="55" y="42" width="5.5" height="16" rx="2.75" fill="#e8c44e" />
            {/* Sound arcs */}
            <path d="M64,42 Q71,50 64,58" stroke="#e8c44e" strokeWidth="5" strokeLinecap="round" />
            <path d="M69,35 Q79.5,50 69,65" stroke="#e8c44e" strokeWidth="4.5" strokeLinecap="round" />
          </svg>

          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 110,
                fontWeight: 800,
                color: "white",
                lineHeight: 1,
                letterSpacing: "-4px",
              }}
            >
              bol
            </span>
            <span
              style={{
                fontSize: 110,
                fontWeight: 800,
                color: "#c4b5fd",
                lineHeight: 1,
                letterSpacing: "-4px",
              }}
            >
              kar
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 36,
            color: "#d4d4d8",
            margin: "0 0 16px",
            fontWeight: 500,
            letterSpacing: "-0.5px",
          }}
        >
          Voice-to-text for how India speaks.
        </p>

        {/* Sub-tagline */}
        <p
          style={{
            fontSize: 22,
            color: "#71717a",
            margin: 0,
            textAlign: "center",
          }}
        >
          Speak any Indian language · Get clean text instantly · No signup
          needed
        </p>
      </div>
    ),
    { ...size }
  );
}
