type CreateGamePlaceholderButtonProps = {
  disabled: boolean;
  onCreateGame?: () => void;
  isLoading?: boolean;
  error?: string | null;
};

export function CreateGamePlaceholderButton({
  disabled,
  onCreateGame,
  isLoading = false,
  error = null,
}: CreateGamePlaceholderButtonProps) {
  const busy = Boolean(isLoading);
  const isDisabled = disabled || busy;

  return (
    <section aria-labelledby="create-heading" className="space-y-2">
      <h2
        id="create-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Session
      </h2>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onCreateGame?.()}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {busy ? "Creating…" : "Create game"}
      </button>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Starts a PartyKit room with your validated board. Run{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
          npm run party:dev
        </code>{" "}
        locally so the WebSocket can connect.
      </p>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
