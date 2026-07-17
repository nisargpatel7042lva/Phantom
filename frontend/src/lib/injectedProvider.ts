import type { EIP1193Provider } from "viem";

// EIP-6963 (Multi Injected Provider Discovery), shared by useWallet (ethers)
// and useEERC (viem). When more than one wallet extension is installed, each
// announces itself instead of racing to clobber `window.ethereum` — without
// this, whichever extension wins that race becomes the app's provider. That
// is a real problem for an app named PHANTOM: the actual Phantom wallet
// extension (Solana-first, EVM support opt-in) commonly wins the race over
// MetaMask, and if its EVM account isn't enabled, requests fail with a
// wallet-specific "no account" error even though MetaMask has accounts ready.
//
// CRITICAL: every code path that talks to the wallet must resolve its
// provider through this module. Using raw `window.ethereum` anywhere
// reintroduces the race for that path only (e.g. approve succeeding via
// MetaMask while deposit fails via the Phantom stub).

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

let cachedProvider: EIP1193Provider | undefined;
let discovery: Promise<EIP1193Provider | undefined> | null = null;

export function resolveInjectedProvider(): Promise<EIP1193Provider | undefined> {
  if (cachedProvider) return Promise.resolve(cachedProvider);
  if (!discovery) {
    discovery = (async () => {
      const announced = await discoverAnnouncedProviders();
      const provider =
        announced.length === 0
          ? // No EIP-6963-compliant wallet announced itself — fall back to
            // whichever extension claimed the legacy `window.ethereum` global.
            typeof window !== "undefined"
            ? window.ethereum
            : undefined
          : (
              announced.find((p) => p.info.rdns === PREFERRED_WALLET_RDNS) ??
              announced[0]
            ).provider;
      cachedProvider = provider;
      return provider;
    })();
  }
  return discovery;
}
