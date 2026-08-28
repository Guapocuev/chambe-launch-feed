import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { MobileStickyCta } from "@/components/MobileStickyCta";
import { Nav } from "@/components/Nav";
import { SiteMain } from "@/components/SiteMain";
import { rootMetadata } from "@/lib/metadata";
import { GA_MEASUREMENT_ID } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-CA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="stylesheet" href="/leaflet.css" />
        {GA_MEASUREMENT_ID && (
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <JsonLd />
        <Nav />
        <SiteMain>{children}</SiteMain>
        <Footer />
        <MobileStickyCta />
        <Analytics />
      </body>
    </html>
  );
}
