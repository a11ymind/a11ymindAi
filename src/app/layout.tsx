import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "Accessly — Know your accessibility risk before a lawsuit does",
  description:
    "AI-powered ADA/WCAG accessibility compliance scanning for small businesses and developers. Scan any URL in seconds.",
  openGraph: {
    title: "Accessly",
    description: "Know your accessibility risk before a lawsuit does.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
