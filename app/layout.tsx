import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SwRegistrar from "@/components/SwRegistrar";

const GA_ID = "G-FVBM65R4KJ";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolkar — Bol. Type mat kar.",
  description:
    "India's voice-to-text app. Speak in any of 22 Indian languages, get clean text instantly. Powered by Sarvam AI.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
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
    url: "https://bolkar.online",
    siteName: "Bolkar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolkar — Bol. Type mat kar.",
    description:
      "Voice-to-text for India. Speak any Indian language, get clean text instantly.",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
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
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
      <body className={`${geist.variable} antialiased`}>
        <SwRegistrar />
        {children}
      </body>
    </html>
  );
}
