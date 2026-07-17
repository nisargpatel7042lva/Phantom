"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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
    error: eercError,
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

  // useEERC's actions (register, deposit, transfer, withdraw, balance
  // reads) all catch their own failures into this error state instead of
  // throwing past their own boundaries in every case — surface it here so
  // a failure is never silent (e.g. registerUser has no other error path
  // wired to the UI).
  useEffect(() => {
    if (eercError) {
      showError(eercError);
    }
  }, [eercError, showError]);

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
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08 },
    },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-6xl px-6 py-28"
    >
      <motion.div variants={itemVariants}>
        <StatusBar />
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <BalancePanel
            isRegistered={isRegistered}
            privateBalance={privateBalance}
            publicBalance={publicBalance}
            signer={signer}
            registerUser={registerUser}
            onDepositClick={() => setActiveTab("shield")}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3">
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
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-5">
          <ActivityFeed items={activity} />
        </motion.div>

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
                  <motion.button
                    type="button"
                    onClick={switchToFuji}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="cursor-pointer rounded-full bg-[#00D4FF] px-6 py-2.5 text-sm font-semibold text-[#080B14] transition-opacity hover:opacity-90"
                  >
                    Switch to Avalanche Fuji
                  </motion.button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <TransactionToast toast={toast} onDismiss={dismissToast} />
    </motion.div>
  );
}
