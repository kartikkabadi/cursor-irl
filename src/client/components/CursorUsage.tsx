import { useEffect, useState } from 'react';
import { ArrowUpRight, Cursor } from '@phosphor-icons/react';
import { getCursorUsage, type CursorUsageResponse } from '../api';

export function CursorUsage({ handle }: { handle: string | null | undefined }) {
  const [usage, setUsage] = useState<CursorUsageResponse | null>(null);

  useEffect(() => {
    if (!handle) { setUsage(null); return; }
    const controller = new AbortController();
    void getCursorUsage(handle, controller.signal).then(setUsage).catch(() => setUsage(null));
    return () => controller.abort();
  }, [handle]);

  if (!usage?.available || usage.tokens === null) return null;
  return <div className="mt-5 border-t border-[var(--line-strong)] pt-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Cursor tokens</p><p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{formatTokens(usage.tokens)}</p><p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">Public total from <span className="font-mono">cursor.com/@{usage.handle}</span>.</p></div><a href={usage.profile_url} target="_blank" rel="noreferrer" aria-label={`Open @${usage.handle} Cursor profile`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"><Cursor size={16} /> Open <ArrowUpRight size={14} /></a></div></div>;
}

function formatTokens(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('en-IN');
}
