"use client";

import { useId } from "react";

import { ui } from "@/lib/ui";

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
    <section aria-labelledby="import-heading" className="flex flex-col gap-6">
      <h2 id="import-heading" className={ui.sectionTitle}>
        Import
      </h2>

      <div className="flex flex-col gap-2">
        <label htmlFor={fileInputId} className={ui.formLabel}>
          Upload a board file
        </label>
        <input
          id={fileInputId}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="block w-full max-w-md text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-50 dark:text-zinc-400 dark:file:border-zinc-600 dark:file:bg-zinc-900 dark:file:text-zinc-200 dark:hover:file:bg-zinc-800"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="board-json-textarea" className={ui.formLabel}>
          Or paste JSON
        </label>
        <textarea
          id="board-json-textarea"
          value={rawJson}
          onChange={(e) => onRawJsonChange(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='{"title": "…", "categories": [ … ]}'
          className={`${ui.textarea} max-w-2xl`}
        />
      </div>

      <div>
        <button type="button" onClick={onValidate} className={ui.btnPrimary}>
          Validate board
        </button>
      </div>
    </section>
  );
}
