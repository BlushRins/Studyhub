"use client";

import { useCallback, useSyncExternalStore } from "react";

// A boolean persisted to localStorage, read through useSyncExternalStore so the
// server render (always `fallback`) and the client never mismatch on hydration.
// Storage can throw (private mode, blocked site data), so an in-memory copy
// keeps the toggle working for the session either way.

const memory = new Map<string, boolean>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, listener: () => void) {
  const current = listeners.get(key) ?? new Set<() => void>();
  current.add(listener);
  listeners.set(key, current);
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage || (event.key !== key && event.key !== null)) return;
    memory.delete(key);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    current.delete(listener);
    if (!current.size) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

function read(key: string, fallback: boolean): boolean {
  if (memory.has(key)) return memory.get(key)!;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

export function usePersistentFlag(key: string, fallback = false) {
  const value = useSyncExternalStore(
    useCallback((listener) => subscribe(key, listener), [key]),
    () => read(key, fallback),
    () => fallback,
  );

  const setValue = useCallback(
    (next: boolean) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Storage unavailable: the in-memory value still applies.
      }
      listeners.get(key)?.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue] as const;
}
