import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "a11ymind — Know your accessibility risk before a lawsuit does",
  description:
    "AI-powered ADA/WCAG accessibility compliance scanning for small businesses and developers. Scan any URL in seconds.",
  openGraph: {
    title: "a11ymind",
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
