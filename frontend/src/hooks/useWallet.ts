"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

const FUJI_CHAIN_ID = 43113;
const FUJI_CHAIN_ID_HEX = "0xa869";
const FUJI_RPC_URL =
  process.env.NEXT_PUBLIC_FUJI_RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

const FUJI_CHAIN_PARAMS = {
  chainId: FUJI_CHAIN_ID_HEX,
  chainName: "Avalanche Fuji C-Chain",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: [FUJI_RPC_URL],
  blockExplorerUrls: ["https://testnet.snowtrace.io/"],
};

const LAST_CONNECTED_KEY = "phantom:wallet:lastConnected";

interface UseWalletState {
  account: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

function describeError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (code === 4001) return "Connection request was rejected.";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function useWallet() {
  const [state, setState] = useState<UseWalletState>({
    account: null,
    signer: null,
    provider: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const listenersAttached = useRef(false);

  const syncFromProvider = useCallback(
    async (browserProvider: ethers.BrowserProvider) => {
      const network = await browserProvider.getNetwork();
      const accounts = await browserProvider.listAccounts();

      if (accounts.length === 0) {
        setState((s) => ({
          ...s,
          account: null,
          signer: null,
          provider: browserProvider,
          chainId: Number(network.chainId),
          isConnected: false,
        }));
        return;
      }

      const signer = await browserProvider.getSigner();
      const account = await signer.getAddress();

      setState((s) => ({
        ...s,
        account,
        signer,
        provider: browserProvider,
        chainId: Number(network.chainId),
        isConnected: true,
        error: null,
      }));
    },
    [],
  );

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((s) => ({
        ...s,
        error: "No injected wallet found. Please install a wallet like MetaMask.",
      }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await syncFromProvider(browserProvider);
      window.localStorage.setItem(LAST_CONNECTED_KEY, "true");
    } catch (err) {
      setState((s) => ({ ...s, error: describeError(err, "Failed to connect wallet.") }));
    } finally {
      setState((s) => ({ ...s, isConnecting: false }));
    }
  }, [syncFromProvider]);

  const disconnectWallet = useCallback(() => {
    setState({
      account: null,
      signer: null,
      provider: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_CONNECTED_KEY);
    }
  }, []);

  const switchToFuji = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((s) => ({ ...s, error: "No injected wallet found." }));
      return;
    }
    const ethereum = window.ethereum;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FUJI_CHAIN_ID_HEX }],
      });
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: unknown }).code
          : undefined;

      if (code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [FUJI_CHAIN_PARAMS],
          });
        } catch (addErr) {
          setState((s) => ({
            ...s,
            error: describeError(addErr, "Failed to add the Fuji network."),
          }));
          return;
        }
      } else {
        setState((s) => ({ ...s, error: describeError(err, "Failed to switch network.") }));
        return;
      }
    }

    const browserProvider = new ethers.BrowserProvider(ethereum);
    await syncFromProvider(browserProvider);
  }, [syncFromProvider]);

  // Auto-reconnect on page load if this site was previously connected and
  // the wallet still authorizes it (no popup — silent eth_accounts read).
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    if (window.localStorage.getItem(LAST_CONNECTED_KEY) !== "true") return;

    const ethereum = window.ethereum;
    (async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          await syncFromProvider(browserProvider);
        }
      } catch {
        // Best-effort — leave the wallet disconnected if this fails.
      }
    })();
  }, [syncFromProvider]);

  // Listen for account/network changes from the wallet.
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    if (listenersAttached.current) return;
    const ethereum = window.ethereum;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
        return;
      }
      const browserProvider = new ethers.BrowserProvider(ethereum);
      void syncFromProvider(browserProvider);
    };

    const handleChainChanged = () => {
      const browserProvider = new ethers.BrowserProvider(ethereum);
      void syncFromProvider(browserProvider);
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);
    listenersAttached.current = true;

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
      listenersAttached.current = false;
    };
  }, [syncFromProvider, disconnectWallet]);

  return {
    account: state.account,
    signer: state.signer,
    provider: state.provider,
    chainId: state.chainId,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    isCorrectNetwork: state.chainId === FUJI_CHAIN_ID,
    error: state.error,
    connectWallet,
    switchToFuji,
    disconnectWallet,
  };
}
