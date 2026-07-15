"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import type { EIP1193Provider } from "viem";

// EIP-6963 (Multi Injected Provider Discovery). When more than one wallet
// extension is installed, each announces itself instead of racing to clobber
// `window.ethereum` — without this, whichever extension wins that race
// becomes the app's provider, which is a real problem for an app named
// PHANTOM: the actual Phantom wallet extension (Solana-first, EVM support
// opt-in) commonly wins the race over MetaMask, and if its EVM account
// isn't enabled, wallet_requestAccounts fails with a wallet-specific "no
// account" error even though MetaMask has accounts ready.
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

const PREFERRED_WALLET_RDNS = "io.metamask";

function discoverAnnouncedProviders(): Promise<EIP6963ProviderDetail[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve([]);
      return;
    }

    const found: EIP6963ProviderDetail[] = [];
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (detail && !found.some((p) => p.info.uuid === detail.info.uuid)) {
        found.push(detail);
      }
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Providers announce synchronously in response to the request event;
    // one macrotask is enough to let every listener run.
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(found);
    }, 50);
  });
}

async function resolvePreferredProvider(): Promise<EIP1193Provider | undefined> {
  const announced = await discoverAnnouncedProviders();
  if (announced.length === 0) {
    // No EIP-6963-compliant wallet announced itself — fall back to
    // whichever extension claimed the legacy `window.ethereum` global.
    return typeof window !== "undefined" ? window.ethereum : undefined;
  }
  const preferred = announced.find((p) => p.info.rdns === PREFERRED_WALLET_RDNS);
  return (preferred ?? announced[0]).provider;
}

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
  if (err && typeof err === "object") {
    const e = err as {
      code?: unknown;
      message?: unknown;
      info?: { error?: { code?: unknown; message?: unknown } };
    };
    // Raw EIP-1193 provider errors carry a numeric `code`. ethers v6's
    // BrowserProvider instead wraps rejections in its own error with
    // `code: "ACTION_REJECTED"` and nests the original provider error
    // under `info.error` — check both shapes.
    const inner = e.info?.error ?? e;
    const innerCode = inner.code;
    const innerMessage =
      typeof inner.message === "string" ? inner.message : undefined;

    if (e.code === "ACTION_REJECTED" || innerCode === 4001) {
      // Real wallets report a genuine user cancel as "User rejected the
      // request." Some wallet extensions reuse code 4001 for unrelated
      // conditions (e.g. no account configured) — surface that specific
      // reason instead of a misleading generic "rejected" message.
      if (innerMessage && !/user rejected/i.test(innerMessage)) {
        return innerMessage.replace(/^ethers-user-denied:\s*/i, "");
      }
      return "Connection request was rejected.";
    }
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

  // Cached once resolved so every call site (connect, switch network,
  // auto-reconnect, event listeners) talks to the same underlying
  // provider instance instead of re-racing EIP-6963 discovery each time.
  const providerRef = useRef<EIP1193Provider | undefined>(undefined);

  const getActiveProvider = useCallback(async (): Promise<
    EIP1193Provider | undefined
  > => {
    if (providerRef.current) return providerRef.current;
    const resolved = await resolvePreferredProvider();
    providerRef.current = resolved;
    return resolved;
  }, []);

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
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const ethereum = await getActiveProvider();
      if (!ethereum) {
        setState((s) => ({
          ...s,
          error: "No injected wallet found. Please install a wallet like MetaMask.",
        }));
        return;
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await syncFromProvider(browserProvider);
      window.localStorage.setItem(LAST_CONNECTED_KEY, "true");
    } catch (err) {
      setState((s) => ({ ...s, error: describeError(err, "Failed to connect wallet.") }));
    } finally {
      setState((s) => ({ ...s, isConnecting: false }));
    }
  }, [getActiveProvider, syncFromProvider]);

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
    const ethereum = await getActiveProvider();
    if (!ethereum) {
      setState((s) => ({ ...s, error: "No injected wallet found." }));
      return;
    }

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
  }, [getActiveProvider, syncFromProvider]);

  // Resolve the preferred provider once on mount, then (a) silently
  // auto-reconnect if this site was previously connected, and (b) attach
  // account/network change listeners — both against that same resolved
  // provider instance.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let attachedTo: EIP1193Provider | undefined;
    let handleAccountsChanged: ((...args: unknown[]) => void) | undefined;
    let handleChainChanged: (() => void) | undefined;

    (async () => {
      const ethereum = await getActiveProvider();
      if (!ethereum || cancelled) return;

      if (window.localStorage.getItem(LAST_CONNECTED_KEY) === "true") {
        try {
          const browserProvider = new ethers.BrowserProvider(ethereum);
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0 && !cancelled) {
            await syncFromProvider(browserProvider);
          }
        } catch {
          // Best-effort — leave the wallet disconnected if this fails.
        }
      }

      if (cancelled) return;

      handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (!accounts || accounts.length === 0) {
          disconnectWallet();
          return;
        }
        const browserProvider = new ethers.BrowserProvider(ethereum);
        void syncFromProvider(browserProvider);
      };

      handleChainChanged = () => {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        void syncFromProvider(browserProvider);
      };

      ethereum.on?.("accountsChanged", handleAccountsChanged);
      ethereum.on?.("chainChanged", handleChainChanged);
      attachedTo = ethereum;
    })();

    return () => {
      cancelled = true;
      if (attachedTo && handleAccountsChanged && handleChainChanged) {
        attachedTo.removeListener?.("accountsChanged", handleAccountsChanged);
        attachedTo.removeListener?.("chainChanged", handleChainChanged);
      }
    };
  }, [getActiveProvider, syncFromProvider, disconnectWallet]);

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
