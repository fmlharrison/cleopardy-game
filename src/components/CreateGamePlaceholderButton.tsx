type CreateGamePlaceholderButtonProps = {
  disabled: boolean;
};

export function CreateGamePlaceholderButton({
  disabled,
}: CreateGamePlaceholderButtonProps) {
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
        disabled={disabled}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Create game
      </button>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        PartyKit session creation will be wired here. Requires a validated
        board.
      </p>
    </section>
  );
}
