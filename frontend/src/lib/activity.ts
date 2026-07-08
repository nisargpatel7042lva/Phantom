export type ActivityType = "Shield" | "Transfer" | "Reveal";
export type ActivityStatus = "Confirmed" | "Pending";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  // null => amount intentionally hidden (private transfers never reveal it)
  amount: string | null;
  status: ActivityStatus;
  timestamp: number;
  txHash: string;
}

function storageKey(address: string): string {
  return `phantom:activity:${address.toLowerCase()}`;
}

export function loadActivity(address: string): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityItem[]) : [];
  } catch {
    return [];
  }
}

function saveActivity(address: string, items: ActivityItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(address), JSON.stringify(items));
}

export function addActivity(
  address: string,
  item: Omit<ActivityItem, "id" | "timestamp">,
): ActivityItem[] {
  const items = loadActivity(address);
  const newItem: ActivityItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const updated = [newItem, ...items].slice(0, 50);
  saveActivity(address, updated);
  return updated;
}

export function timeAgo(timestamp: number): string {
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}
