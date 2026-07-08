"use client";

import { useEffect, useState } from "react";
import { useWalletContext } from "@/providers/Providers";
import { cn } from "@/lib/utils";

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { account, isConnected, isConnecting, connectWallet } =
    useWalletContext();

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
        <span className="font-sans text-lg font-semibold text-phantom-accent">
          <span aria-hidden="true">◈</span> PHANTOM
        </span>

        {isConnected && account ? (
          <div className="phantom-card flex items-center gap-2 rounded-full px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-phantom-success" />
            <span className="font-mono text-sm text-phantom-text">
              {formatAddress(account)}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={connectWallet}
            disabled={isConnecting}
            className="phantom-card rounded-full border border-phantom-accent/50 px-5 py-2 text-sm font-medium text-phantom-accent transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
