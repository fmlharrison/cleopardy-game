/**
 * Shared Tailwind class strings for consistent layout, type, and actions.
 * Keep in sync across marketing-style pages and the game shell.
 */
export const ui = {
  page: "mx-auto flex min-h-full flex-col px-6 py-12 sm:py-16",
  pageNarrow: "max-w-lg",
  pageHost: "max-w-3xl",
  pageGame: "max-w-4xl",
  /** In-game shell: board + sidebar rail */
  pageGameWide: "max-w-7xl",
  /** Full-width finale (end game) */
  pageGameFinale: "max-w-3xl",
  stack: "flex flex-col gap-8",
  stackLoose: "flex flex-col gap-10",
  h1: "text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
  /** Short label above the page title */
  eyebrow:
    "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
  lead: "mt-3 max-w-prose text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400",
  /** Section title for forms / steps */
  sectionTitle: "text-sm font-semibold text-zinc-900 dark:text-zinc-100",
  formLabel: "text-sm font-medium text-zinc-800 dark:text-zinc-200",
  helper: "text-xs leading-relaxed text-zinc-500 dark:text-zinc-400",
  /** Card-style surface for marketing forms */
  formCard:
    "rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/50 sm:p-6",
  /** CTA grouping on landing */
  actionCard:
    "rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-5 dark:border-zinc-700/80 dark:bg-zinc-900/35 sm:p-6",
  /** Page header strip used in game + optional marketing blocks */
  surfaceHeader:
    "rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/40",
  /** Secondary panel (lobby actions, etc.) */
  surfacePanel:
    "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/40",
  btnPrimary:
    "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
  btnSecondary:
    "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900",
  btnDanger:
    "inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-900 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-100 dark:hover:bg-red-950/40",
  linkBack:
    "text-sm font-medium text-zinc-600 underline underline-offset-4 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
  input:
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25",
  textarea:
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25",
} as const;

/**
 * Cleopardy surfaces (cream, ink, primary container buttons).
 * Use on marketing pages and anywhere the game shell palette should apply.
 */
export const cleopardyUi = {
  stack: "flex flex-col gap-8",
  stackLoose: "flex flex-col gap-10",
  h1: "text-3xl font-bold tracking-tight text-archivist-ink md:text-4xl",
  eyebrow:
    "text-[10px] font-bold uppercase tracking-widest text-archivist-accent opacity-90",
  lead: "mt-3 max-w-prose text-[15px] leading-relaxed text-archivist-on-surface-variant",
  sectionTitle: "text-sm font-bold text-archivist-ink",
  formLabel: "text-sm font-medium text-archivist-ink",
  helper: "text-xs leading-relaxed text-archivist-accent",
  formCard:
    "rounded-sm border border-archivist-outline-variant/30 bg-archivist-surface-lowest p-5 shadow-sm sm:p-6",
  actionCard:
    "rounded-sm border border-archivist-outline-variant/25 bg-archivist-container/80 p-5 sm:p-6",
  btnPrimary:
    "inline-flex items-center justify-center rounded-sm bg-archivist-primary-container px-4 py-2.5 text-sm font-semibold text-archivist-cream shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center rounded-sm border border-archivist-outline-variant bg-archivist-surface-lowest px-4 py-2.5 text-sm font-semibold text-archivist-ink shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50",
  linkBack:
    "text-xs font-semibold text-archivist-accent underline-offset-4 hover:text-archivist-ink hover:underline sm:text-sm",
  input:
    "w-full rounded-sm border border-archivist-outline-variant bg-archivist-surface-lowest px-3 py-2.5 text-sm text-archivist-ink shadow-sm outline-none transition placeholder:text-archivist-accent/50 focus:border-archivist-accent focus:ring-2 focus:ring-archivist-accent/20",
} as const;
