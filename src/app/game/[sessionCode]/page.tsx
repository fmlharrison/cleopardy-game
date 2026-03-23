import Link from "next/link";

import { GameSessionRolePicker } from "@/components/game/GameSessionRolePicker";
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
        <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          Session: {sessionCode}
        </p>
        <GameSessionRolePicker sessionCode={sessionCode} />
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
