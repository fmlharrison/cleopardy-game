"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StatusBanner } from "@/components/ui/StatusBanner";
import { joinErrorTitle } from "@/lib/join-error-title";
import { getOrCreateStoredId, STORAGE_KEYS } from "@/lib/ids";
import { joinPlayerSession } from "@/lib/join-player-session";
import { cleopardyUi } from "@/lib/ui";
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

  const handleWatchOnly = useCallback(() => {
    setError(null);
    const code = normalizeSessionCode(sessionCodeInput);
    if (!isValidSessionCode(code)) {
      setError("Session code must be 6 characters (A–Z and 2–9, no 0/O/1/I).");
      return;
    }
    router.push(`/game/${encodeURIComponent(code)}?role=spectator`);
  }, [sessionCodeInput, router]);

  return (
    <div className={cleopardyUi.stack}>
      <header className="space-y-3">
        <p className={cleopardyUi.eyebrow}>Join a session</p>
        <h1 className={cleopardyUi.h1}>Join</h1>
        <p className={cleopardyUi.lead}>
          Enter the six-character code from your host and the name you want on
          the board.
        </p>
      </header>

      <div className={cleopardyUi.formCard}>
        <h2 className={`${cleopardyUi.sectionTitle} mb-6`}>Your details</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="join-name" className={cleopardyUi.formLabel}>
              Display name
            </label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              className={cleopardyUi.input}
              maxLength={40}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="join-code" className={cleopardyUi.formLabel}>
              Session code
            </label>
            <input
              id="join-code"
              type="text"
              value={sessionCodeInput}
              onChange={(e) =>
                setSessionCodeInput(e.target.value.toUpperCase())
              }
              autoComplete="off"
              spellCheck={false}
              maxLength={6}
              placeholder="ABCD12"
              className={`${cleopardyUi.input} font-mono uppercase tracking-widest`}
              disabled={pending}
              aria-describedby="join-code-hint"
            />
            <p id="join-code-hint" className={cleopardyUi.helper}>
              Six characters from the host (letters and digits; shown uppercase
              as you type).
            </p>
          </div>

          {error ? (
            <StatusBanner
              variant="error"
              title={joinErrorTitle(error)}
              className="rounded-sm border-red-300/80 bg-red-50 text-red-950"
            >
              <p>{error}</p>
            </StatusBanner>
          ) : null}

          <div className="pt-1">
            <button
              type="submit"
              disabled={pending}
              className={`${cleopardyUi.btnPrimary} w-full sm:w-auto`}
            >
              {pending ? "Connecting to session…" : "Join game"}
            </button>
          </div>
        </form>
      </div>

      <div className={cleopardyUi.formCard}>
        <h2 className={`${cleopardyUi.sectionTitle} mb-2`}>Just watching?</h2>
        <p className={cleopardyUi.helper}>
          Use the same session code as above for a read-only view: board, clues,
          scores, and finale — no display name and no buzzing.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={handleWatchOnly}
          className={`${cleopardyUi.btnSecondary} mt-4 w-full sm:w-auto`}
        >
          Watch only
        </button>
      </div>
    </div>
  );
}
