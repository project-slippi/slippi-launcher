import { create } from "zustand";
import { combine } from "zustand/middleware";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "news-read-status";

function loadReadStatus(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
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

export function isNewsUnread(item: { id: string; publishedAt: string }, readStatus: Record<string, number>): boolean {
  const age = Date.now() - new Date(item.publishedAt).getTime();
  return age < MONTH_MS && !readStatus[item.id];
}
