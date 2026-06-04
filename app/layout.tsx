import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Stitch redesign uses Geist for a premium, technical fintech feel.
// Loaded by next/font so it self-hosts and avoids FOUT.
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
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
    { media: "(prefers-color-scheme: dark)", color: "#141317" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
