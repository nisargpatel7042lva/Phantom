"use client";

import { motion } from "framer-motion";
import { type ActivityItem, timeAgo, truncateHash } from "@/lib/activity";
import { cn } from "@/lib/utils";
import { useSpotlight } from "@/lib/useSpotlight";

const TYPE_STYLES: Record<ActivityItem["type"], string> = {
  Shield: "bg-phantom-accent-dim text-phantom-accent",
  Transfer: "bg-purple-500/10 text-purple-400",
  Reveal: "bg-orange-500/10 text-orange-400",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const spotlight = useSpotlight<HTMLElement>();

  return (
    <section
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      className="phantom-card spotlight rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-phantom-text">Activity</h2>
        <span className="rounded-full bg-phantom-accent-dim px-3 py-1 text-xs text-phantom-accent">
          ◈ All amounts encrypted
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-phantom-text-muted">
          No activity yet. Shield your first USDC to begin.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-phantom-text-muted">
                <th className="pb-2 font-normal">Type</th>
                <th className="pb-2 font-normal">Amount</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Time</th>
                <th className="pb-2 font-normal">TX</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="border-t border-phantom-border"
                >
                  <td className="py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        TYPE_STYLES[item.type],
                      )}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-sm">
                    {item.amount === null ? (
                      <span className="text-phantom-accent">HIDDEN ◈</span>
                    ) : (
                      <span className="text-phantom-text">
                        {Number(item.amount).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.status === "Confirmed"
                          ? "text-phantom-success"
                          : "text-yellow-400",
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-phantom-text-muted">
                    {timeAgo(item.timestamp)}
                  </td>
                  <td className="py-3">
                    <a
                      href={`https://testnet.snowtrace.io/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-phantom-accent hover:underline"
                    >
                      {truncateHash(item.txHash)}
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
