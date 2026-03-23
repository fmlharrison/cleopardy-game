import Link from "next/link";

import { GameRoomClient, type GameRoomRole } from "@/components/GameRoomClient";
import { StatusBanner } from "@/components/ui/StatusBanner";

type PageProps = {
  params: Promise<{ sessionCode: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function GameSessionPage({
  params,
  searchParams,
}: PageProps) {
  const { sessionCode: sessionCodeParam } = await params;
  const { role: roleParam } = await searchParams;
  const sessionCode = decodeURIComponent(sessionCodeParam);

  const role: GameRoomRole | null =
    roleParam === "host" || roleParam === "player" ? roleParam : null;

  if (!role) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-6 py-16">
        <h1 className="text-xl font-semibold tracking-tight">Game</h1>
        <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          Session: {sessionCode}
        </p>
        <StatusBanner variant="warning" title="Host or player role missing">
          <p>
            Use the link from{" "}
            <Link
              href="/host"
              className="font-medium underline underline-offset-2"
            >
              Host
            </Link>{" "}
            (
            <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
              ?role=host
            </code>
            ) or{" "}
            <Link
              href="/join"
              className="font-medium underline underline-offset-2"
            >
              Join
            </Link>{" "}
            (
            <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
              ?role=player
            </code>
            ). Opening only{" "}
            <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
              /game/{sessionCode}
            </code>{" "}
            is not enough.
          </p>
        </StatusBanner>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
        >
          ← Home
        </Link>
      </main>
    );
  }

  return (
    <GameRoomClient
      key={`${sessionCode}-${role}`}
      sessionCode={sessionCode}
      role={role}
    />
  );
}
