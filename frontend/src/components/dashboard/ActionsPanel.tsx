"use client";

import { useState } from "react";
import type { ethers } from "ethers";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/activity";

export type ActionTab = "shield" | "transfer" | "reveal";
type ActionPhase = "idle" | "loading" | "success";

interface ActionsPanelProps {
  activeTab: ActionTab;
  setActiveTab: (tab: ActionTab) => void;
  isRegistered: boolean;
  publicBalance: string;
  privateBalance: string;
  signer: ethers.JsonRpcSigner | null;
  deposit: (amount: string, signer: ethers.JsonRpcSigner) => Promise<string>;
  privateTransfer: (
    toAddress: string,
    amount: string,
    signer: ethers.JsonRpcSigner,
  ) => Promise<string>;
  withdraw: (amount: string, signer: ethers.JsonRpcSigner) => Promise<string>;
  onPending: (message: string) => void;
  onSuccess: (txHash: string) => void;
  onError: (message: string) => void;
  onActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => void;
}

const TABS: { key: ActionTab; label: string }[] = [
  { key: "shield", label: "Shield" },
  { key: "transfer", label: "Transfer" },
  { key: "reveal", label: "Reveal" },
];

function describeCaughtError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

export function ActionsPanel({
  activeTab,
  setActiveTab,
  isRegistered,
  publicBalance,
  privateBalance,
  signer,
  deposit,
  privateTransfer,
  withdraw,
  onPending,
  onSuccess,
  onError,
  onActivity,
}: ActionsPanelProps) {
  const [shieldAmount, setShieldAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [revealAmount, setRevealAmount] = useState("");
  const [phase, setPhase] = useState<ActionPhase>("idle");

  const runAction = async (fn: () => Promise<string>, type: ActivityItem["type"], amount: string | null) => {
    setPhase("loading");
    onPending("Generating zk proof...");
    try {
      const txHash = await fn();
      onActivity({ type, amount, status: "Confirmed", txHash });
      onSuccess(txHash);
      setPhase("success");
      setTimeout(() => setPhase("idle"), 2000);
    } catch (err) {
      onError(describeCaughtError(err));
      setPhase("idle");
    }
  };

  const handleShield = () => {
    if (!signer || phase === "loading") return;
    void runAction(
      async () => {
        const hash = await deposit(shieldAmount, signer);
        setShieldAmount("");
        return hash;
      },
      "Shield",
      shieldAmount,
    );
  };

  const handleTransfer = () => {
    if (!signer || phase === "loading") return;
    void runAction(
      async () => {
        const hash = await privateTransfer(transferRecipient, transferAmount, signer);
        setTransferRecipient("");
        setTransferAmount("");
        return hash;
      },
      "Transfer",
      null,
    );
  };

  const handleReveal = () => {
    if (!signer || phase === "loading") return;
    void runAction(
      async () => {
        const hash = await withdraw(revealAmount, signer);
        setRevealAmount("");
        return hash;
      },
      "Reveal",
      revealAmount,
    );
  };

  return (
    <section className="phantom-card rounded-2xl p-6">
      <div className="flex gap-6 border-b border-phantom-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-phantom-accent text-phantom-accent"
                : "border-transparent text-phantom-text-muted hover:text-phantom-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "shield" && (
        <div className="pt-4">
          <p className="mb-4 text-xs text-phantom-text-muted">
            Convert public USDC to private eUSDC
          </p>

          <div className="phantom-card flex items-center rounded-xl px-4 py-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={shieldAmount}
              onChange={(e) => setShieldAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-none bg-transparent font-mono text-2xl text-[#00D4FF] outline-none"
            />
            <button
              type="button"
              onClick={() => setShieldAmount(publicBalance || "0")}
              className="mr-2 text-xs font-semibold text-phantom-accent"
            >
              MAX
            </button>
            <span className="text-sm text-phantom-text-muted">USDC</span>
          </div>

          <p className="mt-3 text-xs text-phantom-text-muted">
            You will receive: {Number(shieldAmount || "0").toFixed(2)} eUSDC (private)
          </p>

          <button
            type="button"
            onClick={handleShield}
            disabled={!isRegistered || !signer || Number(shieldAmount || "0") <= 0 || phase === "loading"}
            className="mt-4 w-full rounded-xl bg-[#00D4FF] py-3.5 text-sm font-semibold text-[#080B14] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {phase === "loading"
              ? "Generating zk proof..."
              : phase === "success"
                ? "Funds shielded ✓"
                : "Shield Funds"}
          </button>
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="pt-4">
          <p className="mb-4 text-xs text-phantom-text-muted">
            Send private transfer — amount hidden on-chain
          </p>

          <input
            type="text"
            value={transferRecipient}
            onChange={(e) => setTransferRecipient(e.target.value)}
            placeholder="0x... recipient address"
            className="phantom-card w-full rounded-xl px-4 py-3 font-mono text-sm text-phantom-text outline-none placeholder:text-phantom-text-muted"
          />

          <div className="phantom-card mt-3 flex items-center rounded-xl px-4 py-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-none bg-transparent font-mono text-2xl text-[#00D4FF] outline-none"
            />
            <span className="text-sm text-phantom-text-muted">eUSDC</span>
          </div>

          <p className="mt-3 text-xs text-phantom-accent">
            Transfer amount: HIDDEN ◈ Zero-knowledge proof
          </p>

          <button
            type="button"
            onClick={handleTransfer}
            disabled={
              !isRegistered ||
              !signer ||
              !transferRecipient ||
              Number(transferAmount || "0") <= 0 ||
              phase === "loading"
            }
            className="mt-4 w-full rounded-xl bg-[#00D4FF] py-3.5 text-sm font-semibold text-[#080B14] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {phase === "loading"
              ? "Generating zk proof..."
              : phase === "success"
                ? "Transfer sent ✓"
                : "Send Privately"}
          </button>
        </div>
      )}

      {activeTab === "reveal" && (
        <div className="pt-4">
          <p className="mb-4 text-xs text-phantom-text-muted">
            Convert private eUSDC back to public USDC
          </p>

          <div className="phantom-card flex items-center rounded-xl px-4 py-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={revealAmount}
              onChange={(e) => setRevealAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-none bg-transparent font-mono text-2xl text-[#00D4FF] outline-none"
            />
            <button
              type="button"
              onClick={() => setRevealAmount(privateBalance || "0")}
              className="mr-2 text-xs font-semibold text-phantom-accent"
            >
              MAX
            </button>
            <span className="text-sm text-phantom-text-muted">eUSDC</span>
          </div>

          <div className="phantom-card mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
            <p className="text-xs text-orange-400">
              ⚠ This amount will become visible on-chain
            </p>
          </div>

          <button
            type="button"
            onClick={handleReveal}
            disabled={!isRegistered || !signer || Number(revealAmount || "0") <= 0 || phase === "loading"}
            className="mt-4 w-full rounded-xl border border-[#00D4FF] bg-transparent py-3.5 text-sm font-semibold text-phantom-accent transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {phase === "loading"
              ? "Generating zk proof..."
              : phase === "success"
                ? "Funds revealed ✓"
                : "Reveal Funds"}
          </button>
        </div>
      )}
    </section>
  );
}
