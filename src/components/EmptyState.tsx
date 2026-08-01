export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-sm bg-[color:var(--color-muted-surface)]" />
          <div className="h-3 w-20 rounded-sm bg-[color:var(--color-muted-surface)]" />
        </div>
        <div className="h-8 w-8 rounded-sm bg-[color:var(--color-muted-surface)]" />
      </div>
      <div className="mt-4 h-3 w-full rounded-sm bg-[color:var(--color-muted-surface)]" />
      <div className="mt-2 h-3 w-2/3 rounded-sm bg-[color:var(--color-muted-surface)]" />
    </div>
  );
}

import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-card)] px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex justify-center gap-3 opacity-80">
        <span className="inline-block h-3 w-3 rotate-45 bg-[#f54e00]" />
        <span className="inline-block h-3 w-3 rotate-45 bg-[#c0a8dd]" />
        <span className="inline-block h-3 w-3 rotate-45 bg-[#9fbbe0]" />
      </div>
      <h3 className="text-lg tracking-tight text-[color:var(--color-text)]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[color:var(--color-text-muted)]">
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
