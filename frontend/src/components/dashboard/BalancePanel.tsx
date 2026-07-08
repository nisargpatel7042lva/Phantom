"use client";

import { useState } from "react";
import type { ethers } from "ethers";
import { CountUp } from "./CountUp";

interface BalancePanelProps {
  isRegistered: boolean;
  privateBalance: string;
  publicBalance: string;
  signer: ethers.JsonRpcSigner | null;
  registerUser: (signer: ethers.JsonRpcSigner) => Promise<boolean>;
  onDepositClick: () => void;
}

type RegisterPhase = "idle" | "loading" | "success";

export function BalancePanel({
  isRegistered,
  privateBalance,
  publicBalance,
  signer,
  registerUser,
  onDepositClick,
}: BalancePanelProps) {
  const [registerPhase, setRegisterPhase] = useState<RegisterPhase>("idle");

  const handleActivate = async () => {
    if (!signer || registerPhase === "loading") return;
    setRegisterPhase("loading");
    const ok = await registerUser(signer);
    setRegisterPhase(ok ? "success" : "idle");
  };

  const publicBalanceNumber = Number(publicBalance || "0");

  return (
    <section className="phantom-card cyan-glow rounded-2xl p-8">
      <p className="text-xs uppercase tracking-widest text-phantom-text-muted">
        Private Balance
      </p>

      <div className="amount-display mt-3">
        {isRegistered ? (
          <>
            <CountUp value={Number(privateBalance || "0")} />
            <span className="ml-2 text-2xl align-top">eUSDC</span>
          </>
        ) : (
          "?"
        )}
      </div>

      <p className="mt-3 text-xs italic text-phantom-text-muted">
        Encrypted on Avalanche · Hidden from all observers
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-phantom-border pt-4">
        <span className="text-xs text-phantom-text-muted">Public USDC</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-phantom-text">
            {publicBalanceNumber.toFixed(2)}
          </span>
          {publicBalanceNumber > 0 && (
            <button
              type="button"
              onClick={onDepositClick}
              className="text-xs text-phantom-accent hover:underline"
            >
              → Deposit to shield
            </button>
          )}
        </div>
      </div>

      {!isRegistered && (
        <div className="phantom-card mt-4 rounded-xl bg-phantom-accent-dim p-4">
          <p className="text-sm text-phantom-text">
            Register to activate privacy
          </p>
          <button
            type="button"
            onClick={handleActivate}
            disabled={!signer || registerPhase === "loading"}
            className="mt-3 rounded-full bg-[#00D4FF] px-6 py-2.5 text-sm font-semibold text-[#080B14] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {registerPhase === "loading"
              ? "Generating keys..."
              : registerPhase === "success"
                ? "Privacy Activated ✓"
                : "Activate PHANTOM"}
          </button>
        </div>
      )}
    </section>
  );
}
