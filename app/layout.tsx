import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SwRegistrar from "@/components/SwRegistrar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolkar — Bol. Type mat kar.",
  description:
    "India's voice-to-text app. Speak in any of 22 Indian languages, get clean text instantly. Powered by Sarvam AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bolkar",
  },
  openGraph: {
    title: "Bolkar — Bol. Type mat kar.",
    description:
      "Speak Hinglish. Write professional English. Voice-to-text for India, powered by Sarvam AI.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <SwRegistrar />
        {children}
      </body>
    </html>
  );
}
