import Link from "next/link";

import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { cleopardyUi } from "@/lib/ui";

export default function HomePage() {
  return (
    <MarketingLayout>
      <div className={cleopardyUi.stack}>
        <header className="space-y-3">
          <p className={cleopardyUi.eyebrow}>Multiplayer trivia</p>
          <h1 className={cleopardyUi.h1}>Cleopardy</h1>
          <p className={cleopardyUi.lead}>
            Choose to Host or Join a game
          </p>
        </header>

        <div className={cleopardyUi.actionCard}>
          <p className={`${cleopardyUi.helper} mb-4 sm:mb-5`}>
            Choose how you’re entering.
          </p>
          <nav className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              className={`${cleopardyUi.btnPrimary} w-full sm:min-w-[11rem]`}
              href="/host"
            >
              Host a game
            </Link>
            <Link
              className={`${cleopardyUi.btnSecondary} w-full sm:min-w-[11rem]`}
              href="/join"
            >
              Join a game
            </Link>
          </nav>
        </div>
      </div>
    </MarketingLayout>
  );
}
