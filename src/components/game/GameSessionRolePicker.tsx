"use client";

import Link from "next/link";
import { useMemo } from "react";

import { StatusBanner } from "@/components/ui/StatusBanner";
import { readStoredId, STORAGE_KEYS } from "@/lib/ids";

/**
 * Shown when `/game/[sessionCode]` is opened without `?role=`. Offers explicit
 * role links and, after hydration, a hint from persisted host/player ids.
 */
export function GameSessionRolePicker({
  sessionCode,
}: {
  sessionCode: string;
}) {
  const hint = useMemo(() => {
    const hasHost = Boolean(readStoredId(STORAGE_KEYS.hostId));
    const hasPlayer = Boolean(readStoredId(STORAGE_KEYS.playerId));
    if (hasHost && hasPlayer) {
      return "both";
    } else if (hasHost) {
      return "host";
    } else if (hasPlayer) {
      return "player";
    } else {
      return "none";
    }
  }, []);

  const encoded = encodeURIComponent(sessionCode);
  const hostHref = `/game/${encoded}?role=host`;
  const playerHref = `/game/${encoded}?role=player`;

  return (
    <div className="space-y-4">
      <StatusBanner variant="warning" title="Host or player role missing">
        <p>
          Add{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            ?role=host
          </code>{" "}
          or{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            ?role=player
          </code>{" "}
          to the URL, or use the buttons below. Use the link from{" "}
          <Link
            href="/host"
            className="font-medium underline underline-offset-2"
          >
            Host
          </Link>{" "}
          or{" "}
          <Link
            href="/join"
            className="font-medium underline underline-offset-2"
          >
            Join
          </Link>{" "}
          so the query is included when you bookmark.
        </p>
      </StatusBanner>

      {hint === "host" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This browser has a saved <span className="font-medium">host</span>{" "}
          identity — use{" "}
          <Link
            href={hostHref}
            className="font-medium underline underline-offset-2"
          >
            Host view
          </Link>{" "}
          if you created this session here.
        </p>
      ) : null}
      {hint === "player" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This browser has a saved <span className="font-medium">player</span>{" "}
          identity — use{" "}
          <Link
            href={playerHref}
            className="font-medium underline underline-offset-2"
          >
            Player view
          </Link>{" "}
          if you joined this session from this device.
        </p>
      ) : null}
      {hint === "both" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This browser has both host and player ids saved. Pick the role for
          this tab: host if you run the board, player if you are buzzing in.
        </p>
      ) : null}
      {hint === "none" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No saved game identity here yet — use Host or Join first, then open
          the matching button below.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={hostHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Continue as host
        </Link>
        <Link
          href={playerHref}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          Continue as player
        </Link>
      </div>
    </div>
  );
}
