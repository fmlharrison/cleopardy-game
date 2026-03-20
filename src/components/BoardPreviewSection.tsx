import type { Board } from "@/types/game";

type BoardPreviewSectionProps = {
  board: Board | null;
};

export function BoardPreviewSection({ board }: BoardPreviewSectionProps) {
  return (
    <section aria-labelledby="preview-heading" className="space-y-2">
      <h2
        id="preview-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Preview
      </h2>
      {!board ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          A validated board will appear here after a successful validation.
        </p>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Title:
            </span>{" "}
            {board.title}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {board.categories.map((cat) => (
              <li key={cat.id}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {cat.name}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">
                  {" "}
                  — {cat.clues.length}{" "}
                  {cat.clues.length === 1 ? "clue" : "clues"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
