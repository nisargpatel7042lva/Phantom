"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";

type WalletContextValue = ReturnType<typeof useWallet>;

const WalletContext = createContext<WalletContextValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used within <Providers>.");
  }
  return ctx;
}
