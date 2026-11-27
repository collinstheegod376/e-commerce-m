import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TopProgressBar } from "@/components/TopProgressBar";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import "./globals.css";

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
    <html lang="en" className="dark overflow-x-clip">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-clip bg-[#01121a] font-sans text-[#f8fafc] antialiased selection:bg-[#ff660c] selection:text-[#01121a]">
        <TopProgressBar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
