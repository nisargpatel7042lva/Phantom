"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletContext } from "@/providers/Providers";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#technology", label: "Technology" },
  { href: "/#faq", label: "FAQ" },
];

function WalletControls() {
  const { account, isConnected, isConnecting, error, connectWallet } =
    useWalletContext();

  if (isConnected && account) {
    return (
      <div className="phantom-card flex items-center gap-2 rounded-full px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-phantom-success" />
        <span className="font-mono text-sm text-phantom-text">
          {formatAddress(account)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={connectWallet}
        disabled={isConnecting}
        className="phantom-card cursor-pointer rounded-full border border-phantom-accent/50 px-5 py-2 text-sm font-medium text-phantom-accent transition-all duration-150 hover:opacity-80 active:scale-95 disabled:cursor-default disabled:opacity-50 disabled:active:scale-100"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && (
        <span className="max-w-[240px] text-right text-xs text-phantom-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const onApp = pathname?.startsWith("/app") ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled && "phantom-card backdrop-blur-xl rounded-none border-x-0 border-t-0",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            aria-label="PHANTOM home"
            className="transition-opacity hover:opacity-80"
          >
            <Logo textClassName="text-lg" />
          </Link>

          {!onApp && (
            <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-phantom-text-muted transition-colors hover:text-phantom-text"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {onApp ? (
          <WalletControls />
        ) : (
          <Link
            href="/app"
            className="cursor-pointer rounded-full bg-[#00D4FF] px-5 py-2 text-sm font-semibold text-[#080B14] transition-all duration-150 hover:opacity-90 hover:shadow-[0_0_24px_rgba(0,212,255,0.35)] active:scale-95"
          >
            Launch App
          </Link>
        )}
      </div>
    </header>
  );
}
