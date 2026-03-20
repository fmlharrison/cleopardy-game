import Link from "next/link";

export default function JoinPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Join</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Placeholder: session code and display name will live here.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Back
      </Link>
    </main>
  );
}
