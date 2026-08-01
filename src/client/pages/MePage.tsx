import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, Cursor, GithubLogo, PencilSimple, QrCode as QrCodeIcon, ShareNetwork, Trash, XLogo } from '@phosphor-icons/react';
import type { Attendee, AttendeeDetail, UpdateAttendeeInput } from '../../shared/attendee';
import { ApiError, absoluteUrl, deleteAttendee, getAttendeeById } from '../api';
import { ConnectionList } from '../components/ConnectionList';
import { CursorUsage } from '../components/CursorUsage';
import { DitherprintAvatar } from '../components/DitherprintAvatar';
import { ProfileEditor } from '../components/ProfileEditor';
import { QrCode } from '../components/QrCode';
import { ShareCard } from '../components/ShareCard';
import { Button } from '../components/ui';
import { clearProfileSession, getProfileSession } from '../storage';

export function MePage() {
  const navigate = useNavigate();
  const session = getProfileSession();
  const [attendee, setAttendee] = useState<AttendeeDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [form, setForm] = useState<UpdateAttendeeInput>({});
  const [loading, setLoading] = useState(Boolean(session));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void getAttendeeById(session.id).then((result) => {
      if (!cancelled) { setAttendee(result.attendee); setForm(toForm(result.attendee)); }
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Could not load your card.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session?.id]);

  if (!session) return <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-8"><div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-[16px] border border-[var(--line-strong)] bg-[var(--sand)]"><Cursor size={23} /></div><h1 className="text-4xl font-semibold tracking-[-0.07em]">Your cursor is not in the room yet.</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--muted)]">Join once and this becomes your portable find-me card.</p><Link to="/join" className="button-primary mt-8">Join the room <ArrowUpRight size={17} /></Link></section>;
  if (loading) return <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8"><div className="skeleton-profile" /></section>;
  if (error || !attendee) return <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-8"><h1 className="text-3xl font-semibold tracking-[-0.06em]">Your card needs a refresh.</h1><p className="mt-3 text-sm text-[var(--muted)]">{error || 'This profile may have been deleted.'}</p><Button className="mt-7" onClick={() => { clearProfileSession(); navigate('/join'); }}>Create a new card</Button></section>;

  const activeSession = session;
  const activeAttendee = attendee;
  const profileUrl = absoluteUrl(`p/${activeAttendee.slug}`);
  const shareText = `I'm at Cursor Roadshow Bangalore. Building: ${activeAttendee.project || 'something interesting'}${activeAttendee.x_handle ? ` Follow @${activeAttendee.x_handle} to find me online.` : ''}${activeAttendee.venue_zone ? ` Find me: ${activeAttendee.venue_zone}` : ''}${activeAttendee.outfit_clue ? ` / ${activeAttendee.outfit_clue}` : ''} Come say hi: ${profileUrl}`;

  async function remove() {
    if (!window.confirm('Delete your Cursor IRL profile and connections?')) return;
    try { await deleteAttendee(activeAttendee.id, activeSession.token); clearProfileSession(); navigate('/'); }
    catch { setNotice('Could not delete your profile.'); }
  }

  async function copyLink() {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(profileUrl); setNotice('Profile link copied.'); }
    else setNotice('Automatic copy is unavailable here — select and copy the link above.');
  }

  function handleSaved(saved: Attendee) {
    setAttendee((current) => current ? { ...current, ...saved } : current);
    setForm(toForm(saved)); setEditing(false); setNotice('Your card is updated.');
  }

  return <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
    <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"><ArrowLeft size={15} /> Back to the room</Link>
    <div className="mb-8 flex flex-col justify-between gap-5 border-t border-[var(--line-strong)] pt-5 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Your card / private controls</p><h1 className="mt-2 text-5xl font-semibold tracking-[-0.08em] sm:text-7xl">Find me.</h1></div><Button variant="ghost" onClick={() => setEditing((value) => !value)}><PencilSimple size={16} /> {editing ? 'Close editor' : 'Edit'}</Button></div>
    <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
      <div>
        <div className="find-card overflow-hidden border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"><div className="flex items-start justify-between gap-5 p-6 sm:p-10"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">cursor {activeAttendee.cursor_code}</span>{activeAttendee.venue_zone ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{activeAttendee.venue_zone}</span> : null}</div><h2 className="mt-12 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[.87] tracking-[-0.09em]">{activeAttendee.name}<span className="text-[var(--accent)]">.</span></h2><p className="mt-6 max-w-xl text-lg leading-snug text-white/70">{activeAttendee.project || 'Building in public.'}</p></div><DitherprintAvatar profileId={activeAttendee.id} variant={activeAttendee.avatar_variant} size={96} rounded className="h-18 w-18 shrink-0 sm:h-24 sm:w-24" /></div><div className="grid gap-0 border-t border-white/15 sm:grid-cols-2"><Cell label="Find me" className="sm:border-b sm:border-r">{activeAttendee.outfit_clue || 'Ask for this cursor.'}</Cell><Cell label="Zone" className="sm:border-b">{activeAttendee.venue_zone || 'Somewhere in the room'}</Cell><Cell label="Looking for" className="sm:border-b sm:border-r">{activeAttendee.looking_for || 'A good conversation'}</Cell><Cell label="Handles" className="sm:border-b"><div className="flex flex-wrap gap-x-4 gap-y-2">{activeAttendee.x_handle ? <a href={`https://x.com/${activeAttendee.x_handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-white"><XLogo size={14} /> @{activeAttendee.x_handle}</a> : null}{activeAttendee.cursor_handle ? <a href={`https://cursor.com/@${activeAttendee.cursor_handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-white"><Cursor size={14} /> @{activeAttendee.cursor_handle}</a> : null}{activeAttendee.github_handle ? <a href={`https://github.com/${activeAttendee.github_handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-white"><GithubLogo size={14} /> {activeAttendee.github_handle}</a> : null}{!activeAttendee.x_handle && !activeAttendee.cursor_handle && !activeAttendee.github_handle ? <span className="text-white/45">No public handles</span> : null}</div></Cell><Cell label="Connection count" className="sm:col-span-2 sm:border-b-0">{activeAttendee.connection_count} {activeAttendee.connection_count === 1 ? 'connection' : 'connections'}</Cell></div></div>
        <CursorUsage handle={activeAttendee.cursor_handle} />
        <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setShowShareCard((value) => !value)}><ShareNetwork size={16} /> {showShareCard ? 'Hide card' : 'Share card'}</Button></div>
        {notice ? <p className="mt-4 text-sm text-[var(--muted)]">{notice}</p> : null}
        {showShareCard ? <div className="mt-6"><ShareCard attendee={activeAttendee} url={profileUrl} shareText={shareText} /></div> : null}
      </div>
      <aside className="space-y-8 lg:pt-2">
        <div className="border-t border-[var(--line-strong)] pt-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Your QR</p><QrCodeIcon size={22} className="text-[var(--muted)]" /></div><div className="mt-5 flex flex-col items-center gap-4 border-y border-[var(--line-strong)] bg-[var(--sand)] px-5 py-7"><QrCode value={profileUrl} size={210} /><p className="max-w-[280px] break-all text-center font-mono text-[11px] leading-relaxed text-[var(--muted)]">{profileUrl}</p><Button variant="secondary" onClick={() => void copyLink()}><Copy size={15} /> Copy link</Button></div></div>
        {editing ? <ProfileEditor initial={form} attendeeId={activeAttendee.id} token={activeSession.token} onSaved={handleSaved} onCancel={() => setEditing(false)} onError={(message) => setNotice(message)} /> : <div className="border-t border-[var(--line-strong)] pt-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Connections made</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{activeAttendee.connection_count}</h2><div className="mt-4"><ConnectionList connections={activeAttendee.connections} /></div></div>}
        <div className="border-t border-[var(--line-strong)] pt-5"><button onClick={() => void remove()} className="inline-flex items-center gap-2 text-xs font-semibold text-[#A94B3B] transition hover:text-[#7D2F24]"><Trash size={15} /> Delete my profile</button><p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">This removes your public card and recorded connections.</p></div>
      </aside>
    </div>
  </section>;
}

function toForm(attendee: Attendee): UpdateAttendeeInput {
  return { name: attendee.name, x_handle: attendee.x_handle ?? '', cursor_handle: attendee.cursor_handle ?? '', github_handle: attendee.github_handle ?? '', avatar_url: attendee.avatar_url ?? '', project: attendee.project, looking_for: attendee.looking_for ?? '', outfit_clue: attendee.outfit_clue ?? '', venue_zone: attendee.venue_zone ?? 'Workshop', open_to_meet: attendee.open_to_meet, variant: attendee.avatar_variant, avatar_mode: attendee.avatar_mode };
}

function Cell({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`border-b border-white/15 p-6 last:border-b-0 ${className}`}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p><div className="mt-3 text-sm leading-relaxed text-white/80">{children}</div></div>;
}
