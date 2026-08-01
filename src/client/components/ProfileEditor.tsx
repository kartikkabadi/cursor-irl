import { useState } from 'react';
import { Check, FloppyDisk } from '@phosphor-icons/react';
import type { Attendee, UpdateAttendeeInput, VenueZone } from '../../shared/attendee';
import { AVATAR_MODES, VENUE_ZONES } from '../../shared/attendee';
import type { DitherprintIdentity } from '../../shared/ditherprint';
import { DITHERPRINT_CANDIDATE_COUNT } from '../../shared/ditherprint';
import { ApiError, updateAttendee } from '../api';
import { DitherprintAvatar } from './DitherprintAvatar';
import { Button, FieldLabel, TextArea, TextInput } from './ui';

type ProfileEditorProps = {
  initial: UpdateAttendeeInput;
  attendeeId: string;
  token: string;
  onSaved: (attendee: Attendee) => void;
  onCancel: () => void;
  onError: (message: string) => void;
};

export function ProfileEditor({ initial, attendeeId, token, onSaved, onCancel, onError }: ProfileEditorProps) {
  const [form, setForm] = useState<UpdateAttendeeInput>({ ...initial });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof UpdateAttendeeInput>(key: K, value: UpdateAttendeeInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const identityVariant = form.variant ?? 0;
  const mode = form.avatar_mode ?? (form.avatar_url ? 'photo-frame' : 'ditherprint');

  async function save() {
    setSaving(true);
    try {
      const result = await updateAttendee(attendeeId, token, { ...form, variant: identityVariant, avatar_mode: mode });
      onSaved(result.attendee);
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : 'Could not save your card.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="border-t border-[var(--line-strong)] pt-5"><div className="mb-5 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Edit signal</p><FloppyDisk size={18} className="text-[var(--muted)]" /></div>
    <div className="space-y-4">
      <div className="space-y-2"><FieldLabel label="Name" htmlFor="edit-name" /><TextInput id="edit-name" value={form.name ?? ''} onChange={(event) => set('name', event.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><FieldLabel label="X handle" htmlFor="edit-x" /><TextInput id="edit-x" value={form.x_handle ?? ''} onChange={(event) => set('x_handle', event.target.value)} /></div>
        <div className="space-y-2"><FieldLabel label="GitHub handle" htmlFor="edit-github" /><TextInput id="edit-github" value={form.github_handle ?? ''} onChange={(event) => set('github_handle', event.target.value)} /></div>
      </div>
      <div className="space-y-2"><FieldLabel label="Cursor handle" htmlFor="edit-cursor" hint="Optional" /><TextInput id="edit-cursor" value={form.cursor_handle ?? ''} onChange={(event) => set('cursor_handle', event.target.value)} placeholder="kartik" /><p className="text-[11px] text-[var(--muted)]">Links to cursor.com/@handle.</p></div>
      <div className="space-y-2"><FieldLabel label="Photo URL" htmlFor="edit-avatar" hint="Optional" /><TextInput id="edit-avatar" value={form.avatar_url ?? ''} onChange={(event) => set('avatar_url', event.target.value)} placeholder="https://..." inputMode="url" /><p className="text-[11px] text-[var(--muted)]">A public image URL, framed by your identity.</p></div>
      <div className="space-y-2"><FieldLabel label="Project" htmlFor="edit-project" /><TextArea id="edit-project" value={form.project ?? ''} onChange={(event) => set('project', event.target.value)} className="min-h-20" /></div>
      <div className="space-y-2"><FieldLabel label="Who do you want to meet?" htmlFor="edit-looking" hint="Optional" /><TextArea id="edit-looking" value={form.looking_for ?? ''} onChange={(event) => set('looking_for', event.target.value)} className="min-h-20" /></div>
      <div className="space-y-2"><FieldLabel label="Outfit or find-me clue" htmlFor="edit-clue" /><TextInput id="edit-clue" value={form.outfit_clue ?? ''} onChange={(event) => set('outfit_clue', event.target.value)} /></div>
      <div className="space-y-2"><FieldLabel label="Broad venue zone" htmlFor="edit-zone" /><select id="edit-zone" value={form.venue_zone ?? 'Workshop'} onChange={(event) => set('venue_zone', event.target.value as VenueZone)} className="field-input">{VENUE_ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select></div>
      <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">Open to meet</span><button type="button" role="switch" aria-checked={Boolean(form.open_to_meet)} onClick={() => set('open_to_meet', !form.open_to_meet)} aria-label="Toggle open to meet" className={`h-6 w-10 rounded-full border p-0.5 transition ${form.open_to_meet ? 'border-[var(--ink)] bg-[var(--ink)]' : 'border-[var(--line-strong)] bg-[var(--sand)]'}`}><span className={`block h-4 w-4 rounded-full transition-all ${form.open_to_meet ? 'ml-auto bg-[var(--paper)]' : 'bg-[var(--muted)]'}`} /></button></div>
      <div className="space-y-2 border-t border-[var(--line)] pt-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Identity pattern</p><div className="flex flex-wrap gap-2">{Array.from({ length: DITHERPRINT_CANDIDATE_COUNT }).map((_, variant) => { const selected = identityVariant === variant; return <button key={variant} type="button" onClick={() => set('variant', variant)} aria-pressed={selected} aria-label={`Identity variant ${variant + 1}`} className={`border p-1.5 transition ${selected ? 'border-[var(--ink)] bg-white/70' : 'border-[var(--line-strong)] bg-white/35 hover:border-[var(--ink)]'}`}><DitherprintAvatar profileId={attendeeId} variant={variant} size={48} /></button>; })}</div><p className="text-[11px] text-[var(--muted)]">Changing the pattern updates your fingerprint.</p></div>
      <div className="space-y-2"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Avatar mode</p><div className="grid gap-2 sm:grid-cols-2">{AVATAR_MODES.filter((value) => value !== 'photo').map((value) => { const selected = mode === value; return <button key={value} type="button" onClick={() => set('avatar_mode', value)} aria-pressed={selected} className={`flex min-h-11 items-center justify-between gap-2 border px-3 text-left text-xs font-semibold transition ${selected ? 'border-[var(--ink)] bg-white/70' : 'border-[var(--line-strong)] bg-white/35 hover:border-[var(--ink)]'}`}><span>{value === 'ditherprint' ? 'Identity pattern' : 'Photo plus identity frame'}</span>{selected ? <Check size={14} weight="bold" /> : null}</button>; })}</div>{mode === 'photo-frame' && !form.avatar_url ? <p className="text-xs text-[#A94B3B]">Add a photo URL above to use this mode.</p> : null}</div>
    </div>
    <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => void save()} loading={saving}>Save changes</Button><Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button></div>
  </div>;
}
