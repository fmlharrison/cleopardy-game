"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type MarketingLayoutProps = {
  children: React.ReactNode;
};

/**
 * Shared chrome for marketing-style routes: matches GameShell nav,
 * cream + surface-bright content area, and Rules dialog copy.
 */
export function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesTitleId = useId();

  return (
    <div className="flex min-h-screen flex-col bg-archivist-cream font-archivist text-archivist-ink">
      {rulesOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-archivist-ink/40 p-4"
          role="presentation"
          onClick={() => setRulesOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setRulesOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={rulesTitleId}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-archivist-outline-variant/30 bg-archivist-surface-lowest p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2
              id={rulesTitleId}
              className="text-lg font-bold text-archivist-ink"
            >
              Rules
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-archivist-on-surface-variant">
              <li>
                Responses must be in the form of a question when you play aloud.
              </li>
              <li>The host’s scoring decision is final for this session.</li>
              <li>First buzz on the server wins when buzzing is open.</li>
            </ul>
            <button
              type="button"
              className="mt-6 rounded-sm bg-archivist-primary-container px-4 py-2 text-sm font-semibold text-archivist-cream"
              onClick={() => setRulesOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-archivist-cream px-6 py-5 md:px-12 md:py-6"
        aria-label="Site"
      >
        <Link
          href="/"
          className="min-w-0 text-xl font-bold uppercase tracking-tighter text-archivist-ink md:text-2xl"
        >
          Cleopardy
        </Link>
        <div className="flex shrink-0 items-center gap-x-3 md:gap-x-6">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="text-xs font-semibold text-archivist-accent underline-offset-4 hover:text-archivist-ink hover:underline sm:text-sm"
          >
            Rules
          </button>
          <Link
            href="/"
            className="text-xs font-semibold text-archivist-accent underline-offset-4 hover:text-archivist-ink hover:underline sm:text-sm"
          >
            Home
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 flex-col pt-[5.5rem] lg:pt-24">
        <main className="flex flex-1 flex-col bg-archivist-surface-bright px-6 py-8 md:px-12 md:pb-16 md:pt-12">
          <div className="mx-auto w-full max-w-lg lg:max-w-xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
