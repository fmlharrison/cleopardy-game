import Link from "next/link";

import { GameSessionRolePicker } from "@/components/game/GameSessionRolePicker";
import { GameRoomClient, type GameRoomRole } from "@/components/GameRoomClient";
import { ui } from "@/lib/ui";

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
    roleParam === "host" || roleParam === "player" || roleParam === "spectator"
      ? roleParam
      : null;

  if (!role) {
    return (
      <main className={`${ui.page} ${ui.pageNarrow} gap-6`}>
        <div>
          <h1 className={ui.h1}>Game</h1>
          <p className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">
            Session: {sessionCode}
          </p>
        </div>
        <GameSessionRolePicker sessionCode={sessionCode} />
        <Link href="/" className={ui.linkBack}>
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
