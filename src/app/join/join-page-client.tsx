"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { getOrCreateStoredId, STORAGE_KEYS } from "@/lib/ids";
import { joinPlayerSession } from "@/lib/join-player-session";
import { isValidSessionCode, normalizeSessionCode } from "@/lib/session-code";

export function JoinPageClient() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [name, setName] = useState("");
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Enter your name.");
        return;
      }

      const code = normalizeSessionCode(sessionCodeInput);
      if (!isValidSessionCode(code)) {
        setError(
          "Session code must be 6 characters (A–Z and 2–9, no 0/O/1/I).",
        );
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setPending(true);

      const playerId = getOrCreateStoredId(STORAGE_KEYS.playerId);

      try {
        const result = await joinPlayerSession({
          sessionCode: code,
          playerId,
          name: trimmedName,
          signal: ac.signal,
        });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        router.push(`/game/${encodeURIComponent(code)}?role=player`);
      } finally {
        setPending(false);
        if (abortRef.current === ac) {
          abortRef.current = null;
        }
      }
    },
    [name, sessionCodeInput, router],
  );

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Join</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the session code from your host and your display name.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="join-name"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Your name
          </label>
          <input
            id="join-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            maxLength={40}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="join-code"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Session code
          </label>
          <input
            id="join-code"
            type="text"
            value={sessionCodeInput}
            onChange={(e) => setSessionCodeInput(e.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            placeholder="ABCD12"
            className="font-mono uppercase rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm tracking-widest dark:border-zinc-600 dark:bg-zinc-950"
            disabled={pending}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Letters and digits only (shown uppercase as you type).
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Joining…" : "Join game"}
        </button>
      </form>

      <Link
        href="/"
        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
      >
        ← Back
      </Link>
    </main>
  );
}
