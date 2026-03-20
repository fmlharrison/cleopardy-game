import type { z } from "zod";

import type { BoardImportValidation } from "@/types/board-import";

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

type BoardValidationSectionProps = {
  validation: BoardImportValidation;
};

export function BoardValidationSection({
  validation,
}: BoardValidationSectionProps) {
  if (validation.kind === "idle") {
    return (
      <section aria-labelledby="validation-heading" className="space-y-2">
        <h2
          id="validation-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Validation
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Run validation after pasting or uploading JSON.
        </p>
      </section>
    );
  }

  if (validation.kind === "empty") {
    return (
      <section aria-labelledby="validation-heading" className="space-y-2">
        <h2
          id="validation-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Validation
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
          Add JSON (paste or upload), then validate.
        </p>
      </section>
    );
  }

  if (validation.kind === "syntax") {
    return (
      <section aria-labelledby="validation-heading" className="space-y-2">
        <h2
          id="validation-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Validation
        </h2>
        <div
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p className="font-medium">JSON syntax error</p>
          <p className="mt-1 font-mono text-xs">{validation.message}</p>
        </div>
      </section>
    );
  }

  if (validation.kind === "schema") {
    return (
      <section aria-labelledby="validation-heading" className="space-y-2">
        <h2
          id="validation-heading"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Validation
        </h2>
        <div
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/40"
          role="alert"
        >
          <p className="text-sm font-medium text-red-900 dark:text-red-200">
            Board does not match the required format
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800 dark:text-red-200/90">
            {formatZodIssues(validation.error).map((line, i) => (
              <li key={i} className="font-mono text-xs">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="validation-heading" className="space-y-2">
      <h2
        id="validation-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Validation
      </h2>
      <p
        className="text-sm text-emerald-800 dark:text-emerald-200"
        role="status"
      >
        Board JSON is valid and ready for the next step.
      </p>
    </section>
  );
}
