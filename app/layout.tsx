import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Space_Grotesk, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TopProgressBar } from "@/components/TopProgressBar";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: "Maison Kriss — Lagos Contemporary Clothing",
  description:
    "Members-only Nigerian contemporary design & streetwear studio. Heavyweight garments, editorial craft, and numbered releases.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark overflow-x-clip ${spaceGrotesk.variable} ${syne.variable} ${permanentMarker.variable}`}
    >
      <body className="min-h-screen overflow-x-clip bg-[#01121a] font-sans text-[#f8fafc] antialiased selection:bg-[#ff660c] selection:text-[#01121a]">
        <TopProgressBar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
