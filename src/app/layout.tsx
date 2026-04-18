import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

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
  title: "a11ymind AI — Know your accessibility risk before a lawsuit does",
  description:
    "AI-powered ADA/WCAG 2.1 AA accessibility compliance scanning for small businesses and developers. Scan any URL in seconds, get plain-English fixes.",
  openGraph: {
    title: "a11ymind AI",
    description: "Know your accessibility risk before a lawsuit does.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
