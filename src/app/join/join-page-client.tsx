"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StatusBanner } from "@/components/ui/StatusBanner";
import { joinErrorTitle } from "@/lib/join-error-title";
import { getOrCreateStoredId, STORAGE_KEYS } from "@/lib/ids";
import { joinPlayerSession } from "@/lib/join-player-session";
import { ui } from "@/lib/ui";
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
    <main className={`${ui.page} ${ui.pageNarrow} ${ui.stack}`}>
      <div>
        <h1 className={ui.h1}>Join</h1>
        <p className={ui.lead}>
          Enter the session code from your host and your display name.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            className={ui.input}
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
            className={`${ui.input} font-mono uppercase tracking-widest`}
            disabled={pending}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Letters and digits only (shown uppercase as you type).
          </p>
        </div>

        {error ? (
          <StatusBanner variant="error" title={joinErrorTitle(error)}>
            <p>{error}</p>
          </StatusBanner>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={`${ui.btnPrimary} w-full sm:w-auto`}
        >
          {pending ? "Connecting to session…" : "Join game"}
        </button>
      </form>

      <Link href="/" className={ui.linkBack}>
        ← Home
      </Link>
    </main>
  );
}
