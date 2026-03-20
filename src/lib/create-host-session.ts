import type { Board } from "@/types/game";
import type { ClientMessage } from "@/types/messages";

import {
  getPartySocketUrl,
  parseServerMessage,
  stringifyClientMessage,
} from "@/lib/websocket";

export type CreateHostSessionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Opens a PartyKit room WebSocket, sends HOST_CREATE_SESSION, and resolves when
 * the server broadcasts a SESSION_STATE that matches this host and board.
 */
export function createHostSession(options: {
  sessionCode: string;
  hostId: string;
  board: Board;
  signal?: AbortSignal;
}): Promise<CreateHostSessionResult> {
  const { sessionCode, hostId, board, signal } = options;
  const url = getPartySocketUrl(sessionCode);

  return new Promise((resolve) => {
    let settled = false;
    const ws = new WebSocket(url);

    const finish = (result: CreateHostSessionResult) => {
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
        type: "HOST_CREATE_SESSION",
        hostId,
        board,
      };
      ws.send(stringifyClientMessage(msg));
    };

    ws.onmessage = (ev: MessageEvent<string | Blob | ArrayBuffer>) => {
      if (settled) {
        return;
      }
      const raw =
        typeof ev.data === "string"
          ? ev.data
          : ev.data instanceof ArrayBuffer
            ? new TextDecoder().decode(ev.data)
            : null;
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
          s.hostId === hostId &&
          s.board !== null &&
          s.sessionCode === sessionCode
        ) {
          finish({ ok: true });
        }
      }
    };

    ws.onerror = () => {
      finish({
        ok: false,
        message: `WebSocket connection failed. Check that PartyKit is running (e.g. npm run party:dev) and that NEXT_PUBLIC_PARTYKIT_HOST / PORT match the server. Attempted: ${url}`,
      });
    };

    ws.onclose = () => {
      if (!settled) {
        finish({
          ok: false,
          message: "Connection closed before the session was ready.",
        });
      }
    };
  });
}
