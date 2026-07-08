"use client";

import { AnimatePresence, motion } from "framer-motion";
import { truncateHash } from "@/lib/activity";

export type ToastState =
  | { status: "idle" }
  | { status: "pending"; message: string }
  | { status: "success"; txHash: string }
  | { status: "error"; message: string };

export function TransactionToast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {toast.status !== "idle" && (
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="phantom-card min-w-[300px] rounded-2xl p-4"
          >
            {toast.status === "pending" && (
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-phantom-accent border-t-transparent" />
                <span className="text-sm text-phantom-accent">{toast.message}</span>
              </div>
            )}

            {toast.status === "success" && (
              <div className="flex items-start gap-3">
                <span className="text-phantom-accent">◈</span>
                <div>
                  <p className="text-sm text-phantom-text">Transaction confirmed</p>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${toast.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-mono text-xs text-phantom-accent hover:underline"
                  >
                    {truncateHash(toast.txHash)}
                  </a>
                </div>
              </div>
            )}

            {toast.status === "error" && (
              <div className="flex items-start gap-3">
                <span className="text-phantom-danger">✕</span>
                <div className="flex-1">
                  <p className="text-sm text-phantom-text">{toast.message}</p>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="mt-1 text-xs text-phantom-text-muted hover:text-phantom-text"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
