import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cleopardy</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Jeopardy-style multiplayer (MVP scaffold). Host or join a session to
          play.
        </p>
      </div>
      <nav className="flex flex-col gap-3 text-sm font-medium">
        <Link
          className="rounded-md border border-zinc-300 px-4 py-3 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/host"
        >
          Host a game
        </Link>
        <Link
          className="rounded-md border border-zinc-300 px-4 py-3 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/join"
        >
          Join a game
        </Link>
      </nav>
    </main>
  );
}
