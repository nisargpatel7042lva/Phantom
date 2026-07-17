import Link from "next/link";
import { ExternalLink } from "lucide-react";

const EXPLORER = "https://testnet.snowtrace.io/address";

const CONTRACTS = [
  {
    label: "EncryptedERC",
    address: process.env.NEXT_PUBLIC_EERC_ADDRESS,
  },
  {
    label: "Registrar",
    address: process.env.NEXT_PUBLIC_REGISTRAR_ADDRESS,
  },
  {
    label: "USDC (Fuji)",
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS,
  },
];

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function Footer() {
  return (
    <footer className="border-t border-phantom-border">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <p className="text-lg font-semibold text-phantom-accent">
              <span aria-hidden="true">◈</span> PHANTOM
            </p>
            <p className="mt-3 text-sm leading-relaxed text-phantom-text-muted">
              A private trading shield for Avalanche. Amounts encrypted
              on-chain with eERC and zero-knowledge proofs.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-phantom-text-muted">
                Product
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/app"
                    className="text-phantom-text transition-colors hover:text-phantom-accent"
                  >
                    Launch App
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="text-phantom-text transition-colors hover:text-phantom-accent"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="text-phantom-text transition-colors hover:text-phantom-accent"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-phantom-text-muted">
                Contracts · Fuji
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {CONTRACTS.filter(
                  (c): c is { label: string; address: string } => !!c.address,
                ).map((c) => (
                  <li key={c.label}>
                    <a
                      href={`${EXPLORER}/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-phantom-text transition-colors hover:text-phantom-accent"
                    >
                      {c.label}: {shorten(c.address)}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-phantom-border pt-6 text-xs text-phantom-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Built on Avalanche Fuji testnet — not audited, testnet funds only.</p>
          <p>eERC encrypted token standard by Ava Labs.</p>
        </div>
      </div>
    </footer>
  );
}
