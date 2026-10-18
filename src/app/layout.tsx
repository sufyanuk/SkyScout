import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Cheap flights & unexpected destinations`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description },
  robots: { index: true, follow: true },
};

/**
 * Travelpayouts Drive, required by the Travelpayouts account set-up. It loads
 * Travelpayouts' script for partner 587189 (the public affiliate marker).
 * Set TRAVELPAYOUTS_DRIVE=off to remove it.
 */
const TRAVELPAYOUTS_DRIVE =
  process.env.TRAVELPAYOUTS_DRIVE === "off"
    ? null
    : `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.setAttribute("data-cmp-ab", "2");
  script.src = "https://tp-em.com/NTg3MTg5.js?t=587189";
  document.head.appendChild(script);
})();`;

export const viewport: Viewport = {
  themeColor: "#f7f8fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      {TRAVELPAYOUTS_DRIVE && (
        <head>
          <script data-cmp-ab="2" dangerouslySetInnerHTML={{ __html: TRAVELPAYOUTS_DRIVE }} />
        </head>
      )}
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
