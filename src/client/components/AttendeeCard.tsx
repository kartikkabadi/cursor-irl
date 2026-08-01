import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, UsersThree } from '@phosphor-icons/react';
import type { Attendee } from '../../shared/attendee';
import { CursorPointer } from './CursorPointer';
import { DitherprintAvatar } from './DitherprintAvatar';
import { StatusPill } from './ui';

export function AttendeeCard({ attendee, index = 0 }: { attendee: Attendee; index?: number }) {
  const photoOverlay = (attendee.avatar_mode === 'photo' || attendee.avatar_mode === 'photo-frame') && attendee.avatar_url;
  return <Link to={`/p/${attendee.slug}`} className="group attendee-card reveal" style={{ '--index': index } as React.CSSProperties}>
    <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden border-t border-[var(--line-strong)] pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0"><DitherprintAvatar profileId={attendee.id} variant={attendee.avatar_variant} size={44} rounded label={`${attendee.name} identity`} />{photoOverlay ? <img src={attendee.avatar_url ?? undefined} alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[var(--paper)] object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}</div>
          <div><p className="text-sm font-semibold tracking-[-0.02em]">{attendee.name}</p><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{attendee.x_handle ? `@${attendee.x_handle}` : 'local builder'}</p></div>
        </div>
        <ArrowUpRight size={18} className="text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--ink)]" />
      </div>
      <div className="pointer-events-none absolute right-3 top-16 opacity-95 transition duration-300 group-hover:rotate-3 group-hover:scale-105"><CursorPointer color={attendee.cursor_color} code={attendee.cursor_code} size="md" /></div>
      <div className="relative max-w-[72%] space-y-2">
        <p className="text-base font-medium leading-snug tracking-[-0.025em]">{attendee.project}</p>
        <div className="flex flex-wrap gap-1.5"><StatusPill active={attendee.active_now}>{attendee.active_now ? 'here now' : 'away'}</StatusPill>{attendee.open_to_meet ? <StatusPill>open to meet</StatusPill> : null}</div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]"><span className="inline-flex min-w-0 items-center gap-1.5 truncate"><MapPin size={13} />{attendee.venue_zone ?? 'somewhere in the room'}</span><span className="inline-flex shrink-0 items-center gap-1.5 font-mono"><UsersThree size={13} />{attendee.connection_count}</span></div>
    </div>
  </Link>;
}
