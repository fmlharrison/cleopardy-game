import type { ClientMessage, ServerMessage } from "@/types/messages";

const DEFAULT_PARTYKIT_PORT = "1999";

/** URL segment for the default single-party server (`/parties/main/:roomId`). Not the same as `name` in partykit.json. */
const DEFAULT_PARTY =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_PARTYKIT_PARTY
    ? process.env.NEXT_PUBLIC_PARTYKIT_PARTY
    : "main";

/**
 * Strip accidental protocol/path from env (e.g. `http://localhost:1999` → `localhost:1999`).
 */
export function normalizePartyKitHostInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    const withScheme = /^[\w+.-]+:\/\//.test(trimmed)
      ? trimmed
      : `http://${trimmed}`;
    const u = new URL(withScheme);
    const host = u.hostname;
    const port = u.port;
    return port ? `${host}:${port}` : host;
  } catch {
    return trimmed;
  }
}

function isLocalDevHostname(host: string): boolean {
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  return false;
}

function devPort(): string {
  const p = process.env.NEXT_PUBLIC_PARTYKIT_PORT?.trim();
  return p && /^\d+$/.test(p) ? p : DEFAULT_PARTYKIT_PORT;
}

/**
 * Resolves WebSocket protocol and authority (host, or host:port) for PartyKit.
 */
export function resolvePartyKitWsTarget(): {
  protocol: "ws" | "wss";
  authority: string;
} {
  const port = devPort();
  const envRaw = process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim();

  if (envRaw) {
    const normalized = normalizePartyKitHostInput(envRaw);
    if (!normalized) {
      return { protocol: "ws", authority: `127.0.0.1:${port}` };
    }
    if (normalized.includes(":")) {
      const hostOnly = normalized.slice(0, normalized.indexOf(":"));
      const local = isLocalDevHostname(hostOnly);
      return {
        protocol: local ? "ws" : "wss",
        authority: normalized,
      };
    }
    const local = isLocalDevHostname(normalized);
    if (local) {
      return { protocol: "ws", authority: `${normalized}:${port}` };
    }
    return { protocol: "wss", authority: normalized };
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return { protocol: "ws", authority: `localhost:${port}` };
    }
    return { protocol: "ws", authority: `${hostname}:${port}` };
  }

  return { protocol: "ws", authority: `127.0.0.1:${port}` };
}

/**
 * WebSocket URL for a PartyKit room. Default party is **`main`** (PartyKit’s
 * built-in party id for a single `server.ts` — not `partykit.json`’s `name`).
 *
 * - If `NEXT_PUBLIC_PARTYKIT_HOST` is unset, uses the **same hostname as the page**
 *   plus `NEXT_PUBLIC_PARTYKIT_PORT` (default `1999`), so LAN testing
 *   (`http://192.168.x.x:3000`) hits PartyKit on that machine instead of loopback.
 * - Strip protocols from `NEXT_PUBLIC_PARTYKIT_HOST` if pasted with `http://` or `ws://`.
 */
export function getPartySocketUrl(
  roomId: string,
  party: string = DEFAULT_PARTY,
): string {
  const { protocol, authority } = resolvePartyKitWsTarget();
  const encodedParty = encodeURIComponent(party);
  const encodedRoom = encodeURIComponent(roomId);
  return `${protocol}://${authority}/parties/${encodedParty}/${encodedRoom}`;
}

export function stringifyClientMessage(message: ClientMessage): string {
  return JSON.stringify(message);
}

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("type" in data)) {
      return null;
    }
    return data as ServerMessage;
  } catch {
    return null;
  }
}
