import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Broadcast, CaretDown, MagnifyingGlass, Sparkle, UsersThree } from '@phosphor-icons/react';
import type { Attendee, LeaderboardEntry } from '../../shared/attendee';
import { getLeaderboard, listAttendees, ApiError } from '../api';
import { AttendeeCard } from '../components/AttendeeCard';
import { CursorPointer } from '../components/CursorPointer';
import { DitherprintAvatar } from '../components/DitherprintAvatar';
import { EmptyState } from '../components/EmptyState';
import { ArrowButton, Button, StatusPill } from '../components/ui';

const filters = [
  ['here', 'Here now'],
  ['open', 'Open to meet'],
  ['agents', 'Building agents'],
  ['collab', 'Looking for collaborators'],
] as const;

export function HomePage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('here');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [attendeeResult, leaderboardResult] = await Promise.all([listAttendees(query, filter), getLeaderboard()]);
        if (!cancelled) { setAttendees(attendeeResult.attendees); setLeaderboard(leaderboardResult.leaderboard); setError(''); }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Could not load the room.');
      } finally { if (!cancelled) setLoading(false); }
    }, query ? 180 : 0);
    const poll = window.setInterval(async () => {
      try {
        const [attendeeResult, leaderboardResult] = await Promise.all([listAttendees(query, filter), getLeaderboard()]);
        if (!cancelled) { setAttendees(attendeeResult.attendees); setLeaderboard(leaderboardResult.leaderboard); setError(''); }
      } catch { /* retain the last good room state during a transient poll failure */ }
    }, 12_000);
    return () => { cancelled = true; window.clearTimeout(timer); window.clearInterval(poll); };
  }, [query, filter]);

  const activeCount = attendees.length;
  const leading = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  return <div>
    <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-12 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-16 lg:pb-24">
      <div className="max-w-[760px]">
        <div className="mb-8 flex flex-wrap items-center gap-2"><StatusPill active>live room</StatusPill><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Cursor Roadshow / Bangalore</span></div>
        <h1 className="max-w-[720px] text-[clamp(3.5rem,10vw,8.5rem)] font-semibold leading-[.87] tracking-[-0.085em]">Who’s actually <span className="text-[var(--accent)]">here?</span></h1>
        <p className="mt-8 max-w-[580px] text-lg leading-relaxed tracking-[-0.02em] text-[var(--muted)] sm:text-xl">Find the humans behind the handles at Cursor Roadshow Bangalore. Join the live room, share a clue, and turn one more internet identity into a handshake.</p>
        <div className="mt-9 flex flex-wrap items-center gap-3"><Link to="/join"><ArrowButton>Join the room</ArrowButton></Link><a href="#room" className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]">See who’s here <ArrowUpRight size={16} /></a></div>
      </div>
      <div className="relative min-h-[320px] overflow-hidden border-y border-[var(--line-strong)] bg-[var(--sand)] p-6 sm:p-8 lg:min-h-[380px]">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 72% 24%, rgba(245,78,0,.18) 0 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Room status</p><p className="mt-2 text-5xl font-semibold tracking-[-0.07em]">{loading && !attendees.length ? '—' : activeCount}<span className="ml-2 text-base font-medium tracking-[-0.02em] text-[var(--muted)]">cursors here now</span></p></div><Broadcast size={22} weight="fill" className="soft-pulse text-[#5C9C77]" /></div>
        <div className="pointer-events-none absolute bottom-7 right-7 flex h-52 w-52 items-center justify-center sm:bottom-9 sm:right-10"><div className="absolute h-44 w-44 rounded-full border border-[var(--line-strong)]" /><div className="absolute h-28 w-28 rounded-full border border-dashed border-[var(--line-strong)]" /><div className="absolute left-1 top-9 rotate-[-14deg]"><CursorPointer color="#F08A69" size="sm" /></div><div className="absolute right-0 top-1 rotate-[17deg]"><CursorPointer color="#6FB7A4" size="sm" /></div><div className="absolute bottom-0 left-16 rotate-[8deg]"><CursorPointer color="#7CA6D8" size="sm" /></div><span className="absolute bottom-8 right-8 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">find your signal</span></div>
        <div className="relative mt-10 max-w-[235px] border-t border-[var(--line-strong)] pt-3 text-xs leading-relaxed text-[var(--muted)]">Every cursor is a person who chose to be findable. No scraping. No awkward guessing.</div>
      </div>
    </section>

    <section id="room" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 pb-20 sm:px-8">
      <div className="flex flex-col gap-5 border-t border-[var(--line-strong)] py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><UsersThree size={18} /><h2 className="text-xl font-semibold tracking-[-0.04em]">The room</h2><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{loading ? 'refreshing' : `${activeCount} visible`}</span></div><div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"><label className="relative block sm:min-w-[265px]"><span className="sr-only">Search the room</span><MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search handles, projects, clues" className="field-input h-11 w-full pl-9" /></label><div className="relative"><label className="sr-only" htmlFor="room-filter">Filter the room</label><select id="room-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="field-input h-11 w-full appearance-none pr-10 sm:w-auto sm:min-w-[180px]">{filters.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><CaretDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /></div></div></div>
      <div className="flex gap-2 overflow-x-auto pb-5 pt-1 lg:hidden">{filters.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${filter === value ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]' : 'border-[var(--line)] text-[var(--muted)]'}`}>{label}</button>)}</div>
      {error ? <div className="mb-5 flex items-center justify-between gap-4 border border-[#D3A296] bg-[#FFF4EF] px-4 py-3 text-sm text-[#8E392D]"><span>{error}</span><Button variant="ghost" onClick={() => setQuery((value) => value)}>Retry</Button></div> : null}
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{loading && !attendees.length ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card" />) : attendees.length ? attendees.map((attendee, index) => <AttendeeCard key={attendee.id} attendee={attendee} index={index} />) : <EmptyState searched={Boolean(query)} />}</div>
    </section>

    <section className="mx-auto grid max-w-[1400px] gap-10 border-t border-[var(--line-strong)] px-4 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:py-20"><div><div className="mb-5 flex items-center gap-2"><Sparkle size={18} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">friendly scoreboard</span></div><h2 className="max-w-md text-4xl font-semibold leading-[.95] tracking-[-0.06em]">Connection is the feature.</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--muted)]">Every “met IRL” is a small proof that the room got smaller. Keep it generous; the leaderboard is just a nudge to say hello.</p></div><div className="divide-y divide-[var(--line)] border-y border-[var(--line-strong)]">{leading.length ? leading.map((entry, index) => <Link to={`/p/${entry.slug}`} key={entry.id} className="flex items-center gap-4 py-4 transition hover:bg-white/50"><span className="w-6 font-mono text-xs text-[var(--muted)]">0{index + 1}</span><DitherprintAvatar profileId={entry.id} variant={entry.avatar_variant} size={40} rounded /><span className="flex-1 text-sm font-semibold">{entry.name}</span><span className="font-mono text-xs text-[var(--muted)]">{entry.connection_count} {entry.connection_count === 1 ? 'connection' : 'connections'}</span><ArrowUpRight size={16} className="text-[var(--muted)]" /></Link>) : <div className="flex items-center gap-3 py-8 text-sm text-[var(--muted)]"><Sparkle size={18} />The first handshake will set the tone.</div>}</div></section>
  </div>;
}
