import Link from "next/link";

import { JsonImportForm } from "@/components/JsonImportForm";

export default function HostPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Host</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Import a board JSON file or paste JSON below. Validation uses the
          shared Zod schema; creating a session will come in a later step.
        </p>
      </div>

      <JsonImportForm />

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Back
      </Link>
    </main>
  );
}
