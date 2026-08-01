import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Cursor, Eye, GithubLogo, MapPin, XLogo } from '@phosphor-icons/react';
import type { CreateAttendeeInput, VenueZone } from '../../shared/attendee';
import { AVATAR_MODES, VENUE_ZONES } from '../../shared/attendee';
import type { DitherprintIdentity } from '../../shared/ditherprint';
import type { IdentityDraft } from '../storage';
import { clearIdentityDraft, getIdentityDraft, saveIdentityDraft, saveProfileSession } from '../storage';
import { ApiError, createAttendee, getIdentityPreview } from '../api';
import { DitherprintCandidateGrid, DitherprintPreview } from '../components/DitherprintCandidateGrid';
import { ArrowButton, Button, CheckMark, FieldLabel, TextArea, TextInput } from '../components/ui';

const initialForm: CreateAttendeeInput = { name: '', x_handle: '', github_handle: '', avatar_url: '', project: '', looking_for: '', outfit_clue: '', venue_zone: 'Workshop', open_to_meet: true, profile_id: '', variant: 0 };

export function JoinPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateAttendeeInput>(initialForm);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const set = <K extends keyof CreateAttendeeInput>(key: K, value: CreateAttendeeInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function loadDraft() {
    setIdentityLoading(true); setIdentityError('');
    const existing = getIdentityDraft();
    if (existing) {
      setDraft(existing);
      setSelectedVariant(0);
      setIdentityLoading(false);
      return;
    }
    try {
      const result = await getIdentityPreview();
      const fresh: IdentityDraft = { profile_id: result.profile_id, algorithm_version: result.algorithm_version, candidates: result.candidates };
      saveIdentityDraft(fresh);
      setDraft(fresh);
      setSelectedVariant(0);
    } catch {
      setIdentityError('Could not generate your identity. Check the connection and try again.');
    } finally {
      setIdentityLoading(false);
    }
  }

  useEffect(() => { void loadDraft(); }, []);

  const selectedIdentity = draft?.candidates.find((candidate) => candidate.variant === selectedVariant) ?? null;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Add your name.';
    if ((form.x_handle ?? '').trim().length < 1) next.x_handle = 'Add your X handle so people can find you online.';
    if (form.project.trim().length < 3) next.project = 'Tell the room what you are building.';
    if (form.avatar_url && !/^https?:\/\/.+/.test(form.avatar_url.trim())) next.avatar_url = 'Use a full image URL.';
    return next;
  }

  async function publish() {
    if (!draft) return;
    setPublishing(true); setSubmitError(''); setErrors({});
    try {
      const input: CreateAttendeeInput = {
        ...form,
        avatar_mode: form.avatar_url?.trim() ? 'photo-frame' : 'ditherprint',
        profile_id: draft.profile_id,
        variant: selectedVariant,
      };
      const result = await createAttendee(input);
      saveProfileSession(result.attendee.id, result.edit_token);
      clearIdentityDraft();
      navigate('/me');
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 409) {
          clearIdentityDraft();
          setDraft(null);
          setSubmitError('That identity draft was already used. Pick a fresh one.');
          void loadDraft();
        } else {
          setSubmitError(caught.message);
          setErrors(caught.details ?? {});
        }
      } else {
        setSubmitError('Could not publish your cursor. Try again.');
      }
    } finally {
      setPublishing(false);
    }
  }

  const avatarModeNote = useMemo(() => form.avatar_url?.trim() ? AVATAR_MODES[2] : AVATAR_MODES[0], [form.avatar_url]);

  return <section className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:pt-24"><div className="lg:sticky lg:top-28 lg:self-start"><Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"><ArrowLeft size={15} /> Back to the room</Link><div className="flex items-start gap-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] border border-[var(--line-strong)] bg-[var(--sand)]"><Cursor size={23} /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">New cursor / 01</p><h1 className="mt-2 text-5xl font-semibold leading-[.9] tracking-[-0.075em] sm:text-7xl">Make yourself<br /><span className="text-[var(--accent)]">findable.</span></h1></div></div><p className="mt-8 max-w-sm text-base leading-relaxed text-[var(--muted)]">A tiny profile is all it takes. Pick a clue people can actually use, then let the room do the rest.</p><div className="mt-8 space-y-2"><CheckMark>Public profile link</CheckMark><CheckMark>Personal cursor identity</CheckMark><CheckMark>QR card for your phone</CheckMark></div></div>
    <div className="min-w-0">{step === 'form' ? <form onSubmit={(event) => { event.preventDefault(); const next = validate(); if (Object.keys(next).length) setErrors(next); else { setErrors({}); setStep('preview'); } }} className="space-y-8">
      <div className="border-t border-[var(--line-strong)] pt-5"><p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">01 / Your signal</p><div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><FieldLabel label="Name" htmlFor="name" hint="Required" /><TextInput id="name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="The name people should use" autoComplete="name" error={errors.name} /></div>
        <div className="space-y-2"><FieldLabel label="X handle" htmlFor="x_handle" hint="Required" /><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">@</span><TextInput id="x_handle" className="pl-7" value={form.x_handle} onChange={(event) => set('x_handle', event.target.value)} placeholder="yourhandle" autoComplete="off" error={errors.x_handle} /></div></div>
      </div></div>
      <div className="border-t border-[var(--line-strong)] pt-5"><p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">02 / Your reason</p><div className="space-y-2"><FieldLabel label="What are you building?" htmlFor="project" hint="Required · one clear line" /><TextArea id="project" value={form.project} onChange={(event) => set('project', event.target.value)} placeholder="An offline-first field notes app for researchers" error={errors.project} /></div></div>
      <details className="group border-t border-[var(--line-strong)] pt-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] [&::-webkit-details-marker]:hidden"><span>Add optional details</span><ArrowUpRight size={15} className="transition group-open:rotate-90" /></summary><div className="mt-6 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><FieldLabel label="GitHub handle" htmlFor="github_handle" hint="Optional" /><div className="relative"><GithubLogo size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><TextInput id="github_handle" className="pl-9" value={form.github_handle} onChange={(event) => set('github_handle', event.target.value)} placeholder="yourgithub" autoComplete="off" /></div></div><div className="space-y-2"><FieldLabel label="Photo URL" htmlFor="avatar_url" hint="Optional" /><TextInput id="avatar_url" value={form.avatar_url} onChange={(event) => set('avatar_url', event.target.value)} placeholder="https://..." inputMode="url" error={errors.avatar_url} /></div></div><div className="space-y-2"><FieldLabel label="Who do you want to meet?" htmlFor="looking_for" hint="Optional" /><TextArea id="looking_for" value={form.looking_for} onChange={(event) => set('looking_for', event.target.value)} placeholder="People building with agents, voice, or a lot of curiosity" className="min-h-24" /></div><div className="border-t border-[var(--line)] pt-5"><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Find me in the room</p><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><FieldLabel label="Outfit or find-me clue" htmlFor="outfit_clue" hint="Optional" /><TextInput id="outfit_clue" value={form.outfit_clue} onChange={(event) => set('outfit_clue', event.target.value)} placeholder="Black shirt, silver laptop" /></div><div className="space-y-2"><FieldLabel label="Broad venue zone" htmlFor="venue_zone" hint="Optional" /><div className="relative"><select id="venue_zone" className="field-input appearance-none pr-10" value={form.venue_zone} onChange={(event) => set('venue_zone', event.target.value as VenueZone)}>{VENUE_ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select><MapPin size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /></div></div></div></div></div></details>
      <div className="border-t border-[var(--line-strong)] pt-5"><p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">04 / Your identity</p>{identityLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[132px] skeleton-square" />)}</div> : identityError ? <div className="flex flex-col items-start gap-3 border border-[#D3A296] bg-[#FFF4EF] px-4 py-3 text-sm text-[#8E392D]"><span>{identityError}</span><Button variant="ghost" onClick={() => void loadDraft()}>Retry</Button></div> : draft ? <div className="space-y-4"><DitherprintCandidateGrid candidates={draft.candidates} selectedVariant={selectedVariant} onSelect={setSelectedVariant} /><p className="text-xs leading-relaxed text-[var(--muted)]">Six deterministic patterns generated from a server-side identity seed. The pattern and fingerprint are fixed the moment you publish. Mode: {avatarModeNote === 'photo-frame' ? 'photo framed by identity' : 'identity only'}.</p></div> : null}</div>
      <div className="flex items-start gap-3 border-t border-[var(--line-strong)] pt-5"><button type="button" role="switch" aria-checked={form.open_to_meet} onClick={() => set('open_to_meet', !form.open_to_meet)} className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full border p-0.5 transition ${form.open_to_meet ? 'justify-end border-[var(--ink)] bg-[var(--ink)]' : 'justify-start border-[var(--line-strong)] bg-[var(--sand)]'}`}><span className={`h-4 w-4 rounded-full ${form.open_to_meet ? 'bg-[var(--paper)]' : 'bg-[var(--muted)]'}`} /></button><div><p className="text-sm font-semibold">Open to meet</p><p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">Show a small invitation on your card. You can turn it off later.</p></div></div>{submitError ? <div className="border border-[#D3A296] bg-[#FFF4EF] px-4 py-3 text-sm text-[#8E392D]">{submitError}</div> : null}<div className="flex flex-col gap-3 border-t border-[var(--line-strong)] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--muted)]">You can delete or edit this later from My card.</p><ArrowButton type="submit" disabled={!draft}>Preview your cursor</ArrowButton></div></form> : draft && selectedIdentity ? <Preview form={form} identity={selectedIdentity} onBack={() => setStep('form')} onPublish={publish} publishing={publishing} /> : null}</div>
  </section>;
}

function Preview({ form, identity, onBack, onPublish, publishing }: { form: CreateAttendeeInput; identity: DitherprintIdentity; onBack: () => void; onPublish: () => void; publishing: boolean }) {
  return <div className="space-y-8"><div className="flex items-center justify-between border-t border-[var(--line-strong)] pt-5"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Preview / before you publish</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">This is how the room will find you.</h2></div><Eye size={24} className="hidden text-[var(--muted)] sm:block" /></div><div className="find-card overflow-hidden border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"><div className="flex items-start justify-between gap-6 border-b border-white/15 p-6 sm:p-8"><div><span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-[#7FC297]" /> Cursor Roadshow / Bangalore</span><h3 className="mt-10 max-w-xl text-5xl font-semibold leading-[.9] tracking-[-0.075em] sm:text-7xl">{form.name || 'Your name'}<span className="text-[var(--accent)]">.</span></h3><p className="mt-5 max-w-lg text-lg leading-snug text-white/68">{form.project || 'Your one-line project will live here.'}</p></div><DitherprintPreview identity={identity} size={120} /></div><div className="flex flex-wrap items-center gap-3 border-b border-white/15 p-6 sm:p-8"><p className="font-mono text-xs tracking-[0.1em] text-white/70">cursor {identity.fingerprint}</p><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: identity.primary }} /><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: identity.background }} /></div><div className="grid gap-0 sm:grid-cols-3"><div className="border-b border-white/15 p-6 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Find me</p><p className="mt-3 text-sm leading-relaxed text-white/82">{form.outfit_clue || 'Add an outfit or physical clue.'}</p></div><div className="border-b border-white/15 p-6 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Zone</p><p className="mt-3 text-sm text-white/82">{form.venue_zone}</p></div><div className="p-6"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Looking for</p><p className="mt-3 text-sm leading-relaxed text-white/82">{form.looking_for || 'Open to a good conversation.'}</p></div></div><div className="flex items-center justify-between gap-4 border-t border-white/15 p-6 sm:p-8"><div className="flex items-center gap-2 text-white/50"><XLogo size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em]">{form.x_handle ? `@${form.x_handle}` : 'no X handle'}</span></div>{form.open_to_meet ? <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-[#7FC297]" />open to meet</span> : null}</div></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" onClick={onBack} disabled={publishing}><ArrowLeft size={15} /> Back to form</Button><ArrowButton onClick={onPublish} loading={publishing} disabled={publishing}>Publish your cursor</ArrowButton></div></div>;
}
