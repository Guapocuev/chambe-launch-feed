import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { MobileStickyCta } from "@/components/MobileStickyCta";
import { Nav } from "@/components/Nav";
import { SiteMain } from "@/components/SiteMain";
import { htmlLang } from "@/i18n/pathname";
import { routing } from "@/i18n/routing";
import { localeAlternates } from "@/lib/format-cad";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  return {
    ...rootMetadata,
    title: {
      default: `${t("heroTitle")} ${t("heroAccent")}`,
      template: `%s | Chambé`,
    },
    description: t("heroBody"),
    openGraph: {
      ...rootMetadata.openGraph,
      locale: locale === "es" ? "es_CA" : locale === "pt" ? "pt_CA" : "en_CA",
      title: `${t("heroTitle")} ${t("heroAccent")}`,
      description: t("heroBody"),
    },
    alternates: {
      canonical: "/",
      languages: localeAlternates("/"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={htmlLang(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="stylesheet" href="/leaflet.css" />
        <script src="/locale-switch.js"></script>
        {GA_MEASUREMENT_ID && (
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <JsonLd />
          <Nav />
          <SiteMain>{children}</SiteMain>
          <Footer />
          <MobileStickyCta />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
