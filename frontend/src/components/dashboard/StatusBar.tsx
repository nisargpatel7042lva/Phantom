"use client";

import { useWalletContext } from "@/providers/Providers";
import { useSpotlight } from "@/lib/useSpotlight";
import { cn } from "@/lib/utils";

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function StatusBar() {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    isConnecting,
    connectWallet,
    disconnectWallet,
  } = useWalletContext();
  const spotlight = useSpotlight<HTMLElement>();

  const live = isConnected && isCorrectNetwork;
  const statusDotColor = !isConnected
    ? "bg-gray-500"
    : isCorrectNetwork
      ? "bg-phantom-success"
      : "bg-phantom-danger";

  const statusLabel = !isConnected
    ? "Not Connected"
    : isCorrectNetwork
      ? "Connected to Fuji"
      : "Wrong Network";

  return (
    <section
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      className="phantom-card spotlight rounded-2xl p-6"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-phantom-accent">
            <span aria-hidden="true">◈</span> PHANTOM
          </h1>
          <p className="mt-1 text-sm text-phantom-text-muted">
            Private Trading Shield on Avalanche
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              statusDotColor,
              live && "status-pulse",
            )}
          />
          <span className="text-sm text-phantom-text">{statusLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && account ? (
            <>
              <span className="font-mono text-sm text-phantom-text">
                {formatAddress(account)}
              </span>
              <button
                type="button"
                onClick={disconnectWallet}
                className="cursor-pointer text-xs text-phantom-text-muted underline-offset-2 transition-transform duration-150 hover:text-phantom-text hover:underline active:scale-95"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="phantom-card cursor-pointer rounded-full border border-phantom-accent/50 px-5 py-2 text-sm font-medium text-phantom-accent transition-all duration-150 hover:opacity-80 active:scale-95 disabled:cursor-default disabled:opacity-50 disabled:active:scale-100"
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
