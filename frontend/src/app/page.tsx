"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Eye,
  EyeOff,
  FileSearch,
  KeyRound,
  Shield,
  ShieldCheck,
  Unlock,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { LogoMark } from "@/components/Logo";

// Single source of truth for scroll-triggered entrance animation. Each
// section fades/slides up once when it enters the viewport.
function useReveal() {
  const prefersReducedMotion = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };
  return variants;
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-phantom-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-phantom-text sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-phantom-text-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Hero() {
  const reveal = useReveal();
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-44">
      {/* Ambient glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,212,255,0.25) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mx-auto max-w-3xl text-center"
        >
          <LogoMark className="mx-auto h-14 w-14 drop-shadow-[0_0_24px_rgba(0,212,255,0.5)]" />

          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-phantom-border bg-phantom-accent-dim px-4 py-1.5 text-xs font-medium text-phantom-accent">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Live on Avalanche Fuji · Powered by eERC encrypted tokens
          </span>

          <h1 className="text-glow mt-8 text-5xl font-bold leading-[1.05] tracking-tight text-phantom-text sm:text-7xl">
            Trade in
            <span className="text-phantom-accent"> silence</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-phantom-text-muted">
            PHANTOM wraps your USDC into encrypted tokens on Avalanche. Send
            any amount to anyone — the blockchain confirms your transfer
            happened, but the amount stays cryptographically hidden from
            everyone else.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/app"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#00D4FF] px-8 py-3.5 text-sm font-semibold text-[#080B14] transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_32px_rgba(0,212,255,0.4)] active:scale-95"
            >
              Launch App
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-phantom-border px-8 py-3.5 text-sm font-medium text-phantom-text transition-colors duration-200 hover:border-phantom-accent/50 hover:text-phantom-accent"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        {/* Mock explorer log — the product's core claim, visualized */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={reveal}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="phantom-card rounded-2xl p-1">
            <div className="flex items-center gap-2 border-b border-phantom-border px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-phantom-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-phantom-success/60" />
              <span className="ml-3 font-mono text-xs text-phantom-text-muted">
                snowtrace.io — transaction logs
              </span>
            </div>
            <div className="overflow-x-auto p-5 font-mono text-xs leading-relaxed sm:text-sm">
              <p className="text-phantom-text-muted">
                <span className="text-phantom-success">✓</span> Status:{" "}
                <span className="text-phantom-text">Success</span>
              </p>
              <p className="mt-2 text-phantom-text-muted">
                Event:{" "}
                <span className="text-phantom-accent">PrivateTransfer</span>
              </p>
              <p className="mt-1 text-phantom-text-muted">
                from: <span className="text-phantom-text">0x637A…08b7</span>
              </p>
              <p className="text-phantom-text-muted">
                to: <span className="text-phantom-text">0xa168…41F9</span>
              </p>
              <p className="mt-1 text-phantom-text-muted">
                amount:{" "}
                <span className="rounded bg-phantom-accent-dim px-1.5 py-0.5 text-phantom-accent">
                  ◈ encrypted — 7 × uint256 ciphertext
                </span>
              </p>
              <p className="mt-3 break-all text-phantom-text-muted/60">
                1842…9917, 7302…4415, 9986…1024, 5521…8890, …
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs italic text-phantom-text-muted">
            A real PHANTOM transfer on the public explorer — there is no
            amount field to find.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Problem() {
  const reveal = useReveal();
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-6 pt-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
      >
        <SectionHeading
          eyebrow="The problem"
          title="Every transfer you make is public"
          subtitle="On a normal blockchain, anyone — competitors, bots, strangers — can see exactly how much you hold and how much you send. Your entire financial history is one address lookup away."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="phantom-card rounded-2xl p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-phantom-danger/10">
                <Eye className="h-5 w-5 text-phantom-danger" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-phantom-text">
                Standard ERC-20 transfer
              </h3>
            </div>
            <p className="mt-4 font-mono text-sm text-phantom-text-muted">
              Transfer(0x637A…08b7 → 0xa168…41F9,{" "}
              <span className="text-phantom-danger">2,000,000 USDC</span>)
            </p>
            <p className="mt-4 text-sm leading-relaxed text-phantom-text-muted">
              The amount is plaintext, forever, for everyone. Front-runners
              trade against you. Counterparties learn your position size.
            </p>
          </div>

          <div className="phantom-card cyan-glow rounded-2xl p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-phantom-accent-dim">
                <EyeOff className="h-5 w-5 text-phantom-accent" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-phantom-text">
                PHANTOM private transfer
              </h3>
            </div>
            <p className="mt-4 font-mono text-sm text-phantom-text-muted">
              PrivateTransfer(0x637A…08b7 → 0xa168…41F9,{" "}
              <span className="text-phantom-accent">◈ ciphertext</span>)
            </p>
            <p className="mt-4 text-sm leading-relaxed text-phantom-text-muted">
              The amount is encrypted with ElGamal over BabyJubJub and proven
              valid with a zero-knowledge proof. Only you, the recipient, and
              a designated auditor can ever decrypt it.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

const STEPS = [
  {
    icon: Shield,
    step: "01",
    title: "Shield",
    body: "Deposit USDC into the PHANTOM vault. It locks your public tokens and mints an equal encrypted balance of eUSDC that only your keys can read.",
  },
  {
    icon: EyeOff,
    step: "02",
    title: "Transfer",
    body: "Send eUSDC to any registered address. Your browser generates a zk-SNARK proving the transfer is valid — without ever revealing the amount on-chain.",
  },
  {
    icon: Unlock,
    step: "03",
    title: "Reveal",
    body: "Unwrap back to public USDC whenever you want. You stay in control: privacy while you trade, liquidity when you need it.",
  },
];

function HowItWorks() {
  const reveal = useReveal();
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-28 px-6 pt-32"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
      >
        <SectionHeading
          eyebrow="How it works"
          title="Three steps. Full privacy."
          subtitle="PHANTOM sits on top of eERC — Avalanche's encrypted token standard — and handles all the cryptography for you."
        />
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={reveal}
            transition={{ delay: i * 0.1 }}
            className="phantom-card group rounded-2xl p-8 transition-shadow duration-300 hover:shadow-[0_0_32px_rgba(0,212,255,0.15)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-phantom-accent-dim transition-transform duration-300 group-hover:scale-110">
                <s.icon className="h-6 w-6 text-phantom-accent" aria-hidden="true" />
              </span>
              <span className="font-mono text-sm text-phantom-text-muted/50">
                {s.step}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-phantom-text">
              {s.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-phantom-text-muted">
              {s.body}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
        className="mt-10 text-center"
      >
        <Link
          href="/app"
          className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-phantom-accent transition-opacity hover:opacity-80"
        >
          Try it on Fuji testnet
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </motion.div>
    </section>
  );
}

const TECH = [
  {
    icon: Cpu,
    title: "zk-SNARKs, in your browser",
    body: "Groth16 proofs are generated client-side with snarkjs. Your secrets never leave your machine — the chain only sees a proof that the math checks out.",
  },
  {
    icon: KeyRound,
    title: "Keys derived from your wallet",
    body: "Your encryption keys are derived deterministically from a wallet signature. No seed phrases to back up, no new accounts to manage.",
  },
  {
    icon: FileSearch,
    title: "Auditable by design",
    body: "Every transfer includes a ciphertext only a designated auditor can decrypt. Privacy from the public — not from compliance. PHANTOM is not a mixer.",
  },
  {
    icon: ShieldCheck,
    title: "Built on eERC by Ava Labs",
    body: "The encryption layer is Avalanche's official eERC converter standard: ElGamal + Poseidon encryption over the BabyJubJub curve, unmodified.",
  },
];

function Technology() {
  const reveal = useReveal();
  return (
    <section id="technology" className="mx-auto max-w-6xl scroll-mt-28 px-6 pt-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
      >
        <SectionHeading
          eyebrow="Under the hood"
          title="Real cryptography, no hand-waving"
          subtitle="PHANTOM was verified end-to-end on Fuji: deposits, private transfers, and withdrawals — with the encrypted amounts confirmed unreadable on the public explorer."
        />
      </motion.div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {TECH.map((t, i) => (
          <motion.div
            key={t.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={reveal}
            transition={{ delay: (i % 2) * 0.1 }}
            className="phantom-card rounded-2xl p-8"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-phantom-accent-dim">
              <t.icon className="h-5 w-5 text-phantom-accent" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-phantom-text">
              {t.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-phantom-text-muted">
              {t.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "What exactly is hidden?",
    a: "The amounts — of your balance and of every private transfer. Sender and recipient addresses remain visible on-chain, which is what makes PHANTOM confidential rather than anonymous. It hides how much, not who.",
  },
  {
    q: "Who can see my balance?",
    a: "Only you (with keys derived from your wallet signature), anyone you transfer to (for the amount they receive), and a designated auditor. Nobody else — not even the PHANTOM contract itself — can decrypt the numbers.",
  },
  {
    q: "Is this a mixer or tumbler?",
    a: "No. Mixers hide who paid whom and are frequently sanctioned. PHANTOM keeps participants visible and gives a designated auditor cryptographic access to amounts, making it compatible with compliance requirements.",
  },
  {
    q: "What do I need to use it?",
    a: "A wallet like MetaMask connected to Avalanche Fuji testnet (chain ID 43113), some testnet AVAX for gas, and testnet USDC. Register once to generate your encryption keys, then shield, transfer, and reveal freely.",
  },
  {
    q: "Can I get my USDC back?",
    a: "Always. Your encrypted eUSDC is backed 1:1 by USDC locked in the vault contract. The Reveal action burns eUSDC with a zk proof and returns plain USDC to your wallet.",
  },
];

function FAQ() {
  const reveal = useReveal();
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-28 px-6 pt-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
      >
        <SectionHeading eyebrow="FAQ" title="Questions, answered honestly" />

        <div className="mt-12 space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="phantom-card group cursor-pointer rounded-2xl p-6 open:pb-6"
            >
              <summary className="flex list-none items-center justify-between gap-4 text-left font-medium text-phantom-text [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="text-phantom-accent transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-phantom-text-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FinalCTA() {
  const reveal = useReveal();
  return (
    <section className="mx-auto max-w-6xl px-6 pb-32 pt-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reveal}
        className="phantom-card cyan-glow relative overflow-hidden rounded-3xl p-12 text-center sm:p-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 120%, rgba(0,212,255,0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <LogoMark className="mx-auto h-12 w-12 drop-shadow-[0_0_20px_rgba(0,212,255,0.45)]" />
          <h2 className="mt-6 text-3xl font-bold text-phantom-text sm:text-4xl">
            Your balance. Nobody&apos;s business.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-phantom-text-muted">
            Connect a wallet on Avalanche Fuji and make your first private
            transfer in under a minute.
          </p>
          <Link
            href="/app"
            className="group mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#00D4FF] px-8 py-3.5 text-sm font-semibold text-[#080B14] transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_32px_rgba(0,212,255,0.4)] active:scale-95"
          >
            Launch App
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Technology />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
