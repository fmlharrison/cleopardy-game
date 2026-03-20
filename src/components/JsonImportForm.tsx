"use client";

import { useId } from "react";

export type JsonImportFormProps = {
  rawJson: string;
  onRawJsonChange: (value: string) => void;
  onValidate: () => void;
  /** Load file contents into the editor and run the same validation pipeline. */
  onLoadRawJson: (raw: string) => void;
};

export function JsonImportForm({
  rawJson,
  onRawJsonChange,
  onValidate,
  onLoadRawJson,
}: JsonImportFormProps) {
  const fileInputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    onLoadRawJson(text);
    e.target.value = "";
  };

  return (
    <section aria-labelledby="import-heading" className="flex flex-col gap-4">
      <h2
        id="import-heading"
        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        Import
      </h2>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={fileInputId}
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Upload a board file
        </label>
        <input
          id={fileInputId}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="block w-full max-w-md text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-50 dark:text-zinc-400 dark:file:border-zinc-600 dark:file:bg-zinc-900 dark:file:text-zinc-200 dark:hover:file:bg-zinc-800"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="board-json-textarea"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Or paste JSON
        </label>
        <textarea
          id="board-json-textarea"
          value={rawJson}
          onChange={(e) => onRawJsonChange(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='{"title": "…", "categories": [ … ]}'
          className="w-full max-w-2xl rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={onValidate}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Validate board
        </button>
      </div>
    </section>
  );
}
