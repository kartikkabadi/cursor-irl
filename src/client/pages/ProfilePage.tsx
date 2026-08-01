import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, GithubLogo, LinkSimple, QrCode as QrCodeIcon, ShareNetwork, UsersThree, XLogo } from '@phosphor-icons/react';
import type { AttendeeDetail } from '../../shared/attendee';
import { ApiError, absoluteUrl, connectAttendees, getAttendee } from '../api';
import { ConnectionList } from '../components/ConnectionList';
import { CursorPointer } from '../components/CursorPointer';
import { DitherprintAvatar } from '../components/DitherprintAvatar';
import { QrCode } from '../components/QrCode';
import { ShareCard } from '../components/ShareCard';
import { Button, StatusPill, buttonClass } from '../components/ui';
import { getProfileSession } from '../storage';

export function ProfilePage() {
  const { slug = '' } = useParams();
  const [attendee, setAttendee] = useState<AttendeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connecting, setConnecting] = useState(false);
  const session = getProfileSession();
  const profileUrl = useMemo(() => absoluteUrl(`p/${slug}`), [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getAttendee(slug).then((result) => {
      if (!cancelled) setAttendee(result.attendee);
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Could not load that cursor.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const shareText = useMemo(() => {
    if (!attendee) return '';
    const zone = attendee.venue_zone ?? 'in the room';
    const clue = attendee.outfit_clue ? ` / ${attendee.outfit_clue}` : '';
    return `I'm the ${colorName(attendee.cursor_color)} ${attendee.cursor_code} cursor at Cursor Roadshow Bangalore. Building: ${attendee.project} Follow @${attendee.x_handle} to find me online. Find me: ${zone}${clue} Come say hi: ${profileUrl}`;
  }, [attendee, profileUrl]);
  const postUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;

  async function meet() {
    if (!attendee || !session) { setNotice('Join the room first so we know who made the connection.'); return; }
    if (session.id === attendee.id) { setNotice('That is your own cursor. Try someone across the room.'); return; }
    setConnecting(true); setNotice('');
    try { const result = await connectAttendees(session.id, session.token, attendee.id); setNotice(result.created ? 'Met IRL. Nice one.' : 'Already connected — still counts.'); }
    catch (caught) { setNotice(caught instanceof ApiError ? caught.message : 'Could not record that connection.'); }
    finally { setConnecting(false); }
  }

  async function share() {
    if (!attendee) return;
    if (navigator.share) await navigator.share({ title: `${attendee.name} · Cursor IRL`, text: shareText, url: profileUrl }).catch(() => undefined);
    else { await navigator.clipboard?.writeText(`${shareText}\n${profileUrl}`); setNotice('Share text copied.'); }
  }

  async function copyLink() { await navigator.clipboard?.writeText(profileUrl); setNotice('Profile link copied.'); }

  if (loading) return <ProfileSkeleton />;
  if (error || !attendee) return <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-8"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[16px] bg-[var(--sand)]"><CursorPointer color="#F08A69" code="?" size="sm" animated={false} /></div><h1 className="text-3xl font-semibold tracking-[-0.06em]">That cursor is not in the room.</h1><p className="mt-3 text-sm text-[var(--muted)]">{error || 'The profile may have been deleted.'}</p><Link to="/" className={`${buttonClass('primary')} mt-7`}>Back to room</Link></div>;

  return <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-10 sm:px-8 sm:pt-16"><Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"><ArrowLeft size={15} /> Back to the room</Link><div className="grid gap-12 lg:grid-cols-[1.12fr_.88fr] lg:gap-20"><div><div className="find-card relative overflow-hidden border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"><div className="absolute -right-2 top-6 opacity-95 sm:right-8 sm:top-8"><DitherprintAvatar profileId={attendee.id} variant={attendee.avatar_variant} size={112} rounded /></div><div className="relative max-w-2xl p-6 sm:p-10"><div className="flex flex-wrap items-center gap-2"><StatusPill active={attendee.active_now}>{attendee.active_now ? 'here now' : 'away'}</StatusPill><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">cursor {attendee.cursor_code}</span>{attendee.venue_zone ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{attendee.venue_zone}</span> : null}</div><h1 className="mt-20 max-w-[620px] text-[clamp(3.5rem,9vw,7.8rem)] font-semibold leading-[.86] tracking-[-0.09em]">{attendee.name}<span className="text-[var(--accent)]">.</span></h1><p className="mt-7 max-w-xl text-xl leading-snug text-white/70">{attendee.project}</p></div><div className="grid gap-0 border-t border-white/15 sm:grid-cols-2"><Info label="Find me" value={attendee.outfit_clue || 'Ask for this cursor.'} className="sm:border-b sm:border-r" /><Info label="Zone" value={attendee.venue_zone || 'Somewhere in the room'} className="sm:border-b" /><Info label="Looking for" value={attendee.looking_for || 'A good conversation'} className="sm:border-b-0 sm:border-r" /><Info label="Handles" className="sm:border-b-0"><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{attendee.x_handle ? <a href={`https://x.com/${attendee.x_handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-white"><XLogo size={14} /> @{attendee.x_handle}</a> : null}{attendee.github_handle ? <a href={`https://github.com/${attendee.github_handle}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-white"><GithubLogo size={14} /> {attendee.github_handle}</a> : null}{!attendee.x_handle && !attendee.github_handle ? <span className="text-white/45">No public handles</span> : null}</div></Info></div></div><div className="mt-5 flex flex-wrap gap-3">{session?.id === attendee.id ? <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-white/45 px-5 text-sm font-semibold text-[var(--muted)]"><Check size={16} weight="bold" className="text-[#5C9C77]" /> This is you</span> : <Button onClick={() => void meet()} loading={connecting} className="flex-1"><UsersThree size={17} /> I met this person</Button>}<Button variant="secondary" onClick={() => void share()}><ShareNetwork size={17} /> Share card</Button><a href={postUrl} target="_blank" rel="noreferrer" className={buttonClass('ghost')}><XLogo size={16} /> Post on X</a><Button variant="ghost" onClick={() => void copyLink()} aria-label="Copy profile link"><Copy size={17} /></Button></div>{notice ? <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]"><Check size={16} weight="bold" className="text-[#5C9C77]" />{notice}</div> : null}</div><aside className="space-y-8 lg:pt-10"><div className="border-t border-[var(--line-strong)] pt-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Scan to find them</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Take this card with you.</h2></div><QrCodeIcon size={22} className="text-[var(--muted)]" /></div><div className="mt-6 flex flex-col items-center gap-5 border-y border-[var(--line-strong)] bg-[var(--sand)] px-5 py-7"><QrCode value={profileUrl} size={180} /><p className="max-w-[220px] text-center text-xs leading-relaxed text-[var(--muted)]">Point your camera here. The person behind <span className="font-mono">{attendee.cursor_code}</span> is one scan away.</p></div></div><div className="border-t border-[var(--line-strong)] pt-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Share card</p><div className="mt-4"><ShareCard attendee={attendee} url={profileUrl} shareText={shareText} /></div></div><div className="border-t border-[var(--line-strong)] pt-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Met IRL</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{attendee.connection_count} {attendee.connection_count === 1 ? 'connection' : 'connections'}</h2></div><LinkSimple size={22} className="text-[var(--muted)]" /></div><div className="mt-4"><ConnectionList connections={attendee.connections} /></div></div></aside></div></section>;
}

function Info({ label, value, children, className = '' }: { label: string; value?: string; children?: ReactNode; className?: string }) {
  return <div className={`border-b border-white/15 p-5 last:border-b-0 ${className}`}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>{children ?? <p className="mt-3 text-sm leading-relaxed text-white/80">{value}</p>}</div>;
}
function colorName(color: string) { const names: Record<string, string> = { '#F08A69': 'coral', '#6FB7A4': 'mint', '#7CA6D8': 'blue', '#B7A1D9': 'lavender', '#E5B95F': 'gold', '#E0785A': 'orange', '#77A7A8': 'teal', '#D792B1': 'rose' }; return names[color] || 'bright'; }
function ProfileSkeleton() { return <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8"><div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr]"><div className="skeleton-profile" /><div className="space-y-8"><div className="skeleton-line w-1/2" /><div className="skeleton-square" /></div></div></section>; }
