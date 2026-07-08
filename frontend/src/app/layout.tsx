import type { Metadata } from "next";
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
  title: "PHANTOM — Private Trading Shield for Avalanche",
  description:
    "Deposit USDC, wrap it into eERC encrypted tokens, and trade privately on Avalanche. Your trades become invisible on-chain.",
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
