import Link from "next/link";

type PageProps = {
  params: Promise<{ sessionCode: string }>;
};

export default async function GameSessionPage({ params }: PageProps) {
  const { sessionCode } = await params;
  const decoded = decodeURIComponent(sessionCode);

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Game</h1>
        <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
          Session: {decoded}
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Placeholder: lobby, board, clue, and scoreboard will use PartyKit
          state for this room.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Home
      </Link>
    </main>
  );
}
