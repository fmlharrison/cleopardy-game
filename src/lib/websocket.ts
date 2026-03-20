import type { ClientMessage, ServerMessage } from "@/types/messages";

const DEFAULT_DEV_HOST = "127.0.0.1:1999";

function wsProtocolForHost(host: string): "ws" | "wss" {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "ws"
    : "wss";
}

const DEFAULT_PARTY =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_PARTYKIT_PARTY
    ? process.env.NEXT_PUBLIC_PARTYKIT_PARTY
    : "cleopardy";

/**
 * WebSocket URL for a PartyKit room. Default party matches `name` in `partykit.json`.
 * Set `NEXT_PUBLIC_PARTYKIT_HOST` to host only (e.g. `127.0.0.1:1999`).
 */
export function getPartySocketUrl(
  roomId: string,
  party: string = DEFAULT_PARTY,
): string {
  const host =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_PARTYKIT_HOST
      ? process.env.NEXT_PUBLIC_PARTYKIT_HOST
      : DEFAULT_DEV_HOST;
  const protocol = wsProtocolForHost(host);
  const encodedRoom = encodeURIComponent(roomId);
  return `${protocol}://${host}/parties/${encodeURIComponent(party)}/${encodedRoom}`;
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
