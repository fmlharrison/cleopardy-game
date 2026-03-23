"use client";

import type { ReactNode } from "react";

export type StatusBannerVariant = "info" | "warning" | "error" | "success";

const variantClass: Record<StatusBannerVariant, string> = {
  info: "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-200",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  error:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
};

export type StatusBannerProps = {
  variant: StatusBannerVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Lightweight inline status / error surface (no toast library).
 */
export function StatusBanner({
  variant,
  title,
  children,
  className = "",
}: StatusBannerProps) {
  const role =
    variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${variantClass[variant]} ${className}`}
      role={role}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <div className={title ? "mt-1 space-y-1" : "space-y-1"}>{children}</div>
    </div>
  );
}
