import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "a11ymind AI",
    template: "%s",
  },
  description:
    "Scan live pages, monitor the URLs you care about, generate AI accessibility fixes, and share reports teams can actually act on.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, monitor the URLs you care about, generate AI accessibility fixes, and share reports teams can actually act on.",
    type: "website",
    url: "/",
    siteName: "a11ymind AI",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "a11ymind AI social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "a11ymind AI – Accessibility monitoring, CI checks, and AI fixes",
    description:
      "Scan live pages, monitor the URLs you care about, generate AI accessibility fixes, and share reports teams can actually act on.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <SiteFooter />
      </body>
    </html>
  );
}
