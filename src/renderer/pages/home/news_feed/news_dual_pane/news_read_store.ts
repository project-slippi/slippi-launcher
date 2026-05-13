import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { combine } from "zustand/middleware";

// Only consider news that is published within this time frame to be considered "new"
const NEW_NEWS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds
const STORAGE_KEY = "news-read-status";

function loadReadStatus(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: Record<string, number> = JSON.parse(raw);

    // Prevent the read status object from growing indefinitely.
    // Ignore the entries which have been read before the cutoff date.
    // The new filtered object will be written to storage on next write.
    const cutoff = Date.now() - NEW_NEWS_THRESHOLD_MS;
    const filtered = Object.fromEntries(Object.entries(parsed).filter(([, ts]) => ts >= cutoff));
    return filtered;
  } catch {
    return {};
  }
}

function saveReadStatus(status: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch {
    // storage full or unavailable
  }
}

export const useNewsReadStore = create(
  combine(
    {
      readStatus: loadReadStatus(),
    },
    (set) => ({
      markAsRead: (id: string) => {
        const prev = useNewsReadStore.getState().readStatus;
        if (prev[id]) {
          return;
        }
        const next = { ...prev, [id]: Date.now() };
        saveReadStatus(next);
        set({ readStatus: next });
      },
    }),
  ),
);

export function isNewsUnread(item: { id: string; publishedAt: Date }, readStatus: Record<string, number>): boolean {
  const age = Date.now() - item.publishedAt.getTime();
  return age < NEW_NEWS_THRESHOLD_MS && !readStatus[item.id];
}

export function useHasUnreadNews(): boolean {
  const { data: allPosts = [] } = useQuery({
    queryKey: ["newsFeedQuery"],
    queryFn: window.electron.common.fetchNewsFeed,
    staleTime: 15 * 60 * 1000,
  });
  const readStatus = useNewsReadStore((s) => s.readStatus);
  return allPosts.some((post) => isNewsUnread(post, readStatus));
}
