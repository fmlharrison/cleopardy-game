import { v4 as uuidv4 } from "uuid";

export const STORAGE_KEYS = {
  hostId: "cleopardy-host-id",
  playerId: "cleopardy-player-id",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** New random id (v4 UUID). Safe on server or client. */
export function newId(): string {
  return uuidv4();
}

export function readStoredId(key: StorageKey): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
}

export function writeStoredId(key: StorageKey, id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, id);
}

/**
 * Returns an existing id from localStorage or creates, persists, and returns a new one.
 * Call only from the browser (e.g. client components or effects).
 */
export function getOrCreateStoredId(key: StorageKey): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateStoredId must run in the browser");
  }
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const id = newId();
  window.localStorage.setItem(key, id);
  return id;
}
