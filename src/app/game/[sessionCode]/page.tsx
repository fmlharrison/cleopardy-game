import Link from "next/link";

import { GameRoomClient, type GameRoomRole } from "@/components/GameRoomClient";

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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Open this page from <strong className="font-medium">Host</strong>{" "}
          (after creating a game) or{" "}
          <strong className="font-medium">Join</strong> so the correct{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            ?role=host
          </code>{" "}
          or{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            ?role=player
          </code>{" "}
          query is set.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
        >
          ← Home
        </Link>
      </main>
    );
  }

  return <GameRoomClient sessionCode={sessionCode} role={role} />;
}
