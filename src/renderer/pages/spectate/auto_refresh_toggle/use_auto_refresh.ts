import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

const AUTO_REFRESH_INTERVAL_MS = 30_000;
const AUTO_DISABLE_MAX_DURATION_MS = 24 * 60 * 60 * 1_000; // Do we really need to extend more than 24 hours?
const AUTO_DISABLE_DURATION_MS = 3 * 60 * 60 * 1_000;
const EXTEND_DURATION_MS = 60 * 60 * 1_000;

let turnOffTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleTurnOff(expiresAt: number | null) {
  if (turnOffTimeout !== null) {
    clearTimeout(turnOffTimeout);
    turnOffTimeout = null;
  }
  if (expiresAt === null) {
    return;
  }

  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    autoRefreshStore.getState().setDisabled();
    return;
  }

  turnOffTimeout = setTimeout(() => {
    autoRefreshStore.getState().setDisabled();
    turnOffTimeout = null;
  }, remaining);
}

const autoRefreshStore = create(
  combine({ expiresAt: null as number | null }, (set) => ({
    setDisabled: () => set({ expiresAt: null }),
    toggle: () =>
      set((state) => {
        if (state.expiresAt !== null) {
          scheduleTurnOff(null);
          return { expiresAt: null };
        }
        const ts = Date.now() + AUTO_DISABLE_DURATION_MS;
        scheduleTurnOff(ts);
        return { enabled: true, expiresAt: ts };
      }),
    extend: () =>
      set((state) => {
        if (state.expiresAt === null) {
          return {};
        }
        const newTs = Math.min(state.expiresAt + EXTEND_DURATION_MS, Date.now() + AUTO_DISABLE_MAX_DURATION_MS);
        scheduleTurnOff(newTs);
        return { expiresAt: newTs };
      }),
  })),
);

export function useAutoRefresh(onRefresh: () => void) {
  const expiresAt = autoRefreshStore((s) => s.expiresAt);
  const toggle = autoRefreshStore((s) => s.toggle);
  const extend = autoRefreshStore((s) => s.extend);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const enabled = expiresAt !== null;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = setInterval(() => {
      onRefreshRef.current();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(id);
    };
  }, [enabled]);

  const prevEnabled = useRef(false);
  useEffect(() => {
    if (enabled && !prevEnabled.current) {
      onRefreshRef.current();
    }
    prevEnabled.current = enabled;
  }, [enabled]);

  return useMemo(() => ({ enabled, expiresAt, toggle, extend }), [enabled, expiresAt, toggle, extend]);
}
