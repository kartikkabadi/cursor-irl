import { Link } from 'react-router-dom';
import { ArrowUpRight, UsersThree } from '@phosphor-icons/react';
import type { AttendeeConnection } from '../../shared/attendee';
import { DitherprintAvatar } from './DitherprintAvatar';

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ConnectionList({ connections }: { connections: AttendeeConnection[] }) {
  if (!connections.length) return <div className="flex items-center gap-3 border-t border-[var(--line)] py-6 text-sm text-[var(--muted)]"><UsersThree size={17} />No connections yet. Find someone and press I met this person.</div>;
  return <ul className="divide-y divide-[var(--line)] border-t border-[var(--line-strong)]">{connections.map((connection) => <li key={connection.id}><Link to={`/p/${connection.slug}`} className="flex min-h-[52px] items-center gap-3 py-2.5 transition hover:bg-white/50"><DitherprintAvatar profileId={connection.id} variant={connection.avatar_variant} size={40} rounded /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{connection.name}</span><span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">cursor {connection.cursor_code}</span></span><span className="shrink-0 font-mono text-[11px] text-[var(--muted)]">{relativeTime(connection.created_at)}</span><ArrowUpRight size={15} className="shrink-0 text-[var(--muted)]" /></Link></li>)}</ul>;
}
