"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletContext } from "@/providers/Providers";
import { useEERC } from "@/hooks/useEERC";
import { StatusBar } from "@/components/dashboard/StatusBar";
import { BalancePanel } from "@/components/dashboard/BalancePanel";
import { ActionsPanel, type ActionTab } from "@/components/dashboard/ActionsPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TransactionToast, type ToastState } from "@/components/dashboard/TransactionToast";
import { type ActivityItem, addActivity, loadActivity } from "@/lib/activity";

export default function Home() {
  const { account, signer, isConnected, isCorrectNetwork, switchToFuji } =
    useWalletContext();
  const {
    isRegistered,
    privateBalance,
    publicBalance,
    registerUser,
    getPrivateBalance,
    getPublicBalance,
    deposit,
    privateTransfer,
    withdraw,
    checkIfRegistered,
  } = useEERC();

  const [activeTab, setActiveTab] = useState<ActionTab>("shield");
  const [toast, setToast] = useState<ToastState>({ status: "idle" });
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const showPending = useCallback(
    (message: string) => setToast({ status: "pending", message }),
    [],
  );
  const showSuccess = useCallback((txHash: string) => {
    setToast({ status: "success", txHash });
    window.setTimeout(() => setToast({ status: "idle" }), 5000);
  }, []);
  const showError = useCallback(
    (message: string) => setToast({ status: "error", message }),
    [],
  );
  const dismissToast = useCallback(() => setToast({ status: "idle" }), []);

  const recordActivity = useCallback(
    (item: Omit<ActivityItem, "id" | "timestamp">) => {
      if (!account) return;
      setActivity(addActivity(account, item));
    },
    [account],
  );

  // Load this wallet's activity log from localStorage whenever it changes.
  useEffect(() => {
    setActivity(account ? loadActivity(account) : []);
  }, [account]);

  // Sync registration status for returning users (not just right after
  // clicking "Activate PHANTOM").
  useEffect(() => {
    if (account && isCorrectNetwork) {
      void checkIfRegistered(account);
    }
  }, [account, isCorrectNetwork, checkIfRegistered]);

  // Public balance doesn't require registration; private balance does (it
  // needs a decryption key, which would otherwise prompt an unwanted
  // signature for brand new users).
  useEffect(() => {
    if (signer && isCorrectNetwork) {
      void getPublicBalance(signer);
    }
  }, [signer, isCorrectNetwork, getPublicBalance]);

  useEffect(() => {
    if (signer && isCorrectNetwork && isRegistered) {
      void getPrivateBalance(signer);
    }
  }, [signer, isCorrectNetwork, isRegistered, getPrivateBalance]);

  const locked = !isConnected || !isCorrectNetwork;

  return (
    <div className="mx-auto max-w-6xl px-6 py-28">
      <StatusBar />

      <div className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BalancePanel
            isRegistered={isRegistered}
            privateBalance={privateBalance}
            publicBalance={publicBalance}
            signer={signer}
            registerUser={registerUser}
            onDepositClick={() => setActiveTab("shield")}
          />
        </div>

        <div className="lg:col-span-3">
          <ActionsPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isRegistered={isRegistered}
            publicBalance={publicBalance}
            privateBalance={privateBalance}
            signer={signer}
            deposit={deposit}
            privateTransfer={privateTransfer}
            withdraw={withdraw}
            onPending={showPending}
            onSuccess={showSuccess}
            onError={showError}
            onActivity={recordActivity}
          />
        </div>

        <div className="lg:col-span-5">
          <ActivityFeed items={activity} />
        </div>

        {locked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-phantom-bg/70 backdrop-blur-sm">
            <div className="phantom-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
              {!isConnected ? (
                <p className="text-sm text-phantom-text">
                  Connect wallet to activate PHANTOM
                </p>
              ) : (
                <>
                  <p className="text-sm text-phantom-text">
                    You&apos;re connected to the wrong network.
                  </p>
                  <button
                    type="button"
                    onClick={switchToFuji}
                    className="rounded-full bg-[#00D4FF] px-6 py-2.5 text-sm font-semibold text-[#080B14] transition-opacity hover:opacity-90"
                  >
                    Switch to Avalanche Fuji
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <TransactionToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
