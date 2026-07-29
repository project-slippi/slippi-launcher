import { useEffect, useState } from "react";

const loadStoredValue = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === typeof defaultValue) {
        return parsed as T;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultValue;
};

const storeValue = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stateHook = useState<T>(() => loadStoredValue(key, defaultValue));
  const value = stateHook[0];

  useEffect(() => {
    storeValue(key, value);
  }, [key, value]);

  return stateHook;
}
