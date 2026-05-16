import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the closest free pairing to Roboto Flex (M3's recommended typeface)
// and matches Groww's broader feel. Loaded by next/font so it self-hosts and
// avoids the FOUT.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HDFC Mutual Fund FAQ Assistant",
  description:
    "Facts-only Q&A for HDFC mutual fund schemes. Every answer cites one official source. No investment advice.",
};

// Match the M3 background color so the mobile address bar tints to the page.
// Background tones are warm-white in light / warm-near-black in dark to pair
// with the HDFC red primary (see app/globals.css).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1110" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
