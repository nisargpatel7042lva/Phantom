import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/Providers";
import { Navbar } from "@/components/Navbar";
import { CyanGrid } from "@/components/CyanGrid";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: {
    default: "PHANTOM — Private Trading Shield for Avalanche",
    template: "%s · PHANTOM",
  },
  description:
    "Deposit USDC, wrap it into eERC encrypted tokens, and trade privately on Avalanche. Your trades become invisible on-chain.",
  openGraph: {
    title: "PHANTOM — Private Trading Shield for Avalanche",
    description:
      "Send any amount to anyone on Avalanche — the blockchain confirms it happened, but the amount stays cryptographically hidden.",
    type: "website",
    siteName: "PHANTOM",
  },
  twitter: {
    card: "summary",
    title: "PHANTOM — Private Trading Shield for Avalanche",
    description:
      "Amounts encrypted on-chain with eERC and zero-knowledge proofs.",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(spaceGrotesk.variable, spaceMono.variable, "font-sans")}
    >
      <body className="relative min-h-screen bg-phantom-bg text-phantom-text antialiased">
        <Providers>
          <CyanGrid />
          <Navbar />
          <main className="relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
