import type { ClientMessage } from "@/types/messages";

import {
  getPartySocketUrl,
  parseServerMessage,
  stringifyClientMessage,
} from "@/lib/websocket";

export type JoinPlayerSessionResult =
  | { ok: true }
  | { ok: false; message: string };

function messageRaw(
  ev: MessageEvent<string | Blob | ArrayBuffer>,
): string | null {
  if (typeof ev.data === "string") {
    return ev.data;
  }
  if (ev.data instanceof ArrayBuffer) {
    return new TextDecoder().decode(ev.data);
  }
  return null;
}

/**
 * Connects to the room, sends JOIN_SESSION, resolves when SESSION_STATE includes this player.
 */
export function joinPlayerSession(options: {
  sessionCode: string;
  playerId: string;
  name: string;
  signal?: AbortSignal;
}): Promise<JoinPlayerSessionResult> {
  const { sessionCode, playerId, name, signal } = options;
  const url = getPartySocketUrl(sessionCode);

  return new Promise((resolve) => {
    let settled = false;
    const ws = new WebSocket(url);

    const finish = (result: JoinPlayerSessionResult) => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const onAbort = () => {
      finish({ ok: false, message: "Cancelled" });
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    ws.onopen = () => {
      if (settled) {
        return;
      }
      const msg: ClientMessage = {
        type: "JOIN_SESSION",
        playerId,
        name,
      };
      ws.send(stringifyClientMessage(msg));
    };

    ws.onmessage = (ev: MessageEvent<string | Blob | ArrayBuffer>) => {
      if (settled) {
        return;
      }
      const raw = messageRaw(ev);
      if (raw === null) {
        return;
      }

      const parsed = parseServerMessage(raw);
      if (!parsed) {
        return;
      }

      if (parsed.type === "ERROR") {
        finish({ ok: false, message: parsed.message });
        return;
      }

      if (parsed.type === "SESSION_STATE") {
        const s = parsed.state;
        if (
          s.sessionCode === sessionCode &&
          s.players.some((p) => p.id === playerId)
        ) {
          finish({ ok: true });
        }
      }
    };

    ws.onerror = () => {
      finish({
        ok: false,
        message: `WebSocket connection failed. Is PartyKit running? Attempted: ${url}`,
      });
    };

    ws.onclose = () => {
      if (!settled) {
        finish({
          ok: false,
          message: "Connection closed before join completed.",
        });
      }
    };
  });
}
