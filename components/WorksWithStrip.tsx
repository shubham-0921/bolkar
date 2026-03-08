"use client";

const APPS = [
  { name: "WhatsApp",  src: "/applogos/whatsapp.png"  },
  { name: "Instagram", src: "/applogos/instagram.png" },
  { name: "Telegram",  src: "/applogos/telegram.png"  },
  { name: "Gmail",     src: "/applogos/gmail.png"     },
  { name: "Chrome",    src: "/applogos/chrome.png"    },
  { name: "X",         src: "/applogos/x.png"         },
  { name: "LinkedIn",  src: "/applogos/linkedin.png"  },
  { name: "Slack",     src: "/applogos/slack.png"     },
  { name: "Maps",      src: "/applogos/maps.png"      },
  { name: "YouTube",   src: "/applogos/youtube.png"   },
];

export default function WorksWithStrip() {
  // Duplicate for seamless loop
  const doubled = [...APPS, ...APPS];

  return (
    <div style={{ marginTop: 40, marginBottom: 8 }}>
      <p
        className="mb-4 text-center text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#64748b" }}
      >
        Works inside every app
      </p>
      <div style={{ overflow: "hidden", position: "relative" }}>
        {/* Fade edges */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            background: "linear-gradient(to right, rgba(255,255,255,0.95) 0%, transparent 12%, transparent 88%, rgba(255,255,255,0.95) 100%)",
          }}
        />
        <div
          className="animate-marquee"
          style={{ display: "flex", gap: 0, width: "max-content" }}
        >
          {doubled.map((app, i) => (
            <div
              key={i}
              style={{ width: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.src}
                alt={app.name}
                width={44}
                height={44}
                style={{ borderRadius: 10, objectFit: "contain" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
